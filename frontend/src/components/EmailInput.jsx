import React from 'react';
import { MailIcon, SearchIcon, TrashIcon, CopyIcon, ZapIcon, SparklesIcon } from './Icons';

const EMAIL_PRESETS = [
  {
    title: '✉️ PayPal via Free Webmail',
    tag: 'Webmail Spoof',
    email: 'paypal-security-alert@gmail.com'
  },
  {
    title: '🛒 Amaz0n Typosquatting Domain',
    tag: 'Typosquatting',
    email: 'support@amaz0n-security-update.com'
  },
  {
    title: '⏳ Disposable Temp Mailbox',
    tag: 'Temp Mail',
    email: 'agent-verify@tempmail.com'
  },
  {
    title: '🔒 Genuine Microsoft (Safe)',
    tag: 'Official Mail',
    email: 'security@accountprotection.microsoft.com'
  }
];

export default function EmailInput({
  email,
  setEmail,
  onAnalyze,
  isLoading,
  onClear
}) {
  const handlePresetClick = (presetEmail) => {
    setEmail(presetEmail);
  };

  const handleClear = () => {
    setEmail('');
    if (onClear) onClear();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && email.trim() && !isLoading) {
      e.preventDefault();
      onAnalyze();
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) setEmail(text.trim());
      }
    } catch (err) {
      console.warn('Clipboard access denied', err);
    }
  };

  return (
    <div className="input-card-container">
      {/* Sample Scenarios */}
      <div className="presets-wrapper">
        <div className="presets-header">
          <span className="presets-label">
            <ZapIcon size={14} className="accent-icon" />
            Try a sample sender address:
          </span>
          <span className="presets-hint">Audit sender domain authenticity and spoofing</span>
        </div>
        <div className="preset-chips-list">
          {EMAIL_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip-btn"
              onClick={() => handlePresetClick(preset.email)}
              title="Load sample email"
            >
              <span className="preset-chip-text">{preset.title}</span>
              <span className="preset-chip-badge">{preset.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Single-line Email Input */}
      <div className="single-input-row">
        <div className="input-prefix-icon">
          <MailIcon size={18} />
        </div>
        <input
          type="email"
          className="clean-text-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="support@service-update.com or paste sender address..."
          disabled={isLoading}
        />
        {email && (
          <button
            type="button"
            className="input-clear-icon-btn"
            onClick={handleClear}
            title="Clear email"
          >
            ×
          </button>
        )}
        <button
          type="button"
          className="tool-btn inside-input"
          onClick={handlePasteClipboard}
          title="Paste from clipboard"
        >
          <CopyIcon size={14} />
          <span>Paste</span>
        </button>
      </div>

      {/* Bottom Action Footer */}
      <div className="input-action-footer">
        <div className="input-meta-info">
          <span className="privacy-pill">
            <span className="privacy-dot"></span>
            Zero-Transmission Audit: Verified without sending any email or notification
          </span>
        </div>

        <div className="button-group">
          <button
            type="button"
            className="btn-clear"
            onClick={handleClear}
            disabled={!email && !isLoading}
          >
            <TrashIcon size={15} />
            <span>Clear</span>
          </button>

          <button
            type="button"
            className="btn-primary-analyse"
            onClick={onAnalyze}
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <>
                <span className="spinner-dot"></span>
                <span>Auditing Sender...</span>
              </>
            ) : (
              <>
                <SparklesIcon size={16} />
                <span>Audit Sender</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
