import React from 'react';
import { SearchIcon, TrashIcon, CopyIcon, ZapIcon, ShieldAlertIcon, CheckCircleIcon } from './Icons';

const SAMPLE_PRESETS = [
  {
    title: '⚡ Power Bill Cutoff',
    tag: 'URGENCY',
    text: 'Dear Customer, your electricity power will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Urgent action required! Immediately contact our electricity officer Mr. Sharma at 9876543210 or install AnyDesk to verify payment.'
  },
  {
    title: '💼 Telegram VIP Job',
    tag: 'ADVANCE-FEE',
    text: 'Hello! I am Priya from Global Media HR. You have been selected for part-time work from home. Daily income of 3000 to 8000 INR working 10-20 mins! Just like YouTube videos and subscribe to channels. No interview needed! Contact our coordinator on Telegram: @hr_priya_tasks.'
  },
  {
    title: '🏦 Bank KYC & OTP Freeze',
    tag: 'CREDENTIALS',
    text: 'URGENT: Your SBI Bank Account has been suspended due to pending KYC verification. Please update your PAN card immediately to avoid account closure. Click http://bit.ly/sbi-kyc-verify and enter your 6-digit OTP to unblock account.'
  },
  {
    title: '📈 Guaranteed Crypto Profit',
    tag: 'INVESTMENT',
    text: 'Guaranteed 100% returns in 24 hours! Our VIP automated trading bot doubles your money risk-free. Deposit 500 USDT to start earning daily profit. Send funds to wallet address: 0x71C... and share transaction screenshot.'
  },
  {
    title: '📦 Genuine Delivery (Safe)',
    tag: 'BENIGN',
    text: 'Hi Alex, your Amazon package with order #402-8821919 has been dispatched with delivery agent Rahul. It is expected to arrive by tomorrow before 7 PM. You can track this order in your official Amazon app.'
  }
];

export default function MessageInput({
  message,
  setMessage,
  onAnalyze,
  isLoading,
  onClear
}) {
  const handlePresetClick = (text) => {
    setMessage(text);
  };

  const handleClear = () => {
    setMessage('');
    if (onClear) onClear();
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) setMessage(text);
      }
    } catch (err) {
      console.warn('Clipboard access denied or unavailable', err);
    }
  };

  return (
    <div className="scanner-card">
      {/* Terminal-like Window Header */}
      <div className="scanner-header">
        <div className="terminal-controls">
          <span className="control-dot red"></span>
          <span className="control-dot yellow"></span>
          <span className="control-dot green"></span>
          <span className="terminal-title">scamlens://threat-inspector/message</span>
        </div>
        <div className="scanner-meta-status">
          <span className="live-status-pill">
            <span className="pulse-dot"></span>
            HEURISTIC ENGINE READY
          </span>
        </div>
      </div>

      {/* Quick Threat Presets Bar */}
      <div className="presets-container">
        <div className="presets-label-row">
          <span className="presets-label">
            <ZapIcon size={14} className="accent-icon" />
            Quick Attack Vector Samples:
          </span>
          <span className="presets-hint">Click a real-world scenario to test:</span>
        </div>
        <div className="preset-chips-grid">
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className={`preset-chip ${preset.tag.toLowerCase()}`}
              onClick={() => handlePresetClick(preset.text)}
              title="Load this sample text"
            >
              <span className="preset-chip-title">{preset.title}</span>
              <span className="preset-chip-tag">{preset.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Textarea Input Container */}
      <div className="input-frame">
        <textarea
          className="cyber-textarea"
          placeholder="Paste suspicious SMS, WhatsApp message, email body, job offer, lottery claim, or payment request here for instant AI pattern inspection..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          disabled={isLoading}
        />

        <div className="input-toolbar">
          <div className="char-counter">
            <span className="counter-number">{message.length}</span>
            <span className="counter-label">characters scanned</span>
          </div>

          <div className="toolbar-actions">
            <button
              type="button"
              className="tool-btn paste-btn"
              onClick={handlePasteClipboard}
              disabled={isLoading}
              title="Paste text from clipboard"
            >
              <CopyIcon size={14} />
              <span>Paste Sample</span>
            </button>

            {message.length > 0 && (
              <button
                type="button"
                className="tool-btn clear-btn"
                onClick={handleClear}
                disabled={isLoading}
                title="Clear current text"
              >
                <TrashIcon size={14} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="scanner-action-footer">
        <button
          type="button"
          className={`cyber-analyze-btn ${isLoading ? 'loading' : ''}`}
          onClick={onAnalyze}
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? (
            <>
              <span className="cyber-spinner"></span>
              <span className="btn-text">Inspecting Threat Vectors & Gemini AI Reasoning...</span>
            </>
          ) : (
            <>
              <SearchIcon size={20} className="btn-icon" />
              <span className="btn-text">Analyse Message for Scam Patterns</span>
              <span className="btn-shine"></span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
