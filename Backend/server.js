const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();

/* ===================== BASIC MIDDLEWARE ===================== */

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"]
}));

app.use(express.json());

/* ===================== UPLOADS FOLDER SAFETY ===================== */

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use("/uploads", express.static(uploadDir));

/* ===================== SESSION & PASSPORT CONFIG ===================== */

app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
            // Check if user exists with this email
            user = await User.findOne({ email: profile.emails[0].value });
            
            if (user) {
                // Link Google account to existing user
                user.googleId = profile.id;
                user.profilePicture = profile.photos[0].value;
                await user.save();
            } else {
                // Create new user
                user = await User.create({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    profilePicture: profile.photos[0].value,
                    isVerified: true // Google accounts are pre-verified
                });
            }
        }
        
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

/* ===================== GEMINI AI INITIALIZATION ===================== */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ===================== MONGODB CONNECTION ===================== */

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(`✅ MongoDB Connected to ${mongoose.connection.name}`))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

/* ===================== USER SCHEMA ===================== */

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    isVerified: { type: Boolean, default: false },
    otp: String,
    otpExpires: Date,
    googleId: String, // For Google OAuth
    profilePicture: String // For Google OAuth profile picture
});

const User = mongoose.model("User", userSchema);

/* ===================== COLLEGE SCHEMA ===================== */

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

// Create geospatial index for college location
collegeSchema.index({ latitude: 1, longitude: 1 });

const College = mongoose.model("College", collegeSchema);

/* ===================== PROPERTY SCHEMA (GOOGLE MAPS READY) ===================== */

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
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
    reviews: [reviewSchema],
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    
    createdAt: { type: Date, default: Date.now }
});

// Create geospatial index for property location
propertySchema.index({ "geoLocation": "2dsphere" });
propertySchema.index({ latitude: 1, longitude: 1 });

// Pre-save hook to update geoLocation and calculate average rating
propertySchema.pre("save", function(next) {
    // Update geoLocation from latitude/longitude
    if (this.latitude && this.longitude) {
        this.geoLocation = {
            type: "Point",
            coordinates: [this.longitude, this.latitude] // GeoJSON format: [longitude, latitude]
        };
    }
    
    // Calculate average rating
    if (this.reviews && this.reviews.length > 0) {
        const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
        this.averageRating = parseFloat((sum / this.reviews.length).toFixed(1));
        this.totalReviews = this.reviews.length;
    }
    next();
});

const Property = mongoose.model("Property", propertySchema);

/* ===================== ROOMMATE SCHEMA ===================== */

const roommateSchema = new mongoose.Schema({
    name: String,
    age: Number,
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    profilePhoto: String,
    occupation: String,

    location: String,
    currentStay: String,

    preferredGender: { type: String, enum: ["Any", "Male", "Female"] },
    budget: Number,
    stayDuration: { type: String, default: "Flexible" },

    smoking: String,
    drinking: String,
    vegetarian: String,
    pets: String,
    workFromHome: Boolean,

    email: { type: String, unique: true },
    phone: { type: String, unique: true },

    socialMedia: {
        instagram: String,
        linkedin: String
    },

    languagesSpoken: [String],
    hobbies: [String],
    aboutMe: String,

    createdAt: { type: Date, default: Date.now }
});

const Roommate = mongoose.model("Roommate", roommateSchema);

/* ===================== MULTER CONFIG ===================== */

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

/* ===================== NODEMAILER ===================== */

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/* ===================== HELPERS ===================== */

const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = user =>
    jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token =
        (authHeader && authHeader.split(" ")[1]) ||
        req.headers["x-access-token"];

    if (!token) return res.status(401).json({ error: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Invalid token" });
        req.userId = decoded.id;
        next();
    });
};

/* ===================== AUTH ROUTES ===================== */

app.post("/register/send-otp", async(req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password)
        return res.status(400).json({ error: "All fields required" });

    if (await User.findOne({ email }))
        return res.status(400).json({ error: "Email already exists" });

    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        otp,
        otpExpires: Date.now() + 10 * 60 * 1000
    });

    await transporter.sendMail({
        to: email,
        subject: "PG-Connect OTP",
        html: `<b>Your OTP is ${otp}</b>`
    });

    res.json({ message: "OTP sent" });
});

app.post("/register/verify-otp", async(req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now())
        return res.status(400).json({ error: "Invalid OTP" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: "Account verified" });
});

app.post("/login", async(req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password)))
        return res.status(400).json({ error: "Invalid credentials" });

    if (!user.isVerified)
        return res.status(403).json({ error: "Verify account first" });

    res.json({ token: generateToken(user), user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
});

/* ===================== GOOGLE OAUTH ROUTES ===================== */

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/callback?token=${token}`);
});

app.get("/auth/logout", (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: "Logout failed" });
        res.json({ message: "Logged out successfully" });
    });
});

/* ===================== HELPER FUNCTIONS ===================== */

// Calculate distance between two coordinates (Haversine formula)
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
async function calculateNearbyColleges(propertyLat, propertyLng) {
    const colleges = await College.find();
    const nearbyColleges = [];

    for (const college of colleges) {
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

/* ===================== COLLEGE ROUTES ===================== */

app.post("/api/colleges", verifyToken, async(req, res) => {
    try {
        const { name, address, location, latitude, longitude, image, type } = req.body;
        
        if (!name || !location || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: "Name, location (string), latitude, and longitude are required" });
        }

        const college = await College.create({
            name,
            address: address || location,
            location: String(location), // Ensure it's a string
            latitude: Number(latitude),
            longitude: Number(longitude),
            image: image || "",
            type: type || "College"
        });

        res.status(201).json({ message: "College added", college });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/api/colleges", async(_, res) => {
    try {
        const colleges = await College.find();
        res.json(colleges);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/colleges/:id", async(req, res) => {
    try {
        const college = await College.findById(req.params.id);
        if (!college) return res.status(404).json({ error: "College not found" });
        res.json(college);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search properties by college
app.get("/api/properties/by-college/:collegeId", async(req, res) => {
    try {
        const college = await College.findById(req.params.collegeId);
        if (!college) return res.status(404).json({ error: "College not found" });

        const maxDistance = req.query.distance ? parseFloat(req.query.distance) : 10; // Default 10km

        // Find properties within radius using geospatial query
        const properties = await Property.find({
            geoLocation: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [college.longitude, college.latitude]
                    },
                    $maxDistance: maxDistance * 1000 // Convert km to meters
                }
            }
        });

        // Add distance information
        const propertiesWithDistance = properties.map(property => {
            const distance = calculateDistance(
                property.latitude, property.longitude,
                college.latitude, college.longitude
            );
            return {
                ...property.toObject(),
                distanceFromCollege: parseFloat(distance.toFixed(2))
            };
        });

        res.json(propertiesWithDistance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ===================== PROPERTY ROUTES ===================== */

app.post("/api/properties", verifyToken, upload.array("images"), async(req, res) => {
    try {
        const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
        const latitude = Number(req.body.lat || req.body.latitude);
        const longitude = Number(req.body.lng || req.body.longitude);
        const location = String(req.body.location || req.body.address || "");

        if (!latitude || !longitude || !location) {
            return res.status(400).json({ error: "Location (string), latitude, and longitude are required" });
        }

        // Calculate nearby colleges
        const nearbyColleges = await calculateNearbyColleges(latitude, longitude);

        // Parse services/amenities if it's a string
        const services = typeof req.body.services === 'string' 
            ? req.body.services.split(',').map(s => s.trim())
            : req.body.services || [];
        const amenities = typeof req.body.amenities === 'string'
            ? req.body.amenities.split(',').map(s => s.trim())
            : req.body.amenities || services || [];

        const property = new Property({
            title: req.body.title,
            description: req.body.description,
            price: Number(req.body.price),
            location: location,
            latitude: latitude,
            longitude: longitude,
            // geoLocation will be set automatically by pre-save hook
            nearbyColleges: nearbyColleges,
            images: images.length > 0 ? images : (req.body.images || []),
            type: req.body.type || req.body.tenantType || "",
            amenities: amenities,
            collegeName: req.body.collegeName || "",
            tenantType: req.body.tenantType,
            rentingOption: req.body.rentingOption,
            services: services,
            ownerId: req.userId
        });

        await property.save();
        res.status(201).json({ message: "Property added", property });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/api/properties", async(req, res) => {
    try {
        const { collegeId, maxDistance, minPrice, maxPrice, tenantType, services } = req.query;
        let query = {};

        // Filter by college
        if (collegeId) {
            const college = await College.findById(collegeId);
            if (college) {
                const distance = maxDistance ? parseFloat(maxDistance) : 10;
                query.geoLocation = {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [college.longitude, college.latitude]
                        },
                        $maxDistance: distance * 1000
                    }
                };
            }
        }

        // Filter by price
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Filter by tenant type
        if (tenantType) {
            query.tenantType = tenantType;
        }

        // Filter by services
        if (services) {
            const serviceArray = services.split(',');
            query.services = { $in: serviceArray };
        }

        const properties = await Property.find(query).populate('ownerId', 'firstName lastName email');
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/property/:id", async(req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate('reviews.userId', 'firstName lastName');
        if (!property) return res.status(404).json({ error: "Property not found" });
        res.json(property);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ===================== REVIEW ROUTES ===================== */

app.post("/api/properties/:id/reviews", verifyToken, async(req, res) => {
    try {
        const { rating, comment } = req.body;
        const property = await Property.findById(req.params.id);
        
        if (!property) return res.status(404).json({ error: "Property not found" });

        // Check if user already reviewed this property
        const existingReview = property.reviews.find(r => r.userId.toString() === req.userId);
        if (existingReview) {
            return res.status(400).json({ error: "You have already reviewed this property" });
        }

        const user = await User.findById(req.userId);

        const review = {
            userId: req.userId,
            userName: `${user.firstName} ${user.lastName}`,
            rating: Number(rating),
            comment: comment || ""
        };

        property.reviews.push(review);
        await property.save();

        res.status(201).json({ message: "Review added", property });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/api/properties/:id/reviews", async(req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate('reviews.userId', 'firstName lastName');
        if (!property) return res.status(404).json({ error: "Property not found" });
        res.json(property.reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ===================== GEMINI AI ROUTES ===================== */

app.post("/api/ai/generate-description", verifyToken, async(req, res) => {
    try {
        const { amenities, location, price, tenantType } = req.body;

        if (!amenities || !location) {
            return res.status(400).json({ error: "Amenities and location are required" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Generate a catchy, professional, and compelling description for a PG (Paying Guest) accommodation listing. 

Location: ${location}
Price: ${price ? `₹${price}/month` : 'Not specified'}
Tenant Type: ${tenantType || 'All'}
Amenities: ${Array.isArray(amenities) ? amenities.join(', ') : amenities}

Requirements:
- Keep it between 100-150 words
- Highlight key amenities and location benefits
- Use engaging and positive language
- Focus on comfort, safety, and convenience
- Target student/professional audience
- Be professional but friendly

Generate only the description text, no additional commentary:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const description = response.text();

        res.json({ description: description.trim() });
    } catch (error) {
        console.error("Gemini AI Error:", error);
        res.status(500).json({ error: "Failed to generate description. Please try again." });
    }
});

app.post("/api/ai/smart-search", async(req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Get all properties for context
        const allProperties = await Property.find();

        const prompt = `You are a smart search assistant for a PG (Paying Guest) accommodation platform. 

User Query: "${query}"

Available Properties:
${JSON.stringify(allProperties.map(p => ({
    title: p.title,
    location: p.location, // location is now a string
    price: p.price,
    tenantType: p.tenantType || p.type,
    services: p.services || p.amenities,
    averageRating: p.averageRating
})), null, 2)}

Analyze the user query and extract:
1. Location/College preference
2. Price range (if mentioned)
3. Tenant type preference
4. Required amenities/services
5. Any other specific requirements

Respond with a JSON object containing:
{
    "location": "extracted location or null",
    "college": "extracted college name or null",
    "minPrice": number or null,
    "maxPrice": number or null,
    "tenantType": "extracted type or null",
    "services": ["array of services"],
    "interpretedQuery": "natural language interpretation of the query"
}

Only return the JSON object, no additional text:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text().trim();

        // Parse JSON from response (might need cleanup)
        let searchParams;
        try {
            // Extract JSON if wrapped in markdown code blocks
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                searchParams = JSON.parse(jsonMatch[0]);
            } else {
                searchParams = JSON.parse(aiResponse);
            }
        } catch (parseError) {
            return res.status(500).json({ error: "Failed to parse AI response" });
        }

        // Build MongoDB query from AI-extracted params
        let dbQuery = {};

        if (searchParams.college) {
            const college = await College.findOne({ name: { $regex: searchParams.college, $options: 'i' } });
            if (college) {
                dbQuery.geoLocation = {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [college.longitude, college.latitude]
                        },
                        $maxDistance: 10000 // 10km default
                    }
                };
            }
        }

        if (searchParams.minPrice || searchParams.maxPrice) {
            dbQuery.price = {};
            if (searchParams.minPrice) dbQuery.price.$gte = searchParams.minPrice;
            if (searchParams.maxPrice) dbQuery.price.$lte = searchParams.maxPrice;
        }

        if (searchParams.tenantType) {
            dbQuery.tenantType = new RegExp(searchParams.tenantType, 'i');
        }

        if (searchParams.services && searchParams.services.length > 0) {
            dbQuery.services = { $in: searchParams.services };
        }

        const properties = await Property.find(dbQuery).limit(20);

        res.json({
            interpretedQuery: searchParams.interpretedQuery,
            searchParams: searchParams,
            results: properties,
            count: properties.length
        });
    } catch (error) {
        console.error("Smart Search Error:", error);
        res.status(500).json({ error: "Failed to process smart search. Please try again." });
    }
});

/* ===================== ROOMMATE ROUTES ===================== */

app.post("/register-roommate", upload.single("profilePhoto"), async(req, res) => {
    const roommate = new Roommate({
        ...req.body,
        profilePhoto: req.file ? req.file.path : ""
    });

    await roommate.save();
    res.status(201).json({ message: "Roommate added" });
});

app.get("/find-roommate", async(_, res) => {
    res.json(await Roommate.find());
});

app.get("/roommate/:id", async(req, res) => {
    res.json(await Roommate.findById(req.params.id));
});

/* ===================== SERVER ===================== */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
);