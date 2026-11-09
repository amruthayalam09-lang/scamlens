import React from 'react';
import { GlobeIcon, SearchIcon, TrashIcon, CopyIcon, ZapIcon } from './Icons';

const URL_PRESETS = [
  {
    title: '💳 Fake PayPal Subdomain',
    tag: 'SUBDOMAIN-SPOOF',
    url: 'http://paypal.com.account-update.xyz/login'
  },
  {
    title: '🛒 Amaz0n Typosquatting',
    tag: 'TYPOSQUATTING',
    url: 'https://amaz0n-support-verify.click/order'
  },
  {
    title: '🏦 Fake SBI Portal',
    tag: 'COMPOUND-BRAND',
    url: 'http://sbi-kyc-update-portal.com/netbanking'
  },
  {
    title: '📦 Shortened Redirect Link',
    tag: 'SHORTENER',
    url: 'https://bit.ly/claim-free-prize-2026'
  },
  {
    title: '🌐 Official Google Search (Safe)',
    tag: 'BENIGN',
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
    <div className="scanner-card">
      <div className="scanner-header">
        <div className="terminal-controls">
          <span className="control-dot red"></span>
          <span className="control-dot yellow"></span>
          <span className="control-dot green"></span>
          <span className="terminal-title">scamlens://threat-inspector/url-domain</span>
        </div>
        <div className="scanner-meta-status">
          <span className="live-status-pill">
            <span className="pulse-dot"></span>
            ZERO-DAY DOMAIN ANALYZER
          </span>
        </div>
      </div>

      <div className="presets-container">
        <div className="presets-label-row">
          <span className="presets-label">
            <ZapIcon size={14} className="accent-icon" />
            Common Malicious Link Vectors:
          </span>
          <span className="presets-hint">Click a deceptive URL pattern to test:</span>
        </div>
        <div className="preset-chips-grid">
          {URL_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className={`preset-chip ${preset.tag.toLowerCase()}`}
              onClick={() => handlePresetClick(preset.url)}
              title="Load this sample link"
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
            <GlobeIcon size={18} className="input-lead-icon" />
          </div>
          <input
            type="text"
            className="cyber-text-input"
            placeholder="Paste suspicious website URL, banking login, bit.ly shortener, or domain..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          {url.length > 0 && (
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
            <span className="safe-preview-tag">🔒 Isolated preview — Will NOT execute or redirect to target site</span>
          </div>
          <div className="toolbar-actions">
            <button
              type="button"
              className="tool-btn paste-btn"
              onClick={handlePasteClipboard}
              disabled={isLoading}
            >
              <CopyIcon size={14} />
              <span>Paste URL</span>
            </button>
          </div>
        </div>
      </div>

      <div className="scanner-action-footer">
        <button
          type="button"
          className={`cyber-analyze-btn ${isLoading ? 'loading' : ''}`}
          onClick={onAnalyze}
          disabled={isLoading || !url.trim()}
        >
          {isLoading ? (
            <>
              <span className="cyber-spinner"></span>
              <span className="btn-text">Inspecting Domain Infrastructure & Typosquatting...</span>
            </>
          ) : (
            <>
              <SearchIcon size={20} className="btn-icon" />
              <span className="btn-text">Analyse Link & Domain Architecture</span>
              <span className="btn-shine"></span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
