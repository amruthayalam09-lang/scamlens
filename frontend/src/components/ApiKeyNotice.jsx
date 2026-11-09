import React from 'react';
import { CpuIcon, ExternalLinkIcon, SparklesIcon } from './Icons';

export default function ApiKeyNotice({ setupInstructions }) {
  const steps = setupInstructions || {
    step1: 'Visit Google AI Studio at https://aistudio.google.com/app/apikey',
    step2: 'Click "Create API Key" (it is free for developers & college projects)',
    step3: 'For local: add to backend/.env | For Vercel: add GEMINI_API_KEY in Project Settings',
    step4: 'Restart your backend or trigger a Vercel redeploy'
  };

  return (
    <div className="cyber-notice-banner">
      <div className="notice-icon-circle">
        <SparklesIcon size={20} className="notice-icon" />
      </div>
      <div className="notice-details">
        <div className="notice-header-row">
          <h4 className="notice-title">Activate Deep Contextual Reasoning with Google Gemini AI</h4>
          <span className="notice-tag">OPTIONAL UPGRADE</span>
        </div>
        <p className="notice-lead">
          The built-in <strong>Heuristic Rule Engine</strong> is 100% active and scanning offline. To enable advanced psychological manipulation detection and personalized countermeasures powered by Gemini 2.0 Flash:
        </p>
        <div className="notice-steps-row">
          <div className="notice-step-pill">
            <span className="step-count">1</span>
            <span>Get free API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="notice-link">Google AI Studio <ExternalLinkIcon size={12} /></a></span>
          </div>
          <div className="notice-step-pill">
            <span className="step-count">2</span>
            <span>Add <code>GEMINI_API_KEY</code> to <code>backend/.env</code> or Vercel Settings</span>
          </div>
          <div className="notice-step-pill">
            <span className="step-count">3</span>
            <span>Header badge will switch to <strong>Gemini AI: Active</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
