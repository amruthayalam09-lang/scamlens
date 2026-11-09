import React from 'react';
import {
  ShieldAlertIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  SparklesIcon,
  ExternalLinkIcon,
  TrashIcon,
  FileTextIcon,
  ZapIcon
} from './Icons';

/**
 * Modal to display historical analysis results in full detail
 * Allows re-inspecting previous findings and restoring them directly into the live scanner.
 */
export default function DashboardResultModal({
  record,
  onClose,
  onLoadInScanner,
  onDelete
}) {
  if (!record) return null;

  const {
    type,
    timestamp,
    preview,
    fullInput,
    riskScore = 0,
    riskLevel = 'Low Risk',
    scamType,
    categories = [],
    summary,
    assessment = {}
  } = record;

  const dateStr = new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const isHigh = riskScore >= 60 || riskLevel === 'High Risk';
  const isMed = !isHigh && (riskScore >= 25 || riskLevel === 'Moderate Risk' || riskLevel === 'Medium Risk');

  const strokeColor = isHigh ? '#EF4444' : isMed ? '#F59E0B' : '#16A34A';
  const badgeBg = isHigh
    ? 'rgba(239, 68, 68, 0.08)'
    : isMed
      ? 'rgba(245, 158, 11, 0.08)'
      : 'rgba(22, 163, 74, 0.08)';
  const badgeBorder = isHigh
    ? 'rgba(239, 68, 68, 0.25)'
    : isMed
      ? 'rgba(245, 158, 11, 0.25)'
      : 'rgba(22, 163, 74, 0.25)';

  const warningMatches =
    assessment.ruleFindings?.matches ||
    assessment.warningSigns ||
    [];

  const recommendations =
    assessment.personalizedSafetyRecommendations ||
    assessment.recommendations ||
    [];

  return (
    <div className="dash-modal-backdrop" onClick={onClose}>
      <div
        className="dash-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="dash-modal-header">
          <div>
            <div className="dash-modal-eyebrow">
              <span className="dash-type-pill">{type.toUpperCase()} ANALYSIS ARCHIVE</span>
              <span className="dash-modal-date">{dateStr}</span>
            </div>
            <h3 className="dash-modal-title">Previous Analysis Assessment</h3>
          </div>
          <button
            type="button"
            className="dash-modal-close-btn"
            onClick={onClose}
            aria-label="Close Modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Content Scroll */}
        <div className="dash-modal-body">
          {/* Risk Level & Score Banner */}
          <div className="dash-modal-score-banner" style={{ borderColor: strokeColor }}>
            <div className="dash-modal-score-number" style={{ color: strokeColor }}>
              {riskScore}
              <span className="dash-modal-score-max">/100</span>
            </div>
            <div className="dash-modal-score-info">
              <span
                className="dash-modal-level-badge"
                style={{ color: strokeColor, backgroundColor: badgeBg, borderColor: badgeBorder }}
              >
                {isHigh ? <ShieldAlertIcon size={15} /> : isMed ? <AlertTriangleIcon size={15} /> : <ShieldCheckIcon size={15} />}
                <span>{riskLevel}</span>
              </span>
              <h4 className="dash-modal-scamtype">{scamType || 'Analyzed Communication'}</h4>
              <p className="dash-modal-summary">
                {summary || (assessment.aiExplanation?.reason || 'Evaluation completed successfully.')}
              </p>
            </div>
          </div>

          {/* Original Analyzed Payload */}
          <div className="dash-modal-section">
            <span className="dash-modal-section-title">Analyzed Content Payload:</span>
            <div className="dash-modal-payload-box">
              <code>{fullInput || preview}</code>
            </div>
          </div>

          {/* Detected Warning Signs / Triggers */}
          {warningMatches.length > 0 && (
            <div className="dash-modal-section">
              <span className="dash-modal-section-title">
                Detected Threat Triggers ({warningMatches.length}):
              </span>
              <div className="dash-modal-triggers-list">
                {warningMatches.map((w, i) => (
                  <div key={i} className="dash-modal-trigger-item">
                    <div className="dash-trigger-header">
                      <span className="dash-trigger-cat">{w.categoryLabel || 'Deception Clue'}</span>
                      <span className={`dash-trigger-sev ${w.severity || 'high'}`}>
                        {(w.severity || 'high').toUpperCase()}
                      </span>
                    </div>
                    {w.phrase && <div className="dash-trigger-phrase">"{w.phrase}"</div>}
                    <p className="dash-trigger-expl">{w.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Recommendations */}
          {recommendations.length > 0 && (
            <div className="dash-modal-section">
              <span className="dash-modal-section-title">Safety Recommendations:</span>
              <ul className="dash-modal-recs-list">
                {recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="dash-modal-footer">
          <button
            type="button"
            className="dash-modal-delete-btn"
            onClick={() => {
              if (window.confirm('Delete this record from local history?')) {
                onDelete(record.id);
                onClose();
              }
            }}
          >
            <TrashIcon size={16} />
            <span>Delete Record</span>
          </button>

          <div className="dash-modal-right-actions">
            <button
              type="button"
              className="dash-modal-cancel-btn"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="dash-modal-load-btn"
              onClick={() => {
                onLoadInScanner(record);
                onClose();
              }}
            >
              <ExternalLinkIcon size={16} />
              <span>Load in Live Scanner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
