# AI Navigation System for Accessibility

## 🚀 Overview
The **AI Navigation System** is a specialized web application designed to provide safe, accessible, and intelligent routing for individuals with mobility challenges (e.g., wheelchair users, elderly, visually impaired). Unlike standard map apps, this system actively monitors "micro-barriers" like steep ramps, broken sidewalks, and construction zones, calculating customized "Trust Scores" for every route.

It features **Real-time Obstacle Reporting**, **Community Validation**, **Audio Guidance** (Text-to-Speech & Voice Search), and **Personalized Mobility Profiles**.

---

## ✨ Features & Use Cases

### 1. Personalized Mobility Profiles
**Use Case:** A user uses a manual wheelchair and cannot handle steep slopes.
*   **Instruction:** Go to the **Profile** tab. Select "Wheelchair User". Under "Detailed Mobility Issues", note "Avoid steep hills".
*   **Feature:** The routing engine prioritizes flat terrain and avoids paths flagged with "Slope" hazards.

### 2. Audio Guidance & Voice Search
**Use Case:** A visually impaired user needs to navigate hands-free.
*   **Instruction (Setup):** In **Profile**, set "Preferred Guidance" to **Audio**.
*   **Instruction (Usage):** In **Navigation**, click the **Microphone** icon in the search bar and say "Central Park".
*   **Feature:** The app speaks out "Route found..." and announces hazards ("Caution: Construction ahead") as you simulate movement along the route.

### 3. Real-time Hazard Reporting
**Use Case:** A user encounters a broken elevator at a subway station.
*   **Instruction:** Click the **Report Issue** button (top right header). Select "Obstacle", add a photo (drag & drop), and describe "Elevator broken".
*   **Feature:** This report is instantly pushed to all other users in the area via WebSockets.

### 4. Community Trust & Validation
**Use Case:** Verifying if a report is still active.
*   **Instruction:** In the **Nearby Hazards** tab (Radar icon), browse the list of "Real-time Hurdles". Click **Verify** on a report to upvote its accuracy.
*   **Feature:** Confirmed hazards increase in "Trust Score", making them more likely to trigger rerouting. Low-trust reports are filtered out.

### 5. Smart Routing (Navigation)
**Use Case:** Finding the safest path, not just the fastest.
*   **Instruction:** Go to **Navigation**. Enter Start/Dest. Click **Find Safe Route**.
*   **Feature:** View routes with a "Safety Score" (e.g., 90% Safe). The map highlights hazards in Red/Orange. Dangerous routes are downgraded or hidden.

---

## 🛠️ Setup Instructions

### Prerequisites
*   Node.js (v14+)
*   PostgreSQL (Local or Cloud)
*   Git

### 1. Database Setup
1.  Create a PostgreSQL database named `accessible_nav`.
2.  Run the schema script located in `backend/tables.sql` to create the necessary tables (`users`, `profiles`, `routes`, `hazard_reports`, `validations`).
    ```sql
    -- Example using psql
    psql -d accessible_nav -f backend/tables.sql
    ```

### 2. Backend Setup
1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in `backend/` with the following:
    ```env
    PORT=5000
    DB_USER=postgres
    DB_PASS=your_password
    DB_HOST=localhost
    DB_NAME=accessible_nav
    DB_PORT=5432
    JWT_SECRET=supersecretkey_change_me
    LOCATIONIQ_API_KEY=your_location_iq_key
    ```
4.  Start the server:
    ```bash
    npm run dev
    ```

### 3. Frontend Setup
1.  Navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in `frontend/` (optional, defaults to localhost:5000):
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```
4.  Start the app:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Login Credentials (Sample User)

Use these credentials to log in and test the application immediately:

*   **Email:** `sample@gmail.com`
*   **Password:** `12345678`

---

## 📱 Application Walkthrough

### Home Tab
*   Overview dashboard showing active alerts, Quick Navigation to saved routes, and system status.

### Navigation Tab
*   **Step 1 (Profile):** Confirm your mobility type (auto-selected from your saved Profile).
*   **Step 2 (Request):** Enter Start/Destination (Type or Voice). Flip directions if needed.
*   **Step 3 (Route View):**
    *   **Map:** See the path line and markers.
    *   **Route Cards:** Choose the safest route (Green > Yellow > Red).
    *   **Dropdown:** Access "Saved Routes".
*   **Step 4 (Nearby Hazards):** Scans a 1km radius for obstacles. View the list on the right (without scrollbar!) and the map on the left.

### Alerts Tab
*   A simplified feed of all community reports. Helpful for browsing general city status.

### Chat Interface (AI Assistant)
*   Ask context-aware questions like "Is there a wheelchair ramp at Central Station?" (Prototype feature).

---

## 🎨 Technology Stack
*   **Frontend:** React, Vite, CSS Modules (Glassmorphism), Lucide Icons, Leaflet Maps.
*   **Backend:** Node.js, Express, Socket.io (Real-time), Multer (Image Upload).
*   **Database:** PostgreSQL (with PostGIS concepts implemented via lat/lng logic).
*   **Auth:** JWT (JSON Web Tokens).
