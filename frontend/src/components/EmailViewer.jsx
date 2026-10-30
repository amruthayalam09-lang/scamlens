import React from 'react';

/**
 * Safely displays analyzed email metadata without clickable mailto links.
 */
export default function EmailViewer({ assessment }) {
  if (!assessment) return null;

  const {
    email,
    displayName,
    localPart,
    domain,
    mainDomain,
    isFreeProvider,
    isDisposable
  } = assessment;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">✉️ Analyzed Email Sender Breakdown</h3>
        <span className="safe-badge">
          🛡️ Safe Preview — No email sent or opened
        </span>
      </div>

      <div className="email-preview-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {displayName && displayName !== '(None)' && (
            <span className="email-display-name">"{displayName}"</span>
          )}
          <code className="email-code-text">&lt;{email}&gt;</code>
        </div>
      </div>

      <div className="url-meta-grid">
        <div className="url-meta-item">
          <span className="meta-label">Sender Mailbox</span>
          <span className="meta-value">
            {localPart}
          </span>
        </div>

        <div className="url-meta-item">
          <span className="meta-label">Domain Host</span>
          <span className="meta-value highlight-domain">
            {mainDomain && mainDomain !== domain ? `${domain} (Registered: ${mainDomain})` : domain}
          </span>
        </div>

        <div className="url-meta-item">
          <span className="meta-label">Mail Provider Type</span>
          <span className={`meta-value ${isFreeProvider ? 'insecure' : 'secure'}`}>
            {isFreeProvider ? '⚠️ Free Public Webmail' : '🏢 Custom / Corporate Domain'}
          </span>
        </div>

        <div className="url-meta-item">
          <span className="meta-label">Audit & Verification</span>
          <span className={`meta-value ${isDisposable ? 'insecure' : 'secure'}`}>
            {isDisposable ? '🚨 Disposable / Throwaway Inbox' : '✓ Standard Mail Service'}
          </span>
        </div>
      </div>
    </div>
  );
}
