# 🏠 Your-PG: Smart Student Housing & Roommate Finder

> **Bridging the gap between students, safe accommodation, and compatible roommates.**

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge)
![Gemini AI](https://img.shields.io/badge/AI-Gemini_API-magenta?style=for-the-badge)
![Google Maps](https://img.shields.io/badge/Google_Maps-Platform-green?style=for-the-badge)

## 📌 Project Overview
Finding a PG in a new city is stressful. Brokers charge high fees, listings are unverified, and students often end up far from campus. **Your-PG** solves this by offering a data-driven platform that maps PGs specifically by their **proximity to colleges** and helps students find roommates based on **lifestyle compatibility**.

---

## 🛠️ Google Technologies Used
This project heavily leverages the **Google Cloud Ecosystem** to create a smart and secure experience:

### 1. 🤖 Google Gemini AI (GenAI)
* **Smart Assistant:** Integrated Gemini API to power an intelligent chatbot that answers student queries about legal rights, rental agreements, and local area safety.
* **AI Recommendations:** Uses generative AI to analyze roommate profiles and suggest matches based on compatibility summaries.

### 2. 📍 Google Maps JavaScript API
* **Interactive Visualization:** Renders dynamic maps on every Property Detail card.
* **Context Awareness:** Allows students to visually see the route and neighborhood surrounding their potential new home.
* **Geospatial Data:** Pins exact latitude/longitude for precise navigation.

### 3. 🔐 Google Authentication (OAuth 2.0)
* **One-Tap Sign-In:** Utilizes Google Auth for a seamless, password-less login experience.
* **Verified Profiles:** Ensures that users are real students by verifying their Google identities, reducing fraud and enhancing safety.

---

## 🚀 Key Features

### 1. 📏 Smart Distance Calculation (The "Hero" Feature)
- Automatically calculates the **precise distance (in km)** between a PG and the student's selected college.
- Uses the **Haversine Formula** on the backend to perform geospatial calculations.
- Solves the "How far is it really?" problem for students.

### 2. 🔍 Advanced Filtering & Search
- Filter properties by **City Hubs** (e.g., Akurdi, Shivajinagar).
- Filter by **Budget**, **Tenant Type** (Boys/Girls), and **Amenities**.
- Instant search results with zero latency.

### 3. 🤝 Lifestyle-Based Roommate Finder
- Matches roommates based on **compatibility**, not just availability.
- **Lifestyle Badges:** Filter users by:
    - 🚬 Smoking / Non-Smoking
    - 🥗 Vegetarian / Non-Vegetarian
    - 🐶 Pet Friendly
- Detailed profiles help prevent conflict before moving in.

---

## 💻 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js, Vite, CSS3, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (handling Geospatial Data & Schemas) |
| **AI & Maps** | **Google Gemini API, Google Maps API, Google Auth** |

---

## ⚙️ Installation & Run Locally

This project is divided into two parts: `Frontend` and `Backend`.

### Prerequisites
- Node.js installed
- MongoDB installed (or MongoDB Atlas URI)
- **Google API Keys** (for Maps & Gemini)

### 1. Clone the Repository
```bash
git clone [https://github.com/ratnadip03/Your-PG.git](https://github.com/ratnadip03/Your-PG.git)
cd Your-PG
2. Setup Backend
Bash

cd Backend
npm install
# Create a .env file and add your GOOGLE_API_KEY and MONGO_URI
node seed.js  # Loads sample data
npm start
3. Setup Frontend
Bash

cd Frontend/PgWebsite
npm install
npm run dev
Made with ❤️ by Ratnadeep