# 🏠 Your-PG: Smart Student Housing & Roommate Finder

> **Bridging the gap between students, safe accommodation, and compatible roommates.**

## 📌 Project Overview
Finding a PG in a new city is stressful. Brokers charge high fees, listings are unverified, and students often end up far from campus. **Your-PG** solves this by offering a data-driven platform that maps PGs specifically by their **proximity to colleges** and helps students find roommates based on **lifestyle compatibility**.

---

## 🛠️ Google Technologies Used
This project leverages the **Google Cloud Ecosystem** to enhance user experience and location accuracy:

* **📍 Google Maps JavaScript API:**
    * Used to render interactive maps on every Property Detail card.
    * Allows students to visually visualize the PG's location relative to their college.
    * Provides dynamic zooming and panning for neighborhood exploration.
* **🎨 Google Fonts:**
    * Utilized **Poppins** and **Inter** from the Google Fonts library to ensure a modern, accessible, and clean UI/UX.
* **🌐 Google Geolocation Concepts:**
    * The project structure is designed to integrate with Google's Geocoding API for address-to-coordinate conversion (Future Scope).

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
| **Maps** | Google Maps Platform |
| **Algorithms** | Haversine Formula (Distance Logic) |

---

## ⚙️ Installation & Run Locally

This project is divided into two parts: `Frontend` and `Backend`.

### Prerequisites
- Node.js installed
- MongoDB installed (or MongoDB Atlas URI)

### 1. Clone the Repository
```bash
git clone [https://github.com/ratnadip03/Your-PG.git](https://github.com/ratnadip03/Your-PG.git)
cd Your-PG
2. Setup Backend
Bash

cd Backend
npm install
node seed.js  # Loads sample data
npm start
3. Setup Frontend
Bash

cd Frontend/PgWebsite
npm install
npm run dev
Made with ❤️ by Ratnadeep


### How to paste it:
1.  Go to your GitHub repo.
2.  Click **Add file** -> **Create new file**.
3.  Name the file: **`README.md`** (All uppercase).
4.  Paste the code above.
5.  Click **Commit changes**.