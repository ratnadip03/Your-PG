const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// --- 1. DEFINE SCHEMAS ---
const collegeSchema = new mongoose.Schema({
    name: String,
    address: String,
    latitude: Number,
    longitude: Number,
    image: String
});

const propertySchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    type: String,
    amenities: [String],
    location: {
        address: String,
        lat: Number,
        lng: Number
    },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' }
});

const College = mongoose.model('College', collegeSchema);
const Property = mongoose.model('Property', propertySchema);

// --- 2. THE DATA (5 Colleges Now) ---
const colleges = [{
        name: "D. Y. Patil College of Engineering",
        address: "Akurdi, Pune",
        latitude: 18.6465,
        longitude: 73.7599,
        image: "https://images.shiksha.com/mediadata/images/1614925845phpv1z0s6.jpeg"
    },
    {
        name: "Vishwakarma Institute of Technology (VIT)",
        address: "Bibwewadi, Pune",
        latitude: 18.4642,
        longitude: 73.8677,
        image: "https://www.vit.edu/images/slider/1.jpg"
    },
    {
        name: "Sinhgad College of Engineering",
        address: "Vadgaon (Budruk), Pune",
        latitude: 18.4673,
        longitude: 73.8359,
        image: "https://cms.sinhgad.edu/media/362248/scoe_main.jpg"
    },
    {
        name: "College of Engineering Pune (COEP)",
        address: "Shivajinagar, Pune",
        latitude: 18.5293,
        longitude: 73.8565,
        image: "https://www.coep.org.in/sites/default/files/COEP_Main_Building.jpg"
    },
    {
        name: "JSPM Rajarshi Shahu College of Engineering",
        address: "Tathawade, Pune",
        latitude: 18.6200,
        longitude: 73.7394,
        image: "https://jspmrscoe.edu.in/assets/images/slider/slide1.jpg"
    }
];

// --- 3. SEED FUNCTION ---
const seedDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔥 Connected to DB...");

        // Clear existing data to avoid duplicates
        await College.deleteMany({});
        await Property.deleteMany({});
        console.log("🧹 Cleared old data...");

        // Insert Colleges
        const createdColleges = await College.insertMany(colleges);
        console.log(`✅ Added ${createdColleges.length} Colleges!`);

        // Get IDs to link PGs
        const dyPatilId = createdColleges[0]._id;
        const vitId = createdColleges[1]._id;
        const sinhgadId = createdColleges[2]._id;
        const coepId = createdColleges[3]._id;
        const jspmId = createdColleges[4]._id;

        const properties = [
            // DY Patil PG
            {
                title: "Sai Student Residency",
                description: "Premium student housing with WiFi and food. Walking distance to DY Patil.",
                price: 5000,
                type: "Boys",
                amenities: ["WiFi", "AC", "Food"],
                location: { address: "Akurdi, Pune", lat: 18.6490, lng: 73.7620 },
                collegeId: dyPatilId
            },
            // VIT PG
            {
                title: "Sunshine Girls Hostel",
                description: "Safe and secure hostel for girls near VIT campus.",
                price: 7000,
                type: "Girls",
                amenities: ["CCTV", "Security", "Laundry"],
                location: { address: "Bibwewadi, Pune", lat: 18.4660, lng: 73.8690 },
                collegeId: vitId
            },
            // Sinhgad PG
            {
                title: "Sinhgad Valley Hostels",
                description: "Budget friendly rooms for engineering students. 5 mins walk to campus.",
                price: 4500,
                type: "Co-ed",
                amenities: ["WiFi", "Hot Water", "Study Table"],
                location: { address: "Vadgaon Budruk, Pune", lat: 18.4690, lng: 73.8370 },
                collegeId: sinhgadId
            },
            // COEP PG (New)
            {
                title: "Shivajinagar Student Home",
                description: "Modern flat sharing near COEP Boat Club area. Easy access to Metro.",
                price: 8500,
                type: "Boys",
                amenities: ["WiFi", "No Restrictions", "Gym", "Metro Connectivity"],
                location: { address: "Shivajinagar, Pune", lat: 18.5310, lng: 73.8580 },
                collegeId: coepId
            },
            // JSPM PG (New)
            {
                title: "Tathawade Elite Hostel",
                description: "Luxury PG for JSPM students right on the highway. Includes mess.",
                price: 6000,
                type: "Girls",
                amenities: ["Mess Included", "Bus Stop Nearby", "WiFi"],
                location: { address: "Tathawade, Pune", lat: 18.6220, lng: 73.7410 },
                collegeId: jspmId
            }
        ];

        // Insert Properties
        await Property.insertMany(properties);
        console.log(`✅ Added ${properties.length} Properties!`);

        console.log("🎉 SUCCESS! All 5 Colleges and PGs are ready.");
        process.exit();
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
};

seedDB();