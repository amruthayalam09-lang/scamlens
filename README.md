# 🛡️ ScamLens
### AI-Powered Scam Pattern Detection for Ordinary People

> **College Project — Computer Science and Engineering (CSE)**

---

## 📌 Problem & Purpose
Ordinary people receive suspicious SMS messages, emails, WhatsApp messages, fraudulent job offers, fake investment ads, and payment requests. Many cannot identify social engineering tactics (urgency, panic, fake authority, advance fees) until financial loss occurs.

**ScamLens** is an educational and protective tool that breaks down suspicious communications, highlights exact red flags, provides a clear risk score (0–100), and explains potential dangers in simple, non-technical English.

---

## 🎨 UI Design System (60-30-10 Rule)
ScamLens uses a modern, light, high-clarity user interface adhering strictly to the **60-30-10 Rule**:
- **60% Dominant (Canvas & Surfaces)**: Crisp slate-50 (`#f8fafc`) canvas background with subtle ambient light gradients and pure white (`#ffffff`) elevated cards.
- **30% Secondary (Structure & Typography)**: Deep slate (`#0f172a` / `#334155`) high-readability typography, slate-200 structural borders, and clean input surfaces.
- **10% Accent (Focal Points & Actions)**: Vibrant cybersecurity royal blue to indigo gradients (`#2563eb` → `#4f46e5`) for primary CTAs and active states, balanced with semantic risk badges (Crimson Red for High Risk, Amber for Moderate Risk, Emerald for Safe).

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, Vite, responsive 60-30-10 light theme design system.
- **Backend & Cloud Deployment**: 
  - **Local Development**: Node.js & Express API server (`localhost:5000`).
  - **Vercel Production**: Native **Vercel Serverless Functions** (`/api`), running frontend and backend seamlessly on Vercel without third-party cold-starts (no Render needed).
- **Scam Detection Engine**:
  1. **Built-in Pattern Engine (`ruleEngine.js`, `urlEngine.js`, `emailEngine.js`)**: Real-time regex & keyword scanning for high-urgency keywords, OTP harvesting, remote desktop demands, brand typosquatting, disposable emails, and gift card fraud. Works 100% locally and offline.
  2. **AI Analysis (`geminiService.js`)**: Google Gemini API (`@google/genai` / `gemini-2.0-flash`) for deep contextual reasoning, nuance analysis, and personalized safety advice.
- **Storage**: In-memory / stateless (no database required).

---

## 📁 Project Structure

```
scamlens/
├── api/                           # Vercel Serverless Functions (instant scaling, zero cold-starts)
│   ├── status.js                  # GET /api/status (Health and Gemini config check)
│   ├── analyze.js                 # POST /api/analyze (Message pattern & AI scanner)
│   ├── analyze-url.js             # POST /api/analyze-url (Link & domain inspector)
│   ├── analyze-email.js           # POST /api/analyze-email (Sender identity inspector)
│   └── index.js                   # API fallback and health endpoint
│
├── backend/                       # Local Express backend server
│   ├── .env.example               # Template for configuration
│   ├── .env                       # Local environment variables (GEMINI_API_KEY)
│   └── src/
│       ├── server.js              # Express app entry point
│       ├── controllers/
│       │   └── analyzeController.js # Core orchestration logic
│       └── services/
│           ├── ruleEngine.js      # Message pattern scanner (OTP, payments, jobs, urgency)
│           ├── urlEngine.js       # URL typosquatting, shortener & domain security analyzer
│           ├── emailEngine.js     # Email spoofing, webmail abuse & disposable inbox scanner
│           └── geminiService.js   # Official Google Gen AI integration
│
├── frontend/                      # React 19 + Vite frontend
│   ├── package.json
│   ├── vite.config.js             # Vite configuration with /api backend proxy
│   ├── index.html                 # HTML entry with Plus Jakarta Sans & JetBrains Mono fonts
│   └── src/
│       ├── main.jsx               # React DOM root
│       ├── App.jsx                # Core application layout and multi-tab state
│       ├── index.css              # 60-30-10 Light Theme Design System
│       └── components/
│           ├── Header.jsx         # App header with live backend & Gemini status badges
│           ├── MessageInput.jsx   # Message scanner with preset sample chips
│           ├── LinkInput.jsx      # URL scanner with preset suspicious links
│           ├── EmailInput.jsx     # Email scanner with preset sender lines
│           ├── RiskMeter.jsx      # Visual risk score gauge (0-100) & threat tags
│           ├── HighlightViewer.jsx# Exact phrase highlighting in message text
│           ├── UrlViewer.jsx      # Deconstructed URL security breakdown
│           ├── EmailViewer.jsx    # Sender identity and mailbox breakdown
│           ├── WarningCard.jsx    # Plain English explanation cards for each red flag
│           ├── SafetyChecklist.jsx# Step-by-step personalized action checklist
│           ├── Disclaimer.jsx     # Advisory notice
│           └── ApiKeyNotice.jsx   # Setup guide for Google Gemini API key
│
├── vercel.json                    # Root Vercel deployment configuration
└── package.json                   # Root workspaces and build scripts
```

---

## 🚀 How to Run Locally

### 1. Install Dependencies
At the project root, run:
```bash
npm install
```

### 2. Start the Backend Server
```bash
npm run backend
```
The backend will run on `http://localhost:5000`.

### 3. Start the Frontend Development Server
In a second terminal window, run:
```bash
npm run frontend
```
Open `http://localhost:5173` in your browser.

---

## ☁️ Deploying to Vercel (Without Render)

Both the frontend and backend now run together on **Vercel**:
1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Migrate to Vercel Serverless and 60-30-10 Light Theme"
   git push origin main
   ```
2. In your [Vercel Dashboard](https://vercel.com/dashboard):
   - Select your **scamlens** project.
   - Go to **Settings** → **General** → Ensure **Root Directory** is `./` (or blank).
   - Go to **Settings** → **Environment Variables**:
     - Key: `GEMINI_API_KEY`
     - Value: your actual Google Gemini API key
   - Click **Deployments** → **Redeploy**.
3. Your Vercel URL (`https://scamlens-navy.vercel.app/`) will now execute both the frontend and the `/api` serverless endpoints automatically without any Render dependency!
