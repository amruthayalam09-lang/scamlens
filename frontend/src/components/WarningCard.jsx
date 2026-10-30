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
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: severity === 'high' ? '#f87171' : '#fbbf24'
            }}
          >
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
          <span>💡</span>
          <span>{recommendation}</span>
        </div>
      )}
    </div>
  );
}
