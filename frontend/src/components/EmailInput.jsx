import React from 'react';

const EMAIL_PRESETS = [
  {
    title: '💳 PayPal on Free Gmail',
    email: 'PayPal Security Alert <paypal-security-update@gmail.com>'
  },
  {
    title: '🛒 Amaz0n Typosquatting',
    email: 'Amazon Support <service-billing@amaz0n-services.xyz>'
  },
  {
    title: '🏦 Fake SBI KYC on Yahoo',
    email: 'SBI Verification Team <sbi.kyc.verification.desk@yahoo.com>'
  },
  {
    title: '📦 Disposable Temp Mail',
    email: 'Courier Notice <package-tracking-alert@mailinator.com>'
  },
  {
    title: '🌐 Safe Official Google Email',
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

  return (
    <div className="card">
      <div className="preset-section">
        <label className="preset-label">
          💡 Try a sample email sender or paste your own:
        </label>
        <div className="preset-chips">
          {EMAIL_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip"
              onClick={() => handlePresetClick(preset.email)}
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      <div className="input-wrapper">
        <div className="email-input-container">
          <span className="email-icon">✉️</span>
          <input
            type="text"
            className="email-text-input"
            placeholder="Paste sender email or header (e.g. PayPal Support <paypal-security@gmail.com>)..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          {email.length > 0 && (
            <button
              type="button"
              className="clear-btn"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </button>
          )}
        </div>
        <div className="textarea-footer" style={{ marginTop: '0.4rem' }}>
          <span>ScamLens safely inspects sender domains and mailbox indicators without replying or contacting the sender.</span>
        </div>
      </div>

      <button
        type="button"
        className="analyze-btn"
        onClick={onAnalyze}
        disabled={isLoading || !email.trim()}
      >
        {isLoading ? (
          <>
            <span className="spinner"></span>
            <span>Checking Domain Spoofing & Mailbox Legitimacy...</span>
          </>
        ) : (
          <>
            <span>🔍 Analyse Email Sender</span>
          </>
        )}
      </button>
    </div>
  );
}

