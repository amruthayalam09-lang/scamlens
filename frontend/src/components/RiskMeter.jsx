import React from 'react';

export default function RiskMeter({ assessment }) {
  if (!assessment) return null;

  const { riskScore, riskLevel, summary, ruleFindings, aiAnalysis } = assessment;

  let riskTier = 'low';
  if (riskScore >= 60 || riskLevel === 'High Risk') {
    riskTier = 'high';
  } else if (riskScore >= 25 || riskLevel === 'Moderate Risk') {
    riskTier = 'moderate';
  }

  const categories = ruleFindings?.categoriesDetected || [];

  return (
    <div className="risk-summary-card">
      <div className="risk-gauge-box">
        <div className={`risk-circle ${riskTier}`}>
          <span className="risk-circle-number">{riskScore}</span>
          <span className="risk-circle-max">/ 100</span>
        </div>
        <span className={`risk-pill ${riskTier}`}>
          {riskLevel}
        </span>
      </div>

      <div className="risk-details">
        <div className="risk-details-header">
          <h3>Risk Assessment Overview</h3>
          {aiAnalysis?.available ? (
            <span className="engine-badge ai">
              🤖 Gemini AI + Rules
            </span>
          ) : (
            <span className="engine-badge rules">
              ⚡ Rule Pattern Engine
            </span>
          )}
        </div>

        <p className="risk-summary-text">
          {summary}
        </p>

        {categories.length > 0 && (
          <div className="threat-vectors-section">
            <div className="threat-vectors-label">
              Identified Threat Vectors:
            </div>
            <div className="indicator-tags">
              {categories.map((cat, idx) => (
                <span key={idx} className="indicator-tag">
                  ⚠️ {cat.replace(/_/g, ' ').toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
