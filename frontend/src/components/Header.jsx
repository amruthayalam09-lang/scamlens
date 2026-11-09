import React from 'react';
import { ShieldCheckIcon, ShieldAlertIcon, CpuIcon } from './Icons';

export default function Header({ backendStatus, geminiConfigured }) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo & Name */}
        <div className="navbar-brand">
          <div className="brand-shield">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shield-svg">
              <path
                d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
                fill="url(#brandGrad)"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="11" r="3.5" fill="#080c17" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="12" cy="11" r="1.5" fill="#38bdf8" />
              <defs>
                <linearGradient id="brandGrad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0284c7" />
                  <stop offset="1" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </svg>
            <span className="shield-glow"></span>
          </div>

          <div className="brand-text-block">
            <div className="brand-row">
              <span className="brand-title">Scam<span className="brand-accent">Lens</span></span>
              <span className="brand-version-pill">AI v2.0</span>
            </div>
            <span className="brand-subtitle">CYBER INTELLIGENCE DEFENSE</span>
          </div>
        </div>

        {/* Status Indicators & Metadata */}
        <div className="navbar-status-group">
          <div className="status-chip academic-chip" title="Computer Science & Engineering Major Project">
            <span className="chip-dot-cyan"></span>
            <span>College CSE Project</span>
          </div>

          {backendStatus ? (
            <div className="status-chip online-chip" title="Detection API is online and responding">
              <span className="chip-beacon online"></span>
              <span>API: Online</span>
            </div>
          ) : (
            <div className="status-chip warning-chip" title="Waiting for detection server to respond">
              <span className="chip-beacon warning"></span>
              <span>API: Connecting...</span>
            </div>
          )}

          {geminiConfigured ? (
            <div className="status-chip gemini-chip" title="Google Gemini 2.0 Flash contextual reasoning is active">
              <CpuIcon size={14} className="gemini-icon" />
              <span>Gemini AI: Active</span>
            </div>
          ) : (
            <div className="status-chip rule-chip" title="Pattern rule engine active; API key optional for AI reasoning">
              <span className="chip-dot-amber"></span>
              <span>Rule Engine Active</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
