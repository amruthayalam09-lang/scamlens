import React from 'react';

const SAMPLE_PRESETS = [
  {
    title: '⚡ Power Bill Urgency',
    text: 'Dear Customer, your electricity power will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Urgent action required! Immediately contact our electricity officer Mr. Sharma at 9876543210 or install AnyDesk to verify payment.'
  },
  {
    title: '💼 Telegram Task Scam',
    text: 'Hello! I am Priya from Global Media HR. You have been selected for part-time work from home. Daily income of 3000 to 8000 INR working 10-20 mins! Just like YouTube videos and subscribe to channels. No interview needed! Contact our coordinator on Telegram: @hr_priya_tasks.'
  },
  {
    title: '🏦 Bank KYC & OTP',
    text: 'URGENT: Your SBI Bank Account has been suspended due to pending KYC verification. Please update your PAN card immediately to avoid account closure. Click http://bit.ly/sbi-kyc-verify and enter your 6-digit OTP to unblock account.'
  },
  {
    title: '📈 Guaranteed Crypto Profit',
    text: 'Guaranteed 100% returns in 24 hours! Our VIP automated trading bot doubles your money risk-free. Deposit 500 USDT to start earning daily profit. Send funds to wallet address: 0x71C... and share transaction screenshot.'
  },
  {
    title: '📦 Legitimate Delivery (Safe)',
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

  return (
    <div className="card">
      <div className="preset-section">
        <label className="preset-label">
          💡 Try a sample message or paste your own:
        </label>
        <div className="preset-chips">
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip"
              onClick={() => handlePresetClick(preset.text)}
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      <div className="input-wrapper">
        <textarea
          className="message-textarea"
          placeholder="Paste suspicious SMS, WhatsApp message, email, job offer, or investment ad here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          disabled={isLoading}
        />
        <div className="textarea-footer">
          <span>{message.length} characters</span>
          {message.length > 0 && (
            <button
              type="button"
              className="clear-btn"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear message
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        className="analyze-btn"
        onClick={onAnalyze}
        disabled={isLoading || !message.trim()}
      >
        {isLoading ? (
          <>
            <span className="spinner"></span>
            <span>Analyzing Scam Patterns & AI Indicators...</span>
          </>
        ) : (
          <>
            <span>🔍 Analyse Message</span>
          </>
        )}
      </button>
    </div>
  );
}
