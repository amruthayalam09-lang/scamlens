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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <h3>Risk Assessment Overview</h3>
          {aiAnalysis?.available ? (
            <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              🤖 Gemini AI + Rules
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.3)' }}>
              ⚡ Rule Pattern Engine
            </span>
          )}
        </div>

        <p className="risk-summary-text">
          {summary}
        </p>

        {categories.length > 0 && (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
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
