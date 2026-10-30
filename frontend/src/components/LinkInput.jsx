import React from 'react';

const URL_PRESETS = [
  {
    title: '💳 Fake PayPal Subdomain',
    url: 'http://paypal.com.account-update.xyz/login'
  },
  {
    title: '🛒 Amaz0n Typosquatting',
    url: 'https://amaz0n-support-verify.click/order'
  },
  {
    title: '🏦 Fake SBI Banking Link',
    url: 'http://sbi-kyc-update-portal.com/netbanking'
  },
  {
    title: '📦 Bit.ly Link Shortener',
    url: 'https://bit.ly/claim-free-prize-2026'
  },
  {
    title: '🌐 Safe Official Google URL',
    url: 'https://www.google.com/search?q=cybersecurity+best+practices'
  }
];

export default function LinkInput({
  url,
  setUrl,
  onAnalyze,
  isLoading,
  onClear
}) {
  const handlePresetClick = (presetUrl) => {
    setUrl(presetUrl);
  };

  const handleClear = () => {
    setUrl('');
    if (onClear) onClear();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && url.trim() && !isLoading) {
      e.preventDefault();
      onAnalyze();
    }
  };

  return (
    <div className="card">
      <div className="preset-section">
        <label className="preset-label">
          💡 Try a sample URL or paste your own:
        </label>
        <div className="preset-chips">
          {URL_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip"
              onClick={() => handlePresetClick(preset.url)}
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      <div className="input-wrapper">
        <div className="url-input-container">
          <span className="url-icon">🔗</span>
          <input
            type="text"
            className="url-text-input"
            placeholder="Paste suspicious website link or URL here (e.g. http://paypal.com.account-update.xyz)..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          {url.length > 0 && (
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
          <span>Never click suspicious links directly. We inspect the link safely without visiting the website.</span>
        </div>
      </div>

      <button
        type="button"
        className="analyze-btn"
        onClick={onAnalyze}
        disabled={isLoading || !url.trim()}
      >
        {isLoading ? (
          <>
            <span className="spinner"></span>
            <span>Inspecting Domain & Link Patterns...</span>
          </>
        ) : (
          <>
            <span>🔍 Analyse Link</span>
          </>
        )}
      </button>
    </div>
  );
}
