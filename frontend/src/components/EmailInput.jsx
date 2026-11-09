import React from 'react';
import { MailIcon, SearchIcon, TrashIcon, CopyIcon, ZapIcon } from './Icons';

const EMAIL_PRESETS = [
  {
    title: '💳 PayPal on Free Gmail',
    tag: 'FREE-WEBMAIL',
    email: 'PayPal Security Alert <paypal-security-update@gmail.com>'
  },
  {
    title: '🛒 Amaz0n Lookalike Domain',
    tag: 'TYPOSQUATTING',
    email: 'Amazon Support <service-billing@amaz0n-services.xyz>'
  },
  {
    title: '🏦 Fake SBI Team on Yahoo',
    tag: 'FREE-WEBMAIL',
    email: 'SBI Verification Team <sbi.kyc.verification.desk@yahoo.com>'
  },
  {
    title: '📦 Disposable Mailbox',
    tag: 'TEMP-MAIL',
    email: 'Courier Notice <package-tracking-alert@mailinator.com>'
  },
  {
    title: '🌐 Official Google Security (Safe)',
    tag: 'BENIGN',
    email: 'Google Security <no-reply@accounts.google.com>'
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
    <div className="scanner-card">
      <div className="scanner-header">
        <div className="terminal-controls">
          <span className="control-dot red"></span>
          <span className="control-dot yellow"></span>
          <span className="control-dot green"></span>
          <span className="terminal-title">scamlens://threat-inspector/email-sender</span>
        </div>
        <div className="scanner-meta-status">
          <span className="live-status-pill">
            <span className="pulse-dot"></span>
            SENDER SPOOFING DETECTOR
          </span>
        </div>
      </div>

      <div className="presets-container">
        <div className="presets-label-row">
          <span className="presets-label">
            <ZapIcon size={14} className="accent-icon" />
            Common Impersonation Vectors:
          </span>
          <span className="presets-hint">Click a deceptive sender pattern to test:</span>
        </div>
        <div className="preset-chips-grid">
          {EMAIL_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className={`preset-chip ${preset.tag.toLowerCase()}`}
              onClick={() => handlePresetClick(preset.email)}
              title="Load this sample sender"
            >
              <span className="preset-chip-title">{preset.title}</span>
              <span className="preset-chip-tag">{preset.tag}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="input-frame">
        <div className="cyber-single-input-row">
          <div className="input-icon-box">
            <MailIcon size={18} className="input-lead-icon" />
          </div>
          <input
            type="text"
            className="cyber-text-input"
            placeholder="Paste sender email address or full header (e.g. PayPal Alert <security@gmail.com>)..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          {email.length > 0 && (
            <button
              type="button"
              className="input-inline-clear"
              onClick={handleClear}
              title="Clear input"
            >
              <TrashIcon size={16} />
            </button>
          )}
        </div>

        <div className="input-toolbar">
          <div className="char-counter">
            <span className="safe-preview-tag">🔒 Zero-transmission inspection — No emails sent or pinged</span>
          </div>
          <div className="toolbar-actions">
            <button
              type="button"
              className="tool-btn paste-btn"
              onClick={handlePasteClipboard}
              disabled={isLoading}
            >
              <CopyIcon size={14} />
              <span>Paste Sender</span>
            </button>
          </div>
        </div>
      </div>

      <div className="scanner-action-footer">
        <button
          type="button"
          className={`cyber-analyze-btn ${isLoading ? 'loading' : ''}`}
          onClick={onAnalyze}
          disabled={isLoading || !email.trim()}
        >
          {isLoading ? (
            <>
              <span className="cyber-spinner"></span>
              <span className="btn-text">Verifying Brand Authenticity & Mail Infrastructure...</span>
            </>
          ) : (
            <>
              <SearchIcon size={20} className="btn-icon" />
              <span className="btn-text">Analyse Sender & Domain Integrity</span>
              <span className="btn-shine"></span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
