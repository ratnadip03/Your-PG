# YourPG Phase 2 Implementation Guide

## 🎉 Overview

This document outlines the implementation of Phase 2 features for YourPG, including Google Maps integration, Gemini AI, Ratings & Reviews, and Google OAuth.

## ✅ Features Implemented

### 1. Google Maps Integration & College Logic
- ✅ Geospatial indexing for properties
- ✅ College schema with location data
- ✅ Distance calculation from colleges
- ✅ Google Maps picker in AddProperty form
- ✅ Search properties by college with distance filter

### 2. Gemini AI Integration
- ✅ AI Description Generator ("Magic Write" button)
- ✅ Smart Search/Chatbot with natural language processing

### 3. Rating & Review System
- ✅ Review schema integrated into Property model
- ✅ Average rating calculation
- ✅ Review submission and display
- ✅ Star rating UI component

### 4. Google OAuth
- ✅ Passport.js Google OAuth strategy
- ✅ "Continue with Google" button in Login
- ✅ OAuth callback handling

## 📋 Setup Instructions

### Backend Setup

1. **Install Dependencies**
```bash
cd Backend
npm install
```

2. **Environment Variables**
Create a `.env` file in the `Backend` directory:
```env
MONGO_URI=mongodb://localhost:27017/yourpg
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GEMINI_API_KEY=your-gemini-api-key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

3. **Google OAuth Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
   - Copy Client ID and Client Secret to `.env`

4. **Google Maps API Setup**
   - Enable "Maps JavaScript API" and "Places API" in Google Cloud Console
   - Create API key and restrict it to your domain
   - Add to frontend `.env` (see below)

5. **Gemini AI Setup**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create an API key
   - Add to backend `.env` as `GEMINI_API_KEY`

6. **Start Backend**
```bash
npm start
# or
node server.js
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd Frontend/PgWebsite
npm install
```

2. **Install react-icons** (if not already installed)
```bash
npm install react-icons
```

3. **Environment Variables**
Create a `.env` file in the `Frontend/PgWebsite` directory:
```env
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_API_URL=http://localhost:5000
```

4. **Start Frontend**
```bash
npm run dev
```

## 🔧 API Endpoints

### College Endpoints
- `POST /api/colleges` - Add a new college (requires auth)
- `GET /api/colleges` - Get all colleges
- `GET /api/colleges/:id` - Get college by ID
- `GET /api/properties/by-college/:collegeId` - Get properties near a college

### Property Endpoints (Updated)
- `POST /api/properties` - Add property (now includes lat/lng and nearby colleges)
- `GET /api/properties` - Get all properties (supports query params: collegeId, maxDistance, minPrice, maxPrice, tenantType, services)
- `GET /api/property/:id` - Get property by ID (includes reviews)

### Review Endpoints
- `POST /api/properties/:id/reviews` - Add a review (requires auth)
- `GET /api/properties/:id/reviews` - Get reviews for a property

### AI Endpoints
- `POST /api/ai/generate-description` - Generate property description using Gemini AI
- `POST /api/ai/smart-search` - Smart search with natural language processing

### OAuth Endpoints
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/logout` - Logout

## 📝 Usage Examples

### Adding a College
```bash
POST http://localhost:5000/api/colleges
Headers: { "x-access-token": "your-token" }
Body: {
  "name": "MIT College",
  "address": "123 College Street, Pune",
  "lat": 18.5204,
  "lng": 73.8567,
  "type": "College"
}
```

### Using Magic Write (AI Description Generator)
1. Go to "Add Property" page
2. Fill in services, location, and other details
3. Click "✨ Magic Write (AI)" button
4. AI will generate a professional description

### Using Smart Search
1. Click the floating robot button (bottom-right)
2. Enter a natural language query, e.g.:
   - "Find me a PG near IIT Bombay with AC under 10k"
   - "PG for students with WiFi and parking"
3. AI will interpret and search properties

### Adding a Review
1. Go to property details page
2. Click "Write a Review"
3. Select rating (1-5 stars)
4. Write your review
5. Submit

## 🎨 UI Components

### New Components
- **SmartSearch** - AI-powered search chatbot (floating button)
- **Google Maps Picker** - Interactive map for location selection in AddProperty
- **Review Section** - Star ratings and review display in PropertyDetails

### Updated Components
- **AddNewProperty** - Now includes Google Maps picker and Magic Write button
- **PropertyList** - Now includes college search filter
- **NewPropertyDetails** - Now includes reviews and ratings display
- **Login** - Now includes Google OAuth button

## 🔒 Security Notes

1. **API Keys**: Never commit API keys to version control
2. **Environment Variables**: Always use `.env` files (already in `.gitignore`)
3. **OAuth Credentials**: Keep Google OAuth credentials secure
4. **JWT Tokens**: Tokens expire after 1 hour

## 🐛 Troubleshooting

### Google Maps not loading
- Check if `VITE_GOOGLE_MAPS_API_KEY` is set in frontend `.env`
- Verify API key has "Maps JavaScript API" and "Places API" enabled
- Check browser console for errors

### OAuth callback not working
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Verify redirect URI in Google Cloud Console matches: `http://localhost:5000/auth/google/callback`
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### Gemini AI not working
- Verify `GEMINI_API_KEY` is set in backend `.env`
- Check API quota limits in Google AI Studio
- Review server logs for error messages

### Geospatial queries not working
- Ensure MongoDB version supports geospatial indexing (MongoDB 2.4+)
- Verify properties have valid `geoLocation` coordinates
- Check that coordinates are in [longitude, latitude] format

## 📚 Additional Resources

- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Passport.js Google OAuth](http://www.passportjs.org/docs/google/)
- [MongoDB Geospatial Queries](https://www.mongodb.com/docs/manual/geospatial-queries/)

## 🚀 Next Steps

1. Add more colleges to the database
2. Implement user profile pages
3. Add booking functionality
4. Implement payment integration
5. Add property owner dashboard
6. Implement real-time notifications

## 📝 Notes

- All existing functionality is preserved
- The implementation follows the existing code structure
- Tailwind CSS and React best practices are maintained
- Error handling is implemented throughout

---

**Happy Coding! 🎉**
