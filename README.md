# 🛡️ ScamLens
### AI-Powered Scam Pattern Detection for Ordinary People

> **College Project — Computer Science and Engineering (CSE)**

---

## 📌 Problem & Purpose
Ordinary people receive suspicious SMS messages, emails, WhatsApp messages, fraudulent job offers, fake investment ads, and payment requests. Many cannot identify social engineering tactics (urgency, panic, fake authority, advance fees) until financial loss occurs.

**ScamLens** is an educational and protective tool that breaks down suspicious communications, highlights exact red flags, provides a clear risk score (0–100), and explains potential dangers in simple, non-technical English.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS design system, responsive for desktop and mobile.
- **Backend**: Node.js, Express.js.
- **Scam Detection Engine**:
  1. **Built-in Pattern Engine (`ruleEngine.js`)**: Real-time regex & keyword scanning for high-urgency keywords, OTP requests, remote desktop tools, advance fee demands, fake jobs, and gift card fraud. Works 100% locally and offline.
  2. **AI Analysis (`geminiService.js`)**: Google Gemini API (`@google/genai` / `gemini-2.5-flash`) for deep contextual reasoning, nuance analysis, and personalized safety advice.
- **Storage**: In-memory / stateless (no database in initial version).

---

## 📁 Project Structure

```
scamlens/
├── backend/
│   ├── .env.example               # Template for configuration
│   ├── .env                       # Environment variables (PORT, GEMINI_API_KEY)
│   ├── package.json               # Backend dependencies (express, cors, dotenv, @google/genai)
│   └── src/
│       ├── server.js              # Express app entry point
│       ├── routes/
│       │   └── analyze.js         # API endpoints (/api/analyze, /api/status)
│       ├── controllers/
│       │   └── analyzeController.js # Orchestrates rule matching + AI synthesis
│       └── services/
│           ├── ruleEngine.js      # Rule pattern scanner (OTP, payments, jobs, urgency)
│           └── geminiService.js   # Official Google Gen AI integration
│
├── frontend/
│   ├── package.json               # React + Vite dependencies
│   ├── vite.config.js             # Vite configuration with /api backend proxy
│   ├── index.html                 # HTML entry with Google Fonts
│   └── src/
│       ├── main.jsx               # React DOM root
│       ├── App.jsx                # Core application layout and state
│       ├── index.css              # Cyber-defense UI design system & responsive styles
│       └── components/
│           ├── Header.jsx         # App header with live backend & Gemini status badges
│           ├── MessageInput.jsx   # Textarea, character counter, preset message chips
│           ├── RiskMeter.jsx      # Visual risk score gauge (0-100) & threat tags
│           ├── HighlightViewer.jsx# Exact phrase highlighting in the message text
│           ├── WarningCard.jsx    # Plain English explanation cards for each red flag
│           ├── SafetyChecklist.jsx# Step-by-step personalized action checklist
│           ├── Disclaimer.jsx     # Advisory notice (assessment, not legal proof)
│           └── ApiKeyNotice.jsx   # Beginner setup guide for Google Gemini API key
│
└── package.json                   # Root scripts for running frontend and backend
```

---

## 🚀 How to Run the Project

### 1. Start the Backend Server
In your terminal, navigate to the `backend` folder and run:
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`.

### 2. Start the Frontend Development Server
In a second terminal window, navigate to the `frontend` folder and run:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔑 How to Configure Google Gemini API Key

ScamLens has an authentic integration with the official Google Gemini API. If the key is not yet added, the backend will honestly report that the key is missing while keeping the built-in Rule Engine 100% active.

To enable full Gemini AI reasoning:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and sign in with your Google account.
2. Click **Create API Key**.
3. Open `backend/.env` in your editor.
4. Paste your key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```
5. Restart the backend server. The header badge will change to **Gemini AI: Active**.

---

## ⚖️ Educational Disclaimer
ScamLens provides an automated risk assessment based on keyword pattern detection and AI reasoning. This is an educational and advisory assessment, not legal or definitive proof that a message is fraudulent.
