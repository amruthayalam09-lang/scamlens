import React from 'react';
import { AlertTriangleIcon, LightbulbIcon, ShieldAlertIcon, CheckCircleIcon } from './Icons';

export default function WarningCard({
  categoryLabel,
  phrase,
  explanation,
  severity = 'medium',
  recommendation
}) {
  const isHigh = severity === 'high';
  const isLow = severity === 'low';

  const severityColor = isHigh ? '#EF4444' : isLow ? '#16A34A' : '#F59E0B';
  const severityBg = isHigh
    ? 'rgba(239, 68, 68, 0.08)'
    : isLow
      ? 'rgba(22, 163, 74, 0.08)'
      : 'rgba(245, 158, 11, 0.08)';
  const severityBorder = isHigh
    ? 'rgba(239, 68, 68, 0.25)'
    : isLow
      ? 'rgba(22, 163, 74, 0.25)'
      : 'rgba(245, 158, 11, 0.25)';

  return (
    <div className={`warning-item-card ${severity}`}>
      <div className="warning-card-header">
        <div className="warning-card-title-group">
          <div
            className="warning-icon-pill"
            style={{ color: severityColor, backgroundColor: severityBg }}
          >
            {isHigh ? (
              <ShieldAlertIcon size={16} />
            ) : isLow ? (
              <CheckCircleIcon size={16} />
            ) : (
              <AlertTriangleIcon size={16} />
            )}
          </div>
          <span className="warning-category-name">{categoryLabel || 'Indicator Flagged'}</span>
        </div>

        <span
          className="warning-severity-badge"
          style={{
            color: severityColor,
            backgroundColor: severityBg,
            borderColor: severityBorder
          }}
        >
          {severity.toUpperCase()} RISK
        </span>
      </div>

      {phrase && (
        <div className="flagged-snippet-box">
          <span className="snippet-caption">Flagged Content:</span>
          <p className="snippet-quote">"{phrase}"</p>
        </div>
      )}

      <p className="warning-explanation-text">
        {explanation}
      </p>

      {recommendation && (
        <div className="warning-action-tip">
          <div className="action-tip-icon">
            <LightbulbIcon size={15} />
          </div>
          <div className="action-tip-content">
            <strong className="action-tip-label">Recommended Countermeasure: </strong>
            <span className="action-tip-text">{recommendation}</span>
          </div>
        </div>
      )}
    </div>
  );
}
