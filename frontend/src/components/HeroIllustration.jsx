import React from 'react';
import { ShieldCheckIcon, SparklesIcon, LockIcon, CheckCircleIcon, ZapIcon } from './Icons';

export default function HeroIllustration() {
  return (
    <div className="hero-illustration-container">
      {/* Soft Ambient Glows */}
      <div className="hero-ill-glow"></div>

      <div className="hero-ill-stage">
        {/* Decorative Ring Elements */}
        <div className="hero-ill-circle-outer"></div>
        <div className="hero-ill-circle-mid"></div>

        {/* Central Shield Graphic */}
        <div className="hero-shield-card">
          <div className="hero-shield-icon-wrapper">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" className="hero-svg-shield">
              <defs>
                <linearGradient id="shieldGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7655E8" />
                  <stop offset="1" stopColor="#9B80FF" />
                </linearGradient>
                <linearGradient id="innerShieldGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFFFFF" />
                  <stop offset="1" stopColor="#F0EDFF" />
                </linearGradient>
              </defs>
              <path
                d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
                fill="url(#shieldGrad)"
              />
              <path
                d="M12 4.2L5 7.3v4.7c0 4.3 2.98 8.3 7 9.3 4.02-1 7-5 7-9.3V7.3l-7-3.1z"
                fill="url(#innerShieldGrad)"
                opacity="0.95"
              />
              <path
                d="M9.5 11.8l1.8 1.8 3.7-3.7"
                stroke="#7655E8"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="hero-shield-caption">AI Threat Shield</span>
          <span className="hero-shield-subcaption">Multi-Layer Heuristics</span>
        </div>

        {/* Floating AI Badge 1: Top Left */}
        <div className="floating-card float-top-left">
          <div className="float-icon-box purple">
            <SparklesIcon size={18} />
          </div>
          <div className="float-text-box">
            <span className="float-title">AI Pattern Scanner</span>
            <span className="float-desc">Gemini 2.0 Contextual Reasoning</span>
          </div>
          <span className="float-pulse-dot green"></span>
        </div>

        {/* Floating AI Badge 2: Bottom Right */}
        <div className="floating-card float-bottom-right">
          <div className="float-icon-box green">
            <CheckCircleIcon size={18} />
          </div>
          <div className="float-text-box">
            <span className="float-title">Zero-Phishing Shield</span>
            <span className="float-desc">Real-time URL & Domain Defense</span>
          </div>
        </div>

        {/* Floating AI Badge 3: Top Right */}
        <div className="floating-card float-top-right">
          <div className="float-icon-box amber">
            <ZapIcon size={16} />
          </div>
          <div className="float-text-box">
            <span className="float-title">Instant Analysis</span>
            <span className="float-desc">Urgency & Deceit Detection</span>
          </div>
        </div>

        {/* Floating AI Badge 4: Bottom Left */}
        <div className="floating-card float-bottom-left">
          <div className="float-icon-box purple">
            <LockIcon size={16} />
          </div>
          <div className="float-text-box">
            <span className="float-title">100% Private</span>
            <span className="float-desc">Zero Data Logged</span>
          </div>
        </div>
      </div>
    </div>
  );
}
