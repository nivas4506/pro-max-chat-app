# ✨ Instagram Pro Max ✨

<p align="center">
  <img src="public/auth_illustration.png" width="600" alt="Instagram Pro Max Banner">
</p>

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

> A premium, high-fidelity social media experience built for the modern web. This is not just a clone; it's an elevation of social interaction.

---

## 🚀 Pro Max Experience

Our "Pro Max" philosophy focuses on visual excellence, fluid motion, and professional-grade interactions.

- **Vibrant Glassmorphism**: High-blur, high-saturation panels with subtle border glows.
- **Fluid Motion**: Hardware-accelerated animations using `text-focus-in`, `shimmer-glint`, and `float` keyframes.
- **Magnetic Interactions**: UI elements that respond to your touch and hover with a tactile, elastic feel.
- **Dynamic Scroll States**: Perspective-shifting scroll reveals that make the feed feel alive.

---

## 🛠 Features

### 📸 Immersive Feed
- **Scroll Reveal**: Posts gracefully enter the viewport with smooth transitions.
- **Suggested Content**: Intelligent fallbacks to global trending content when your personal feed is quiet.
- **Interactive Actions**: Double-tap to like, seamless commenting, and rich media support.

### 💬 Real-Time Messaging
- **Instant Connectivity**: Powered by Socket.io for low-latency chat.
- **Modern UI**: Clean, bubble-based chat interface with "Pro Max" styling.
- **Media Sharing**: Share images and files effortlessly.

### 🔍 Discovery & Explore
- **Bento-style Grids**: A beautiful, non-linear layout for discovering new content.
- **Global Trending**: Stay updated with what's hot across the platform.

### 🔐 Secure Authentication
- **Google OAuth**: One-tap login for a frictionless onboarding experience.
- **JWT Protection**: Secure, session-based authentication for all private routes.

---

## 💻 Tech Stack

### Frontend
- **React 19** (State-of-the-art UI library)
- **Vite** (Next-gen frontend tooling)
- **TypeScript** (Type-safe development)
- **Lucide React** (Beautiful, consistent iconography)
- **Vanilla CSS** (Custom, high-performance styling)

### Backend
- **Node.js & Express** (Scalable server architecture)
- **MySQL** (Relational data persistence)
- **Socket.io** (Real-time bidirectional communication)
- **Multer & Sharp** (Image processing and storage)

---

## ⚙️ Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd chat-app
```

### 2. Setup the Server
```bash
cd server
npm install
# Create a .env file with your DB and Google Auth credentials
npm run seed # To populate initial data
npm start
```

### 3. Setup the Frontend
```bash
# In the root directory
npm install
npm run dev
```

---

## 🎨 Design System

We use a curated monochrome slate palette with vibrant accent highlights:

- **Primary Color**: `#6366f1` (Indigo Gradient)
- **Background**: `#0a0a0a` (Deep Obsidian)
- **Glass Panel**: `rgba(255, 255, 255, 0.03)` with `backdrop-filter: blur(20px)`

---

<p align="center">
  Made with ❤️ by Antigravity
</p>
