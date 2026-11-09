import React from 'react';
import { GlobeIcon, LockIcon, UnlockIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons';

export default function UrlViewer({ urlAssessment }) {
  if (!urlAssessment) return null;

  const url = urlAssessment.url || urlAssessment.inputUrl || '';
  const hostname = urlAssessment.hostname || urlAssessment.parsed?.hostname || '';
  const mainDomain = urlAssessment.mainDomain || urlAssessment.parsed?.registeredDomain || hostname;
  const protocol = urlAssessment.protocol || (url.startsWith('https') ? 'https:' : 'http:');
  const isHttps = protocol === 'https:' || urlAssessment.security?.isHttps;
  const isSuspicious = urlAssessment.riskScore >= 25 || urlAssessment.isSuspicious;

  return (
    <div className="result-white-card">
      <div className="result-card-header">
        <div className="card-header-title-wrap">
          <h4 className="result-card-heading">Link & Domain Inspection Breakdown</h4>
          <p className="result-card-subheading">
            Parsed host telemetry, protocol encryption, and destination root domain
          </p>
        </div>
        <span className={`clean-status-tag ${isSuspicious ? 'warning' : 'safe'}`}>
          {isSuspicious ? <AlertTriangleIcon size={14} /> : <CheckCircleIcon size={14} />}
          <span>{isSuspicious ? 'Suspicious Attributes Found' : 'Verified Domain Structure'}</span>
        </span>
      </div>

      <div className="telemetry-info-grid">
        <div className="telemetry-box">
          <span className="telemetry-label">Inspected Link:</span>
          <span className="telemetry-value-code">{url}</span>
        </div>

        <div className="telemetry-box">
          <span className="telemetry-label">Registered Root Domain:</span>
          <span className="telemetry-value-highlight">
            {mainDomain || 'Unknown Host'}
          </span>
        </div>

        <div className="telemetry-box">
          <span className="telemetry-label">Full Hostname:</span>
          <span className="telemetry-value-code">{hostname || '—'}</span>
        </div>

        <div className="telemetry-box">
          <span className="telemetry-label">Protocol Security:</span>
          <span className="telemetry-value-pill">
            {isHttps ? (
              <span className="badge-secure">
                <LockIcon size={13} /> HTTPS Encrypted
              </span>
            ) : (
              <span className="badge-insecure">
                <UnlockIcon size={13} /> Unencrypted HTTP
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
