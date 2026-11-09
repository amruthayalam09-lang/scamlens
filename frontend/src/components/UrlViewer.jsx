import React from 'react';
import { GlobeIcon, LockIcon, UnlockIcon, ShieldCheckIcon, AlertTriangleIcon } from './Icons';

/**
 * Safely displays analyzed URL metadata without rendering clickable links.
 */
export default function UrlViewer({ assessment }) {
  if (!assessment) return null;

  const { url, hostname, protocol, mainDomain, subdomains, path } = assessment;
  const isInsecureHttp = protocol === 'http:';

  return (
    <div className="dashboard-section-card">
      <div className="section-card-header">
        <div className="section-header-title">
          <GlobeIcon size={18} className="section-icon" />
          <h3 className="section-title">URL & Network Architecture Inspection</h3>
        </div>
        <span className="isolated-preview-badge">
          <ShieldCheckIcon size={14} />
          Isolated Preview — Hyperlink Execution Blocked
        </span>
      </div>

      {/* Code Inspector Box */}
      <div className="cyber-code-block">
        <span className="code-lang-tag">RAW URL PAYLOAD</span>
        <code className="inspected-url-code">{url}</code>
      </div>

      {/* Grid of Network Parameters */}
      <div className="telemetry-grid">
        <div className="telemetry-item">
          <span className="telemetry-label">Protocol Security</span>
          <div className="telemetry-value-row">
            {isInsecureHttp ? (
              <span className="status-val danger">
                <UnlockIcon size={16} /> HTTP (Unencrypted / High Risk)
              </span>
            ) : (
              <span className="status-val secure">
                <LockIcon size={16} /> HTTPS (TLS Encrypted Connection)
              </span>
            )}
          </div>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-label">Real Registered Domain</span>
          <span className="status-val highlight-domain">
            {mainDomain || hostname}
          </span>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-label">Subdomain Prefixes</span>
          <span className="status-val mono">
            {subdomains && subdomains !== '(None)' ? subdomains : '(None)'}
          </span>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-label">Resource Target Path</span>
          <span className="status-val mono">
            {path || '/'}
          </span>
        </div>
      </div>
    </div>
  );
}
