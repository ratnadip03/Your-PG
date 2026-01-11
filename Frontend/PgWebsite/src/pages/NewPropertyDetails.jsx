// src/pages/NewPropertyDetails.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaStar, FaMapMarkerAlt, FaRupeeSign } from "react-icons/fa";
import "./NewPropertyDetails.css";

function NewPropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ""
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/property/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setProperty(response.data);
      if (response.data.images && response.data.images.length > 0) {
        setSelectedImage(response.data.images[0]);
      }
    } catch (error) {
      console.error("❌ Error fetching property details:", error);
      toast.error("Failed to load property details");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to submit a review");
        return;
      }

      await axios.post(
        `http://localhost:5000/api/properties/${id}/reviews`,
        reviewForm,
        {
          headers: {
            "x-access-token": token
          }
        }
      );

      toast.success("Review submitted successfully!");
      setReviewForm({ rating: 5, comment: "" });
      setShowReviewForm(false);
      fetchPropertyDetails(); // Refresh property data
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar
        key={i}
        style={{
          color: i < rating ? "#FFD700" : "#ddd",
          fontSize: "20px"
        }}
      />
    ));
  };

  if (loading) {
    return (
      <div className="npd-loading-container">
        <div className="npd-loader"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  if (!property) return <div className="npd-error-message">Property not found</div>;

  return (
    <div className="npd-container" id="property-details-page">
      <div className="npd-details">
        <div className="npd-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <h1 className="npd-title">{property.title}</h1>
            {property.averageRating > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ fontSize: "24px", fontWeight: "bold" }}>{property.averageRating}</span>
                  <FaStar style={{ color: "#FFD700", fontSize: "20px" }} />
                </div>
                <span style={{ fontSize: "12px", color: "#666" }}>
                  ({property.totalReviews || 0} {property.totalReviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>
          <div className="npd-location">
            <FaMapMarkerAlt style={{ marginRight: "5px" }} />
            {property.location?.address || property.location}
          </div>
          {property.nearbyColleges && property.nearbyColleges.length > 0 && (
            <div style={{ marginTop: "10px", fontSize: "14px", color: "#667eea" }}>
              <strong>Nearby Colleges:</strong>
              {property.nearbyColleges.map((college, idx) => (
                <span key={idx} style={{ marginLeft: "8px" }}>
                  {college.collegeName} ({college.distance}km)
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="npd-images">
          <div className="npd-main-image-container">
            <img
              src={`http://localhost:5000${selectedImage}`}
              alt="Selected"
              className="npd-main-image"
            />
          </div>
          <div className="npd-thumbnails">
            {property.images.map((img, index) => (
              <img
                key={index}
                src={`http://localhost:5000${img}`}
                alt="Property"
                className={`npd-thumbnail ${selectedImage === img ? "npd-active" : ""}`}
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>
        </div>

        <div className="npd-info">
          <div className="npd-price-badge">
            <FaRupeeSign style={{ marginRight: "5px" }} />
            {property.price.toLocaleString('en-IN')}/month
          </div>

          <div className="npd-info-section">
            <h2 className="npd-section-title">Description</h2>
            <p className="npd-description">{property.description}</p>
          </div>

          <div className="npd-details-grid">
            <div className="npd-detail-item">
              <h3 className="npd-detail-title">Tenant Type</h3>
              <p className="npd-detail-value">{property.tenantType}</p>
            </div>
            <div className="npd-detail-item">
              <h3 className="npd-detail-title">Renting Option</h3>
              <p className="npd-detail-value">{property.rentingOption}</p>
            </div>
          </div>

          <div className="npd-services-section">
            <h2 className="npd-section-title">Services Included</h2>
            {property.services.length > 0 ? (
              <ul className="npd-services-list">
                {property.services.map((service, index) => (
                  <li key={index} className="npd-service-item">
                    <span className="npd-service-icon">✓</span> {service}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="npd-no-services">No additional services included</p>
            )}
          </div>

          {/* Reviews Section */}
          <div className="npd-reviews-section" style={{ marginTop: "30px", paddingTop: "30px", borderTop: "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 className="npd-section-title">Reviews & Ratings</h2>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                style={{
                  padding: "10px 20px",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                {showReviewForm ? "Cancel" : "Write a Review"}
              </button>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <form onSubmit={handleReviewSubmit} style={{
                background: "#f9f9f9",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px"
              }}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Rating: {reviewForm.rating} stars
                  </label>
                  <div style={{ display: "flex", gap: "5px", cursor: "pointer" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        style={{
                          color: star <= reviewForm.rating ? "#FFD700" : "#ddd",
                          fontSize: "24px",
                          cursor: "pointer"
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Your Review
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Share your experience..."
                    rows="4"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                      fontSize: "14px",
                      fontFamily: "inherit"
                    }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  style={{
                    padding: "10px 20px",
                    background: submittingReview ? "#ccc" : "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: submittingReview ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}

            {/* Reviews List */}
            {property.reviews && property.reviews.length > 0 ? (
              <div className="npd-reviews-list">
                {property.reviews.map((review, index) => (
                  <div
                    key={index}
                    style={{
                      background: "#fff",
                      padding: "15px",
                      borderRadius: "8px",
                      marginBottom: "15px",
                      border: "1px solid #eee"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div>
                        <strong>{review.userName || "Anonymous"}</strong>
                        <div style={{ display: "flex", gap: "3px", marginTop: "5px" }}>
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p style={{ margin: 0, color: "#333", lineHeight: "1.6" }}>{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
                No reviews yet. Be the first to review this property!
              </p>
            )}
          </div>

          <div className="npd-action-buttons" style={{ marginTop: "30px" }}>
            <button className="npd-contact-button" id="contact-owner-btn">Contact Owner</button>
            <button className="npd-save-button" id="save-property-btn">Save Property</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewPropertyDetails;