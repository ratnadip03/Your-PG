const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// --- 1. DEFINE SCHEMAS (MATCHING server.js) ---
const collegeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    location: { type: String, required: true }, // String format: "Akurdi, Pune"
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    image: String,
    type: { type: String, enum: ["University", "College", "Institute"], default: "College" },
    createdAt: { type: Date, default: Date.now }
});

const propertySchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    
    location: { type: String, required: true }, // String format: "Akurdi, Pune"
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },

    // Geospatial indexing for location-based queries
    geoLocation: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], default: [0, 0] }
    },

    // Link to nearby colleges
    nearbyColleges: [{
        collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
        collegeName: String,
        distance: Number // Distance in kilometers
    }],

    images: [String],
    type: String, // "Boys", "Girls", "Unisex"
    amenities: [String],
    collegeName: String, // Associated college name
    tenantType: String,
    rentingOption: String,
    services: [String],
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    // Rating & Reviews
    reviews: [],
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    
    createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to update geoLocation from latitude/longitude
propertySchema.pre("save", function(next) {
    if (this.latitude && this.longitude) {
        this.geoLocation = {
            type: "Point",
            coordinates: [this.longitude, this.latitude] // GeoJSON format: [longitude, latitude]
        };
    }
    next();
});

const College = mongoose.model('College', collegeSchema);
const Property = mongoose.model('Property', propertySchema);

// --- 2. THE DATA (As provided by user) ---
const colleges = [
    { 
        name: "D. Y. Patil College of Engineering", 
        address: "Akurdi, Pune",
        location: "Akurdi, Pune", 
        latitude: 18.6465, 
        longitude: 73.7599, 
        image: "https://images.shiksha.com/mediadata/images/1614925845phpv1z0s6.jpeg" 
    },
    { 
        name: "Vishwakarma Institute of Technology (VIT)", 
        address: "Bibwewadi, Pune",
        location: "Bibwewadi, Pune", 
        latitude: 18.4642, 
        longitude: 73.8677, 
        image: "https://www.vit.edu/images/slider/1.jpg" 
    },
    { 
        name: "College of Engineering Pune (COEP)", 
        address: "Shivajinagar, Pune",
        location: "Shivajinagar, Pune", 
        latitude: 18.5293, 
        longitude: 73.8565, 
        image: "https://www.coep.org.in/sites/default/files/COEP_Main_Building.jpg" 
    },
    { 
        name: "Symbiosis Institute of Technology", 
        address: "Lavale, Pune",
        location: "Lavale, Pune", 
        latitude: 18.5290, 
        longitude: 73.7290, 
        image: "https://sitpune.edu.in/assets/images/infra/1.jpg" 
    },
    { 
        name: "PCCOE", 
        address: "Nigdi, Pune",
        location: "Nigdi, Pune", 
        latitude: 18.6517, 
        longitude: 73.7615, 
        image: "http://www.pccoepune.com/images/slider/01.jpg" 
    }
];

const properties = [
    { 
        title: "Sai Student Residency", 
        location: "Akurdi, Pune", 
        latitude: 18.6490, 
        longitude: 73.7620, 
        price: 5000, 
        type: "Boys", 
        amenities: ["WiFi", "AC"], 
        collegeName: "D. Y. Patil College of Engineering", 
        images: ["/pg1.jpg"] 
    },
    { 
        title: "Sunshine Girls Hostel", 
        location: "Bibwewadi, Pune", 
        latitude: 18.4660, 
        longitude: 73.8690, 
        price: 7000, 
        type: "Girls", 
        amenities: ["CCTV", "Security"], 
        collegeName: "Vishwakarma Institute of Technology (VIT)", 
        images: ["/pg2.jpg"] 
    },
    { 
        title: "Metro View PG", 
        location: "Shivajinagar, Pune", 
        latitude: 18.5310, 
        longitude: 73.8580, 
        price: 8500, 
        type: "Boys", 
        amenities: ["WiFi", "Metro"], 
        collegeName: "College of Engineering Pune (COEP)", 
        images: ["/pg3.jpg"] 
    },
    { 
        title: "Hillside Comforts", 
        location: "Lavale, Pune", 
        latitude: 18.5300, 
        longitude: 73.7300, 
        price: 9000, 
        type: "Unisex", 
        amenities: ["WiFi", "Library"], 
        collegeName: "Symbiosis Institute of Technology", 
        images: ["/pg4.jpg"] 
    },
    { 
        title: "PCCOE Scholars Den", 
        location: "Nigdi, Pune", 
        latitude: 18.6530, 
        longitude: 73.7630, 
        price: 4500, 
        type: "Boys", 
        amenities: ["Mess", "Hot Water"], 
        collegeName: "PCCOE", 
        images: ["/pg5.jpg"] 
    }
];

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

// Calculate nearby colleges for a property
async function calculateNearbyColleges(propertyLat, propertyLng, allColleges) {
    const nearbyColleges = [];

    for (const college of allColleges) {
        const distance = calculateDistance(
            propertyLat, propertyLng,
            college.latitude, college.longitude
        );
        
        nearbyColleges.push({
            collegeId: college._id,
            collegeName: college.name,
            distance: parseFloat(distance.toFixed(2))
        });
    }

    // Sort by distance and return top 5 closest
    return nearbyColleges.sort((a, b) => a.distance - b.distance).slice(0, 5);
}

// --- 3. RESET AND SEED FUNCTION ---
const resetAndSeedDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB...");

        // Clear existing data
        await College.deleteMany({});
        await Property.deleteMany({});
        console.log("🧹 Cleared all existing Colleges and Properties...");

        // Insert Colleges
        const createdColleges = await College.insertMany(colleges);
        console.log(`✅ Inserted ${createdColleges.length} Colleges!`);

        // Create a map for quick college lookup by name
        const collegeMap = {};
        createdColleges.forEach(college => {
            collegeMap[college.name] = college;
        });

        // Insert Properties with nearby colleges calculated
        const propertiesWithNearbyColleges = await Promise.all(
            properties.map(async (prop) => {
                // Calculate nearby colleges
                const nearbyColleges = await calculateNearbyColleges(
                    prop.latitude, 
                    prop.longitude, 
                    createdColleges
                );

                return {
                    ...prop,
                    nearbyColleges: nearbyColleges,
                    tenantType: prop.type, // Map type to tenantType for compatibility
                    services: prop.amenities // Map amenities to services for compatibility
                };
            })
        );

        const createdProperties = await Property.insertMany(propertiesWithNearbyColleges);
        console.log(`✅ Inserted ${createdProperties.length} Properties!`);

        console.log("\n🎉 SUCCESS! Database reset complete!");
        console.log(`   - ${createdColleges.length} Colleges inserted`);
        console.log(`   - ${createdProperties.length} Properties inserted`);
        console.log("\n📊 Summary:");
        createdColleges.forEach(college => {
            console.log(`   College: ${college.name} (${college.location})`);
        });
        console.log("\n🏠 Properties:");
        createdProperties.forEach(prop => {
            console.log(`   ${prop.title} - ₹${prop.price}/month - ${prop.location}`);
        });

        process.exit(0);
    } catch (err) {
        console.error("❌ Error during database reset:", err);
        process.exit(1);
    }
};

// Run the reset
resetAndSeedDB();