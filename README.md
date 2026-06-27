# Andhra Style Pakka Military Hotel 🏨🌶️

Welcome to **Andhra Style Pakka Military Hotel**, Andhra's largest military-themed dining arena! This is a state-of-the-art MERN (MongoDB, Express, React, Node.js) stack application powered by real-time Socket.IO communications, Leaflet OpenStreetMap integrations, Google Gemini AI co-pilots, and dynamic theme contrast overlays.

---

## 🌟 Premium Features

### 1. Real-Time GPS Delivery Tracking
- Replaced mock maps with live **Leaflet + OpenStreetMap (Voyager)** interactive route trackers.
- Animates simulated rider coordinate progress from the Guntur Military Hotel kitchen to the customer's specific home or office address.
- Synchronized globally across client tracker pages, admin tracking modals, and manager dashboard overlays.

### 2. Operational Portal Security & Navigation Locking
- Restricts delivery riders and kitchen staff from accessing the public menu page (`/`). Any logged-in staff role is automatically redirected back to their respective operational dashboard.
- Hides the shopping cart, menu categories, and logo links from staff roles in the global navbar header.

### 3. Customer Reviews & Admin Moderation Queue
- A dedicated **Reviews Submission** form block on the landing page allows customers to select star ratings, pick the dish they enjoyed from a dynamic menu selector, and write descriptions.
- Submitted reviews default to `isApproved: false` and populate the **Reviews Approval** queue inside the Admin and Manager portals. Once approved, the review is pushed live to the public testimonials wall in real-time.

### 4. High-Contrast OLED Black Theme
- Supports a true black background (`#000000`) in dark mode, optimizing letter contrast with bold white (`#ffffff`) and bright gold (`#d4af37`) typography.
- Employs specific tag-level CSS overrides that override standard Tailwind text classes to prevent text-bleeding and maintain legibility.

### 5. Role-Adaptive Gemini AI Chatbot
- Powered by the Google **Gemini 1.5 Flash** model using the verified API key.
- Dynamically recognizes the logged-in user credentials (`admin`, `manager`, `kitchen`, `delivery`, or `customer`) and customizes the training system prompt context to provide helpful co-pilot tips.
- Includes a premium pulsing typing bubble status indicator and a local keyword-matching algorithm fallback.

### 6. Interactive Contact Actions (Call, WhatsApp, SMS)
- All customer and delivery rider telephone records are accompanied by quick-action buttons:
  - **Phone Call (📞)**: Triggers dialer actions using native browser protocols `tel:${phone}`.
  - **WhatsApp Chat (💬)**: Formats country prefix constraints and launches conversations inside the WhatsApp app using `https://wa.me/${phone}`.
  - **SMS Messages (✉️)**: Connects directly to mobile text editors via `sms:${phone}`.

---

## 📂 Project Structure

- **`/client`**: React client powered by Vite, Redux Toolkit, React Query, Tailwind CSS, Leaflet, and Socket.IO-client.
- **`/server`**: Express backend powered by Node.js, Socket.IO, Mongoose, JWT authentication, and native mock database fallbacks.

---

## 🚀 Local Development

### 1. Prerequisite
- Ensure you have **Node.js** (v18+) and **MongoDB** installed locally.
- *Note: If MongoDB is not running on port `27017`, the server automatically falls back to an in-memory Mock DB mode so you can run the app without any database setup!*

### 2. Start the Backend Server
```bash
cd server
npm install
npm run dev
```
*The server will boot on `http://localhost:5000`.*

### 3. Start the Frontend client
```bash
cd client
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173`.*

---

## ☁️ Deployment Guide for Render

You can easily deploy both the frontend static build and backend server on [Render](https://render.com) using the following parameters:

### 1. Deploy the Backend (Web Service)
1. Log in to Render and create a new **Web Service**.
2. Connect your Git repository.
3. Configure the following parameters:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. In the Environment tab, add the following environment variables:
   - `PORT`: `5000`
   - `MONGO_URI`: *(Optional: your MongoDB Atlas connection string. If omitted, the service will run in Mock DB mode)*
   - `JWT_SECRET`: *(your custom token signing secret)*

### 2. Deploy the Frontend (Static Site)
1. Create a new **Static Site** on Render.
2. Connect your Git repository.
3. Configure the following parameters:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. In the Environment tab, configure your client-side environment variable to point to your deployed backend URL:
   - `VITE_API_URL`: `https://your-backend-service-url.onrender.com/api`

---

## 👥 Default Credentials

- **Admin**: `admin@pakkamilitary.com` / `admin123`
- **Manager**: `manager@pakkamilitary.com` / `manager123`
- **Chef (Kitchen)**: `kitchen@pakkamilitary.com` / `kitchen123`
- **Rider (Delivery)**: `delivery@pakkamilitary.com` / `delivery123`
