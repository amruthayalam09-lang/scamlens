import React from 'react';

export default function WarningCard({
  categoryLabel,
  phrase,
  explanation,
  severity = 'medium',
  recommendation
}) {
  return (
    <div className={`warning-card ${severity}`}>
      <div>
        <div className="warning-card-header">
          <span className="warning-category">{categoryLabel || 'Warning Sign'}</span>
          <span className={`warning-severity-badge ${severity}`}>
            {severity} Risk
          </span>
        </div>

        {phrase && (
          <div className="warning-phrase">
            "{phrase}"
          </div>
        )}

        <p className="warning-explanation">
          {explanation}
        </p>
      </div>

      {recommendation && (
        <div className="warning-tip">
          <span className="warning-tip-icon">💡</span>
          <span className="warning-tip-text">{recommendation}</span>
        </div>
      )}
    </div>
  );
}
