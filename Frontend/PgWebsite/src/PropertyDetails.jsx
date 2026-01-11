import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function PropertyDetails() {
    const { id } = useParams();
    const [property, setProperty] = useState(null);

    useEffect(() => {
        const fetchPropertyDetails = async () => {
            try {
                // Use the environment variable for URL if you have it, otherwise keep localhost
                const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                const response = await axios.get(`${apiUrl}/api/properties/${id}`); // Changed /property to /properties (Standard route)
                setProperty(response.data);
            } catch (error) {
                console.error("❌ Error fetching property details:", error);
            }
        };

        fetchPropertyDetails();
    }, [id]);

    if (!property) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="property-details p-5 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{property.title}</h1>
            
            {/* SAFE IMAGE HANDLING */}
            {property.images && property.images.length > 0 ? (
                <img 
                    src={`http://localhost:5000${property.images[0]}`} 
                    alt={property.title} 
                    className="w-full h-64 object-cover rounded-lg mb-4"
                />
            ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">No Image</div>
            )}

            {/* --- THE FIX IS HERE --- */}
            <p className="text-lg text-gray-700 mb-2">
                {/* We use ?.address to safely get the text inside the location object */}
                📍 {property.location?.address || "Address not available"}
            </p>
            {/* ----------------------- */}

            <p className="text-xl font-semibold text-green-600 mb-4">💰 ₹{property.price}</p>
            
            <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-bold mb-2">Description</h3>
                <p className="text-gray-600">{property.description}</p>
            </div>

             {/* Amenities Section (Optional Bonus) */}
            {property.amenities && (
                <div className="mt-4">
                    <h3 className="font-bold mb-2">Amenities</h3>
                    <div className="flex gap-2 flex-wrap">
                        {property.amenities.map((item, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PropertyDetails;