import React from 'react';

export default function Header({ backendStatus, geminiConfigured }) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-icon">
          🛡️
        </div>
        <div>
          <h1 className="brand-title">ScamLens</h1>
          <p className="brand-tagline">AI-Powered Scam Pattern Detection for Ordinary People</p>
        </div>
      </div>

      <div className="header-badges">
        <span className="badge badge-college">
          🎓 College CSE Project
        </span>

        {backendStatus ? (
          <span className="badge badge-status">
            <span className="status-dot"></span>
            Backend: Online
          </span>
        ) : (
          <span className="badge badge-status warning">
            <span className="status-dot"></span>
            Backend: Connecting...
          </span>
        )}

        {geminiConfigured ? (
          <span className="badge badge-status">
            <span className="status-dot"></span>
            Gemini AI: Active
          </span>
        ) : (
          <span className="badge badge-status warning">
            <span className="status-dot"></span>
            Gemini AI: Setup Needed
          </span>
        )}
      </div>
    </header>
  );
}
