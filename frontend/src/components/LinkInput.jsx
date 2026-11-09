import React from 'react';
import { GlobeIcon, SearchIcon, TrashIcon, CopyIcon, ZapIcon, SparklesIcon } from './Icons';

const URL_PRESETS = [
  {
    title: '💳 Fake PayPal Subdomain',
    tag: 'Subdomain Spoof',
    url: 'http://paypal.com.account-update.xyz/login'
  },
  {
    title: '🛒 Amaz0n Typosquatting',
    tag: 'Lookalike Domain',
    url: 'https://amaz0n-support-verify.click/order'
  },
  {
    title: '🏦 Fake SBI Portal',
    tag: 'Compound Brand',
    url: 'http://sbi-kyc-update-portal.com/netbanking'
  },
  {
    title: '📦 Shortened Redirect Link',
    tag: 'Shortener',
    url: 'https://bit.ly/claim-free-prize-2026'
  },
  {
    title: '🌐 Official Google (Safe)',
    tag: 'Safe Domain',
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

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) setUrl(text.trim());
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
            Try a sample suspicious URL:
          </span>
          <span className="presets-hint">Inspect subdomains, fake brands & redirection</span>
        </div>
        <div className="preset-chips-list">
          {URL_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip-btn"
              onClick={() => handlePresetClick(preset.url)}
              title="Load sample link"
            >
              <span className="preset-chip-text">{preset.title}</span>
              <span className="preset-chip-badge">{preset.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Single-line URL Input */}
      <div className="single-input-row">
        <div className="input-prefix-icon">
          <GlobeIcon size={18} />
        </div>
        <input
          type="url"
          className="clean-text-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com/login or paste any suspicious web link..."
          disabled={isLoading}
        />
        {url && (
          <button
            type="button"
            className="input-clear-icon-btn"
            onClick={handleClear}
            title="Clear link"
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
            Zero-Transmission Isolation: Inspected safely without downloading malware
          </span>
        </div>

        <div className="button-group">
          <button
            type="button"
            className="btn-clear"
            onClick={handleClear}
            disabled={!url && !isLoading}
          >
            <TrashIcon size={15} />
            <span>Clear</span>
          </button>

          <button
            type="button"
            className="btn-primary-analyse"
            onClick={onAnalyze}
            disabled={isLoading || !url.trim()}
          >
            {isLoading ? (
              <>
                <span className="spinner-dot"></span>
                <span>Inspecting Domain...</span>
              </>
            ) : (
              <>
                <SparklesIcon size={16} />
                <span>Inspect Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
