# 🌌 IMAGIX — Premium AI Image Generator

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.14+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python Badge">
  <img src="https://img.shields.io/badge/Flask-3.1.3-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask Badge">
  <img src="https://img.shields.io/badge/SQLite-3.0-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite Badge">
  <img src="https://img.shields.io/badge/Vanilla_CSS-3.0-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS Badge">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JS Badge">
</p>

---

## 🎨 Overview

**IMAGIX** is a premium, high-performance, and visually captivating text-to-image AI creation suite. Architected with a robust **Python Flask** backend, secure **SQLite3** local persistence, and a responsive **HTML5/Vanilla CSS/JavaScript** dashboard, it allows creators to synthesize high-fidelity visual masterpieces dynamically.

Featuring sleek **Glassmorphism panels**, smooth interactive transitions, customizable **aspect ratios**, curated **style presets**, and an **automatic multi-model fallback resiliency core**, IMAGIX provides a flawless, production-ready environment for turning concepts into digital art.

---

## ✨ Key Features

- 🌓 **Dynamic Theme System**: Sleek Dark & Light modes with instant UI state-shifting and automatic choice persistence in `localStorage`.
- 🖼️ **Aspect Ratio Selector**: Dynamically scales the canvas grid (Square 1:1, Cinematic 16:9, Portrait 9:16, Standard 4:3) with responsive CSS resize animations.
- 🎨 **Stylistic Render Presets**: Custom grids including *Cinematic, Anime, Cyberpunk, 3D Render, Fantasy, Oil Paint, and Pixel Art* that automatically augment prompt embeddings.
- 🚀 **Intelligent Fallback Resiliency Core**:
  - Automatically simulates full browser headers to bypass CDN anti-bot blocks.
  - Implements **Automatic Multi-Model Retries**: falls back from high-load models to the fast, free-tier `turbo` model if rate limits or 402/429 limits occur.
  - Scales resolutions down by `75%` automatically if remote GPU clusters encounter timeouts.
- 💾 **SQLite3 Local Database Persistence**: Automatically records prompt, style, resolution, and seed details, saving the high-res file locally.
- 🗂️ **Session History Sidebar**: Displays generations as scrollable thumbnails. Click any past visual to load it instantly into the preview panel.
- ⚙️ **Action Utilities**: One-click direct downloads of high-resolution JPEGs and permanent assets deletions.
- 💫 **SVGs & Micro-Animations**: Interactive status spin sequences (e.g. *Drafting concept... ➔ Polishing resolution...*) with pulsating magical buttons.

---

## 📂 Project Architecture

```
imagix-ai-image-generator/
├── app.py                  # Flask Application, SQLite Controller, and Fallback Routing
├── database.db             # SQLite3 Database storing local image metadata (gitignored)
├── requirements.txt        # Project Dependencies (Flask, requests, gunicorn)
├── .gitignore              # Clean file exclusion criteria for repositories
├── README.md               # Elite Showcase Documentation
└── static/
    ├── css/
    │   └── style.css       # HSL Variables, Glassmorphism utilities, and keyframes
    ├── js/
    │   └── main.js         # Theme triggers, aspect resizing, loading cycles, AJAX APIs
    └── images/             # Generated local JPEGs storage (gitignored)
        └── .gitkeep        # Preserves directories structure in Git
```

---

## 🛠️ Local Installation & Running

Ensure you have **Python 3.10+** installed on your system.

### 1. Clone the Repository
```bash
git clone https://github.com/Tony-chauhan/imagix-ai-image-generator.git
cd imagix-ai-image-generator
```

### 2. Set Up a Virtual Environment (Recommended)
```bash
python -m venv venv
# On Windows (Command Prompt / PowerShell):
venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Fire Up the Server
```bash
python app.py
```
The server will boot instantly in debug mode on **`http://127.0.0.1:5000`**. Open it in your browser and start generating!

---

## 🚀 Easy Cloud Deployment (Render)

Deploying IMAGIX on **Render.com** takes less than 2 minutes and is completely free:

1. **Connect GitHub**: Sign up on **Render.com** and connect your GitHub account.
2. **New Web Service**: Click **"New Web Service"** and select the `imagix-ai-image-generator` repository.
3. **Configure the Deploy**:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Tier**: Select **"Free"**
4. **Deploy**: Render will compile the requirements and deploy your app onto a public `.onrender.com` URL automatically!

---

## 🤝 Credits & Acknowledgements

- **AI Engine**: Powered by the public and free [Pollinations AI](https://pollinations.ai) API framework.
- **Design System**: Handcrafted utilizing modern CSS custom property pipelines and glassmorphism.
- **Author**: Created with 💜 by **Tony Chauhan** ([@Tony-chauhan](https://github.com/Tony-chauhan)).

---
<p align="center">Made with 🧬 in Developer Style</p>
