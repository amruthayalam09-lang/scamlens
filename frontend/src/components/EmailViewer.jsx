import React from 'react';
import { MailIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons';

export default function EmailViewer({ emailAssessment }) {
  if (!emailAssessment) return null;

  const email = emailAssessment.email || emailAssessment.inputEmail || '';
  const domain = emailAssessment.domain || emailAssessment.mainDomain || emailAssessment.parsed?.domain || '';
  const localPart = emailAssessment.localPart || emailAssessment.parsed?.user || '';
  const isDisposable = Boolean(emailAssessment.isDisposable || emailAssessment.parsed?.isDisposable);
  const isFreeProvider = Boolean(emailAssessment.isFreeProvider || emailAssessment.parsed?.isFreeWebmail);
  const isSuspicious = emailAssessment.riskScore >= 25 || emailAssessment.isSuspicious;

  return (
    <div className="result-white-card">
      <div className="result-card-header">
        <div className="card-header-title-wrap">
          <h4 className="result-card-heading">Sender Identity & Domain Audit</h4>
          <p className="result-card-subheading">
            Analyzed mailbox user, sending host, and disposable provider status
          </p>
        </div>
        <span className={`clean-status-tag ${isSuspicious ? 'warning' : 'safe'}`}>
          {isSuspicious ? <AlertTriangleIcon size={14} /> : <CheckCircleIcon size={14} />}
          <span>{isSuspicious ? 'Impersonation Risk' : 'Standard Mailbox Format'}</span>
        </span>
      </div>

      <div className="telemetry-info-grid">
        <div className="telemetry-box">
          <span className="telemetry-label">Audited Sender Address:</span>
          <span className="telemetry-value-code">{email}</span>
        </div>

        <div className="telemetry-box">
          <span className="telemetry-label">Sender Domain:</span>
          <span className="telemetry-value-highlight">
            {domain || '—'}
          </span>
        </div>

        <div className="telemetry-box">
          <span className="telemetry-label">Mailbox Account:</span>
          <span className="telemetry-value-code">{localPart || '—'}</span>
        </div>

        <div className="telemetry-box">
          <span className="telemetry-label">Provider Type:</span>
          <span className="telemetry-value-pill">
            {isDisposable ? (
              <span className="badge-insecure">Disposable / Temp Mail</span>
            ) : isFreeProvider ? (
              <span className="badge-neutral">Public Webmail (e.g. Gmail/Yahoo)</span>
            ) : (
              <span className="badge-secure">Custom / Corporate Domain</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
