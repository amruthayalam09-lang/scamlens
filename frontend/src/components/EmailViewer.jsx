import React from 'react';
import { MailIcon, ShieldCheckIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons';

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
    <div className="dashboard-section-card">
      <div className="section-card-header">
        <div className="section-header-title">
          <MailIcon size={18} className="section-icon" />
          <h3 className="section-title">Sender Identity & Mailbox Architecture</h3>
        </div>
        <span className="isolated-preview-badge">
          <ShieldCheckIcon size={14} />
          Isolated Audit — No Ping / Handshake Sent
        </span>
      </div>

      <div className="cyber-code-block">
        <span className="code-lang-tag">SENDER HEADER LINE</span>
        <div className="sender-raw-preview">
          {displayName && displayName !== '(None)' && (
            <span className="sender-display-name">"{displayName}"</span>
          )}
          <code className="inspected-email-code">&lt;{email}&gt;</code>
        </div>
      </div>

      <div className="telemetry-grid">
        <div className="telemetry-item">
          <span className="telemetry-label">Sender Account / Mailbox</span>
          <span className="status-val mono">{localPart}</span>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-label">Domain Host / MX Provider</span>
          <span className="status-val highlight-domain">
            {mainDomain && mainDomain !== domain ? `${domain} (Registered: ${mainDomain})` : domain}
          </span>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-label">Mail Provider Classification</span>
          <div className="telemetry-value-row">
            {isFreeProvider ? (
              <span className="status-val warning">
                <AlertTriangleIcon size={16} /> Free Webmail (Gmail/Yahoo)
              </span>
            ) : (
              <span className="status-val secure">
                <CheckCircleIcon size={16} /> Custom Corporate Domain
              </span>
            )}
          </div>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-label">Reputation & Longevity</span>
          <div className="telemetry-value-row">
            {isDisposable ? (
              <span className="status-val danger">
                <AlertTriangleIcon size={16} /> Disposable Throwaway Inbox
              </span>
            ) : (
              <span className="status-val secure">
                <CheckCircleIcon size={16} /> Established Mail Provider
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
