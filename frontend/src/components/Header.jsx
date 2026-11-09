import React, { useState } from 'react';
import { ShieldCheckIcon, CpuIcon, SparklesIcon, CheckCircleIcon } from './Icons';

export default function Header({ backendStatus, geminiConfigured, onScanClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo & Name */}
        <div className="navbar-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="brand-logo-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="navLogoGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7655E8" />
                  <stop offset="1" stopColor="#9B80FF" />
                </linearGradient>
              </defs>
              <path
                d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
                fill="url(#navLogoGrad)"
              />
              <path
                d="M10 11.5l1.5 1.5 3-3"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">Scam<span className="brand-accent">Lens</span></span>
            <span className="brand-badge">AI</span>
          </div>
        </div>

        {/* Modern Desktop Navigation Links */}
        <nav className={`navbar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <button type="button" className="nav-link" onClick={() => scrollTo('scanner')}>
            Scanner
          </button>
          <button type="button" className="nav-link" onClick={() => scrollTo('screenshot-analyzer')}>
            Screenshot OCR
          </button>
          <button type="button" className="nav-link nav-link-assistant" onClick={() => scrollTo('ai-assistant')}>
            <SparklesIcon size={14} className="nav-assistant-icon" />
            <span>AI Assistant</span>
          </button>
          <button type="button" className="nav-link" onClick={() => scrollTo('how-it-works')}>
            How it Works
          </button>
          <button type="button" className="nav-link" onClick={() => scrollTo('features')}>
            Features
          </button>
          <button type="button" className="nav-link" onClick={() => scrollTo('about')}>
            About
          </button>
        </nav>

        {/* Right Status Badges & CTA */}
        <div className="navbar-actions">
          {/* Real-time System Status Pill */}
          <div className="system-status-pill" title={backendStatus ? 'Detection engine is online' : 'Connecting to engine'}>
            <span className={`status-indicator-dot ${backendStatus ? 'online' : 'connecting'}`}></span>
            <span className="status-indicator-text">
              {backendStatus ? 'Engine Active' : 'Connecting...'}
            </span>
            {geminiConfigured && (
              <span className="ai-status-tag" title="Gemini 2.0 Flash is ready">
                <SparklesIcon size={12} />
                <span>AI</span>
              </span>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            className="navbar-cta-btn"
            onClick={() => scrollTo('scanner')}
          >
            Scan Content
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Toggle Navigation Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>
    </header>
  );
}
