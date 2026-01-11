// src/pages/AddNewProperty.jsx
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleMap, LoadScript, Autocomplete, Marker } from "@react-google-maps/api";
import { toast } from "react-toastify";
import "./AddNewProperty.css";

const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "8px"
};

const defaultCenter = {
  lat: 18.5204,
  lng: 73.8567 // Pune, India default center
};

function AddNewProperty() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    address: "",
    lat: "",
    lng: "",
    images: [],
    tenantType: "",
    rentingOption: "",
    services: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const autocompleteRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log("Location access denied, using default");
        }
      );
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.name === "images") {
      const files = [...e.target.files];
      setFormData({
        ...formData,
        images: files,
      });
      
      // Create preview URLs for images
      const previews = files.map(file => URL.createObjectURL(file));
      setPreviewImages(previews);
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address;

        setFormData({
          ...formData,
          address: address,
          location: address,
          lat: lat.toString(),
          lng: lng.toString()
        });

        setMapCenter({ lat, lng });
        setSelectedLocation({ lat, lng });
      }
    }
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setFormData({
      ...formData,
      lat: lat.toString(),
      lng: lng.toString()
    });

    setSelectedLocation({ lat, lng });

    // Reverse geocode to get address
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          setFormData(prev => ({
            ...prev,
            address: results[0].formatted_address,
            location: results[0].formatted_address
          }));
        }
      });
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.services || !formData.location) {
      toast.error("Please fill in services and location first");
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const amenities = typeof formData.services === 'string' 
        ? formData.services.split(',').map(s => s.trim())
        : formData.services;

      const response = await axios.post(
        "http://localhost:5000/api/ai/generate-description",
        {
          amenities,
          location: formData.location || formData.address,
          price: formData.price,
          tenantType: formData.tenantType
        },
        {
          headers: {
            "x-access-token": token
          }
        }
      );

      setFormData({
        ...formData,
        description: response.data.description
      });

      toast.success("✨ Description generated successfully!");
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Failed to generate description. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!formData.lat || !formData.lng) {
      toast.error("Please select a location on the map");
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("address", formData.address || formData.location);
    data.append("location", formData.address || formData.location);
    data.append("lat", formData.lat);
    data.append("lng", formData.lng);
    data.append("tenantType", formData.tenantType);
    data.append("rentingOption", formData.rentingOption);
    data.append("services", formData.services);

    if (formData.images && formData.images.length > 0) {
      formData.images.forEach((image) => data.append("images", image));
    }

    try {
      const token = localStorage.getItem("token");
      
      // Check if token is expired
      if (!token || checkTokenExpiry(token)) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      
      await axios.post("http://localhost:5000/api/properties", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-access-token": token,
        },
      });
      
      toast.success("✅ Property added successfully!");
      navigate("/properties");
    } catch (error) {
      console.error("❌ Error adding property:", error);
      toast.error(error.response?.data?.error || "❌ Failed to add property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkTokenExpiry = (token) => {
    if (!token) return true;
    
    try {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      const expiry = decodedToken.exp;
      const now = Math.floor(Date.now() / 1000);
      return expiry < now;
    } catch {
      return true;
    }
  };
  
  const handleCancel = () => {
    navigate("/");
  };
  
  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
      libraries={libraries}
    >
      <div className="add-property-container" id="add-property-page">
        <div className="content-wrapper">
          {/* Text Section */}
          <div className="background-text">
            <h1 className="title-heading">List Your Property</h1>
            <p className="subtitle-text">Turn your space into a profitable rental opportunity</p>
            <div className="benefits-list">
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span>Reach thousands of potential tenants</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span>Manage bookings efficiently</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span>Secure payment processing</span>
              </div>
            </div>
          </div>
          
          {/* Form Section */}
          <div className="form-container">
            <form onSubmit={handleSubmit} className="add-property-form">
              <h2 className="form-title">Add Your Property Details</h2>
              
              <div className="form-group">
                <label htmlFor="title">Property Title</label>
                <input 
                  type="text" 
                  id="title"
                  name="title" 
                  placeholder="e.g. Cozy Downtown Apartment" 
                  value={formData.title}
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">
                  Description
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                    className="magic-write-btn"
                    style={{
                      marginLeft: "10px",
                      padding: "5px 15px",
                      fontSize: "12px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: isGenerating ? "not-allowed" : "pointer",
                      opacity: isGenerating ? 0.7 : 1
                    }}
                  >
                    {isGenerating ? "✨ Generating..." : "✨ Magic Write (AI)"}
                  </button>
                </label>
                <textarea 
                  id="description"
                  name="description" 
                  placeholder="Describe your property or use Magic Write to auto-generate..." 
                  value={formData.description}
                  onChange={handleChange} 
                  required
                  rows="4"
                ></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Rent/Month</label>
                  <div className="input-with-icon">
                    <span className="input-icon">₹</span>
                    <input 
                      type="number" 
                      id="price"
                      name="price" 
                      placeholder="Amount" 
                      value={formData.price}
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="tenantType">Tenant Type</label>
                  <select 
                    id="tenantType"
                    name="tenantType" 
                    value={formData.tenantType}
                    onChange={handleChange} 
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Students">Students</option>
                    <option value="Families">Families</option>
                    <option value="Professionals">Professionals</option>
                    <option value="Anyone">Anyone</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="rentingOption">Renting Option</label>
                  <select 
                    id="rentingOption"
                    name="rentingOption" 
                    value={formData.rentingOption}
                    onChange={handleChange} 
                    required
                  >
                    <option value="">Select option</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <Autocomplete
                  onLoad={(autocomplete) => {
                    autocompleteRef.current = autocomplete;
                  }}
                  onPlaceChanged={handlePlaceSelect}
                >
                  <input 
                    type="text" 
                    id="location"
                    name="location" 
                    placeholder="Search address or click on map" 
                    value={formData.location}
                    onChange={handleChange}
                    className="autocomplete-input"
                    required
                  />
                </Autocomplete>
                <input 
                  type="hidden" 
                  name="address" 
                  value={formData.address}
                />
                <input 
                  type="hidden" 
                  name="lat" 
                  value={formData.lat}
                />
                <input 
                  type="hidden" 
                  name="lng" 
                  value={formData.lng}
                />
              </div>

              <div className="form-group">
                <label>Select Location on Map</label>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={13}
                  onClick={handleMapClick}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                  }}
                >
                  {selectedLocation && (
                    <Marker
                      position={selectedLocation}
                      draggable={true}
                      onDragEnd={(e) => {
                        const lat = e.latLng.lat();
                        const lng = e.latLng.lng();
                        setFormData(prev => ({
                          ...prev,
                          lat: lat.toString(),
                          lng: lng.toString()
                        }));
                        setSelectedLocation({ lat, lng });
                      }}
                    />
                  )}
                </GoogleMap>
                {formData.lat && formData.lng && (
                  <p style={{ marginTop: "5px", fontSize: "12px", color: "#666" }}>
                    Coordinates: {parseFloat(formData.lat).toFixed(6)}, {parseFloat(formData.lng).toFixed(6)}
                  </p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="services">Services/Amenities</label>
                <input 
                  type="text" 
                  id="services"
                  name="services" 
                  placeholder="e.g. WiFi, Parking, Laundry, AC, Gym (comma-separated)" 
                  value={formData.services}
                  onChange={handleChange} 
                  required 
                />
                <small style={{ display: "block", marginTop: "5px", color: "#666" }}>
                  Fill this to use Magic Write feature
                </small>
              </div>
              
              <div className="form-group">
                <label htmlFor="images">Property Images</label>
                <div className="file-upload-container">
                  <label htmlFor="images" className="file-upload-label">
                    <span className="upload-icon">📷</span>
                    <span>Choose Files</span>
                  </label>
                  <input 
                    type="file" 
                    id="images"
                    name="images" 
                    multiple 
                    accept="image/*" 
                    onChange={handleChange} 
                    required 
                    className="file-input"
                  />
                </div>
                
                {previewImages.length > 0 && (
                  <div className="image-preview-container">
                    {previewImages.map((preview, index) => (
                      <div key={index} className="preview-image">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isSubmitting || !formData.lat || !formData.lng}
                >
                  {isSubmitting ? 'Adding Property...' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </LoadScript>
  );
}

export default AddNewProperty;
