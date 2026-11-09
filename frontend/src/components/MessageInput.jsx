import React from 'react';
import { SearchIcon, TrashIcon, CopyIcon, ZapIcon, SparklesIcon } from './Icons';

const SAMPLE_PRESETS = [
  {
    title: '⚡ Power Bill Cutoff',
    tag: 'Urgency',
    text: 'Dear Customer, your electricity power will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Urgent action required! Immediately contact our electricity officer Mr. Sharma at 9876543210 or install AnyDesk to verify payment.'
  },
  {
    title: '💼 Telegram VIP Job',
    tag: 'Job Scam',
    text: 'Hello! I am Priya from Global Media HR. You have been selected for part-time work from home. Daily income of 3000 to 8000 INR working 10-20 mins! Just like YouTube videos and subscribe to channels. No interview needed! Contact our coordinator on Telegram: @hr_priya_tasks.'
  },
  {
    title: '🏦 Bank KYC & OTP Freeze',
    tag: 'Phishing',
    text: 'URGENT: Your SBI Bank Account has been suspended due to pending KYC verification. Please update your PAN card immediately to avoid account closure. Click http://bit.ly/sbi-kyc-verify and enter your 6-digit OTP to unblock account.'
  },
  {
    title: '📈 Guaranteed Crypto Profit',
    tag: 'Crypto Scam',
    text: 'Guaranteed 100% returns in 24 hours! Our VIP automated trading bot doubles your money risk-free. Deposit 500 USDT to start earning daily profit. Send funds to wallet address: 0x71C... and share transaction screenshot.'
  },
  {
    title: '📦 Genuine Delivery (Safe)',
    tag: 'Safe Sample',
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
    <div className="input-card-container">
      {/* Sample Scenario Preset Chips */}
      <div className="presets-wrapper">
        <div className="presets-header">
          <span className="presets-label">
            <ZapIcon size={14} className="accent-icon" />
            Try a real-world sample:
          </span>
          <span className="presets-hint">Click any scenario to test instant detection</span>
        </div>
        <div className="preset-chips-list">
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip-btn"
              onClick={() => handlePresetClick(preset.text)}
              title="Load this test message"
            >
              <span className="preset-chip-text">{preset.title}</span>
              <span className="preset-chip-badge">{preset.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea Box */}
      <div className="input-textarea-wrapper">
        <textarea
          className="message-textarea"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Paste any confusing SMS, WhatsApp message, email body, job offer, or lottery notice here to analyze..."
          disabled={isLoading}
        />

        {/* Floating Actions on Top Right of Input */}
        <div className="textarea-top-tools">
          <button
            type="button"
            className="tool-btn"
            onClick={handlePasteClipboard}
            title="Paste from clipboard"
          >
            <CopyIcon size={14} />
            <span>Paste</span>
          </button>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="input-action-footer">
        <div className="input-meta-info">
          <span className="character-count">
            {message.length} character{message.length === 1 ? '' : 's'}
          </span>
          <span className="privacy-pill">
            <span className="privacy-dot"></span>
            Private & Confidential
          </span>
        </div>

        <div className="button-group">
          <button
            type="button"
            className="btn-clear"
            onClick={handleClear}
            disabled={!message && !isLoading}
          >
            <TrashIcon size={15} />
            <span>Clear</span>
          </button>

          <button
            type="button"
            className="btn-primary-analyse"
            onClick={onAnalyze}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <>
                <span className="spinner-dot"></span>
                <span>Analyzing Patterns...</span>
              </>
            ) : (
              <>
                <SparklesIcon size={16} />
                <span>Analyse Message</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
