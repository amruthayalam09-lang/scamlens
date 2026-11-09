import React from 'react';
import { AlertTriangleIcon, LightbulbIcon, ShieldAlertIcon } from './Icons';

export default function WarningCard({
  categoryLabel,
  phrase,
  explanation,
  severity = 'medium',
  recommendation
}) {
  const isHigh = severity === 'high';
  const isLow = severity === 'low';

  return (
    <div className={`cyber-warning-card ${severity}`}>
      <div className="card-top-bar">
        <div className="warning-category-group">
          <span className="warning-category-title">{categoryLabel || 'Warning Indicator'}</span>
        </div>
        <span className={`severity-tag ${severity}`}>
          <span className="severity-pulse"></span>
          {severity.toUpperCase()} RISK
        </span>
      </div>

      {phrase && (
        <div className="flagged-phrase-box">
          <span className="phrase-prefix">&gt; Flagged Clue:</span>
          <code className="phrase-text">"{phrase}"</code>
        </div>
      )}

      <p className="warning-explanation-text">
        {explanation}
      </p>

      {recommendation && (
        <div className="warning-remedy-box">
          <LightbulbIcon size={16} className="remedy-icon" />
          <div className="remedy-content">
            <span className="remedy-label">Defensive Action: </span>
            <span className="remedy-text">{recommendation}</span>
          </div>
        </div>
      )}
    </div>
  );
}
