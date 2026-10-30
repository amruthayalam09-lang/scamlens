import React from 'react';

/**
 * Safely displays analyzed URL metadata without rendering clickable links.
 */
export default function UrlViewer({ assessment }) {
  if (!assessment) return null;

  const { url, hostname, protocol, mainDomain, subdomains, path } = assessment;
  const isInsecureHttp = protocol === 'http:';

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">🌐 Analyzed URL Breakdown</h3>
        <span className="safe-badge">
          🛡️ Safe Preview — Link is not clickable
        </span>
      </div>

      <div className="url-preview-box">
        <code className="url-code-text">{url}</code>
      </div>

      <div className="url-meta-grid">
        <div className="url-meta-item">
          <span className="meta-label">Protocol Security</span>
          <span className={`meta-value ${isInsecureHttp ? 'insecure' : 'secure'}`}>
            {isInsecureHttp ? '⚠️ HTTP (Unencrypted)' : '🔒 HTTPS (Encrypted)'}
          </span>
        </div>

        <div className="url-meta-item">
          <span className="meta-label">Real Registered Domain</span>
          <span className="meta-value highlight-domain">
            {mainDomain || hostname}
          </span>
        </div>

        <div className="url-meta-item">
          <span className="meta-label">Subdomain Prefix</span>
          <span className="meta-value">
            {subdomains && subdomains !== '(None)' ? subdomains : '(None)'}
          </span>
        </div>

        <div className="url-meta-item">
          <span className="meta-label">Target Path</span>
          <span className="meta-value">
            {path || '/'}
          </span>
        </div>
      </div>
    </div>
  );
}
