import React, { useState } from 'react';
import { apiRequest } from '../utils/api';
import {
  GlobeIcon,
  SparklesIcon,
  TrashIcon,
  ZapIcon,
  AlertTriangleIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  CopyIcon,
  InfoIcon
} from './Icons';

const LANGUAGES = [
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'en', name: 'English', native: 'English' }
];

const PRESETS = [
  {
    label: '🎁 ₹50,000 Lottery Prize',
    text: 'Congratulations! You won ₹50,000. Pay ₹500 immediately to claim your prize.'
  },
  {
    label: '⚡ Electricity Cutoff Urgency',
    text: 'Dear Customer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Call 9876543210 immediately.'
  },
  {
    label: '🏦 Bank KYC Account Locked',
    text: 'URGENT: Your SBI account has been locked due to pending PAN KYC. Update immediately at http://secure-sbi-kyc.xyz or account blocked permanently.'
  },
  {
    label: '💼 Part-Time Telegram Job',
    text: 'Part-time work from home: Earn ₹3,500 daily by rating hotels and liking YouTube videos. Join our Telegram group @easyjob to start.'
  }
];

export default function ScamTranslator({ onOpenInScanner }) {
  const [message, setMessage] = useState('');
  const [selectedLang, setSelectedLang] = useState('te'); // default to Telugu
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async (textToTranslate = message, langCode = selectedLang) => {
    const text = (textToTranslate || '').trim();
    if (!text) {
      setError('Please enter or paste a suspicious message to translate.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let data;
      try {
        data = await apiRequest('/api/translate', {
          method: 'POST',
          body: JSON.stringify({
            message: text,
            targetLanguage: langCode
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      setResult(data);
    } catch (err) {
      console.error('Translation error:', err);
      if (err.name === 'AbortError') {
        setError('Translation request timed out. Please try again.');
      } else {
        setError(err.message || 'Could not connect to translation engine. Please verify the backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessage('');
    setResult(null);
    setError(null);
  };

  const handleApplyPreset = (preset) => {
    setMessage(preset.text);
    setError(null);
    handleTranslate(preset.text, selectedLang);
  };

  const handleCopyTranslated = () => {
    if (!result?.translation?.translatedMessage) return;
    navigator.clipboard.writeText(result.translation.translatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLang = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];
  const translation = result?.translation;

  return (
    <section id="scam-translator" className="translator-section">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-center">
          <div className="hero-tag-pill">
            <span className="pill-dot-purple"></span>
            <span className="pill-tag-text">MULTILINGUAL THREAT EXPLAINER</span>
          </div>
          <h2 className="section-heading">Scam Translator & Intent Explainer</h2>
          <p className="section-subheading">
            Translate confusing messages into your native language and understand the sender's true intentions, hidden traps, and safety actions.
          </p>
        </div>

        {/* Input Card Container */}
        <div className="translator-input-card">
          <div className="translator-top-controls">
            {/* Language Selector Dropdown */}
            <div className="translator-lang-picker">
              <label htmlFor="target-lang-select" className="lang-picker-label">
                <GlobeIcon size={16} className="text-purple" />
                <span>Select Target Language:</span>
              </label>
              <div className="custom-select-wrapper">
                <select
                  id="target-lang-select"
                  className="lang-select"
                  value={selectedLang}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setSelectedLang(newLang);
                    if (message.trim()) {
                      handleTranslate(message, newLang);
                    }
                  }}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.native} — {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Sample Presets */}
            <div className="translator-presets-row">
              <span className="presets-label">Try a Sample:</span>
              <div className="presets-pills-wrap">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-btn"
                    onClick={() => handleApplyPreset(p)}
                    title={p.text}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Message Textarea Input */}
          <div className="translator-textarea-wrap">
            <textarea
              className="translator-textarea"
              rows={4}
              placeholder="Paste any confusing or suspicious SMS, WhatsApp alert, prize notice, or job offer here..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (error) setError(null);
              }}
            />
            <div className="translator-textarea-footer">
              <span className="char-count">{message.length} characters</span>
              <div className="btn-actions-cluster">
                {message && (
                  <button
                    type="button"
                    className="btn-clear-translator"
                    onClick={handleClear}
                    title="Clear input"
                  >
                    <TrashIcon size={14} />
                    <span>Clear</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn-translate-primary"
                  onClick={() => handleTranslate()}
                  disabled={isLoading || !message.trim()}
                >
                  {isLoading ? (
                    <>
                      <span className="mini-spinner"></span>
                      <span>Translating & Explaining...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon size={16} />
                      <span>Translate and Explain</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="light-error-alert mt-3">
              <AlertTriangleIcon size={18} className="alert-icon" />
              <div className="alert-text-wrap">{error}</div>
            </div>
          )}
        </div>

        {/* Translation & Explanation Results View */}
        {result && translation && !isLoading && (
          <div className="translator-results-container">
            {/* Header info */}
            <div className="results-header-row">
              <div className="result-lang-tag">
                <GlobeIcon size={15} />
                <span>Explained in {currentLang.native} ({currentLang.name})</span>
              </div>
              {result.source && (
                <span className="result-engine-chip">
                  <SparklesIcon size={12} />
                  <span>{result.source}</span>
                </span>
              )}
            </div>

            {/* Side-by-Side Comparison: Original vs Translated */}
            <div className="translation-comparison-grid">
              {/* Card 1: Original Message */}
              <div className="translation-box original-card">
                <div className="translation-box-header">
                  <div className="box-header-title">
                    <span className="box-flag-dot grey"></span>
                    <h4>Original Message</h4>
                  </div>
                  <span className="box-badge">Original Text</span>
                </div>
                <div className="translation-box-content">
                  <p className="original-message-text">{result.originalMessage}</p>
                </div>
              </div>

              {/* Card 2: Translated Message */}
              <div className="translation-box translated-card">
                <div className="translation-box-header">
                  <div className="box-header-title">
                    <span className="box-flag-dot purple"></span>
                    <h4>Translated Message ({currentLang.native})</h4>
                  </div>
                  <button
                    type="button"
                    className="btn-copy-trans"
                    onClick={handleCopyTranslated}
                    title="Copy translated text"
                  >
                    {copied ? (
                      <>
                        <CheckCircleIcon size={13} className="text-green" />
                        <span className="text-green">Copied!</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon size={13} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="translation-box-content">
                  <p className="translated-message-text">{translation.translatedMessage}</p>
                </div>
              </div>
            </div>

            {/* Simple Explanation & True Intent */}
            <div className="translator-explanation-card">
              <div className="xai-header-badge-row">
                <span className="xai-tag-pill purple">
                  <SparklesIcon size={13} />
                  <span>Actual Meaning & Hidden Trap</span>
                </span>
              </div>
              <h4 className="card-section-title">What the Sender is REALLY Trying to Do:</h4>
              <div className="meaning-callout-box">
                <div className="meaning-icon-wrap">
                  <AlertTriangleIcon size={22} className="text-amber" />
                </div>
                <p className="actual-meaning-text">{translation.actualMeaning}</p>
              </div>
            </div>

            {/* Two-Column Threat Breakdown: Suspicious Demands vs Danger */}
            <div className="translator-threat-grid">
              {/* Suspicious Demands */}
              <div className="translator-subcard">
                <div className="subcard-header">
                  <ZapIcon size={17} className="text-red" />
                  <h4>Suspicious Requests Flagged</h4>
                </div>
                {translation.suspiciousRequests && translation.suspiciousRequests.length > 0 ? (
                  <ul className="threat-bullets-list">
                    {translation.suspiciousRequests.map((req, i) => (
                      <li key={i}>
                        <span className="bullet-dot red"></span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-paragraph text-sm">No explicit coercive requests flagged.</p>
                )}
              </div>

              {/* Why This Is Dangerous */}
              <div className="translator-subcard">
                <div className="subcard-header">
                  <ShieldAlertIcon size={17} className="text-red" />
                  <h4>Why This Message Is Dangerous</h4>
                </div>
                <div className="danger-explanation-box">
                  <p>{translation.dangerExplanation}</p>
                </div>
              </div>
            </div>

            {/* Actionable Safety Recommendations in Selected Language */}
            {translation.safetyRecommendations && translation.safetyRecommendations.length > 0 && (
              <div className="translator-safety-card">
                <div className="safety-card-header">
                  <div className="header-with-icon">
                    <ShieldCheckIcon size={20} className="text-green" />
                    <h4>Recommended Safety Actions ({currentLang.native})</h4>
                  </div>
                  <span className="safety-tag">Protective Checklist</span>
                </div>

                <div className="safety-steps-list">
                  {translation.safetyRecommendations.map((step, idx) => (
                    <div key={idx} className="safety-step-row">
                      <div className="safety-step-number">{idx + 1}</div>
                      <p className="safety-step-text">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cross-Link: Run Full 5-Card Scanner */}
            {onOpenInScanner && (
              <div className="translator-scanner-bridge">
                <div className="bridge-text">
                  <h5>Want to see the complete 5-card Explainable AI analysis?</h5>
                  <p>Run full pattern rule extraction, technical telemetry, and radial risk gauge.</p>
                </div>
                <button
                  type="button"
                  className="btn-bridge-scanner"
                  onClick={() => onOpenInScanner(result.originalMessage)}
                >
                  <ZapIcon size={15} />
                  <span>Open in Live Scanner</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

