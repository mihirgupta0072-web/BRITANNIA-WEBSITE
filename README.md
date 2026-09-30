# Britannia Winkin' Cow — 3D Canvas Scroll Experience 🍓🥛

An interactive, high-performance 3D canvas scroll website for **Britannia Winkin' Cow Strawberblicious Thick Shake**, featuring a 210-frame ultra-HD sequence with smooth lerp interpolation, story chapters, floating HUD controls, and full product specifications.

---

## 🚀 Features

- **210-Frame 3D Canvas Engine**: 60 FPS requestAnimationFrame render loop with linear interpolation (lerp) for fluid Apple-style scrubbing.
- **Aspect Ratio Adaptability**: Supports both **Cover** (edge-to-edge full bleed) and **Contain** (zero clipping of bottle and splashes) modes with real-time toggle.
- **Dynamic Background Interpolation**: Seamlessly matches background color from deep berry burgundy to bright strawberry pink across all screen sizes.
- **Floating Interactive HUD**:
  - Auto-Play / Pause toggle (or press `Spacebar`)
  - Interactive frame scrubber timeline slider
  - Real-time frame & completion percentage counter (`FRAME 142 / 210 (68%)`)
  - Web Audio API liquid sound effects synthesizer
- **Transparent Specification Navbar**:
  - Modern glassmorphism floating bar with active ScrollSpy
  - Smoothly scrolls to each specification section (**3D Experience**, **Sensory Bliss**, **Nutrition Specs**, **Packs & Flavours**, **Café Recipes**, **Reviews**, **Delivery & FAQ**)
- **Full Product Showcase**:
  - Sensory & Taste Experience with Damask Rose & Strawberry notes
  - Nutritional Spectrum with interactive SVG Donut Chart
  - Pack Selector (Single, Summer 6-Pack, Party Crate) and Flavour Lineup
  - 3-Minute DIY Café Recipes (Boba Splash, Royal Falooda, Rose Popsicles)
  - Community Love reviews & Instagram strip
  - Interactive FAQ Accordion and 10-Minute Delivery Pincode checker

---

## ⚡ Deployment on Vercel

This repository is pre-configured for zero-config **1-click deployment on Vercel**:

1. Go to [vercel.com](https://vercel.com/) and sign in with your GitHub account.
2. Click **"Add New..."** → **"Project"**.
3. Select this repository: `mihirgupta0072-web/BRITANNIA-WEBSITE`.
4. Keep the default settings (**Framework Preset: Other / Static**).
5. Click **"Deploy"**.

Your website will be live worldwide on Vercel's Edge Network with ultra-fast CDN asset caching configured via `vercel.json`!

---

## 💻 Local Development

To run locally:

```bash
# Option 1: Using npx serve
npx serve . -l 3000

# Option 2: Using PowerShell HTTP server
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
├── ezgif-frame-001.jpg ... ezgif-frame-210.jpg   # 210 Ultra-HD animation frames
├── index.html                                    # Semantic HTML5 structure
├── style.css                                     # Custom CSS & design system tokens
├── app.js                                        # Canvas scroll engine & interactivity
├── vercel.json                                   # Vercel deployment & caching headers
├── package.json                                  # Package configuration & scripts
├── server.ps1                                    # Local PowerShell static server
└── README.md                                     # Project documentation
```

---

© 2026 Britannia Industries Ltd. Winkin' Cow is a registered trademark.
