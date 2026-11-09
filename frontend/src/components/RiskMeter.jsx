import React from 'react';
import { ShieldAlertIcon, ShieldCheckIcon, AlertTriangleIcon, SparklesIcon, ZapIcon } from './Icons';

export default function RiskMeter({ assessment }) {
  if (!assessment) return null;

  const { riskScore = 0, riskLevel = 'Low Risk', summary, ruleFindings, aiAnalysis } = assessment;

  // Exact color palette as requested:
  // High risk: #EF4444
  // Medium risk: #F59E0B
  // Low risk: #16A34A
  let riskTier = 'low';
  let tierLabel = 'Low Risk — Likely Safe';
  let strokeColor = '#16A34A';
  let badgeBg = 'rgba(22, 163, 74, 0.08)';
  let badgeBorder = 'rgba(22, 163, 74, 0.25)';
  let IconComponent = ShieldCheckIcon;

  if (riskScore >= 60 || riskLevel === 'High Risk') {
    riskTier = 'high';
    tierLabel = 'High Risk — Strong Scam Indicators';
    strokeColor = '#EF4444';
    badgeBg = 'rgba(239, 68, 68, 0.08)';
    badgeBorder = 'rgba(239, 68, 68, 0.25)';
    IconComponent = ShieldAlertIcon;
  } else if (riskScore >= 25 || riskLevel === 'Moderate Risk') {
    riskTier = 'moderate';
    tierLabel = 'Medium Risk — Exercise Caution';
    strokeColor = '#F59E0B';
    badgeBg = 'rgba(245, 158, 11, 0.08)';
    badgeBorder = 'rgba(245, 158, 11, 0.25)';
    IconComponent = AlertTriangleIcon;
  }

  const categories = ruleFindings?.categoriesDetected || [];
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, riskScore));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className={`results-score-card ${riskTier}`}>
      {/* Visual Radial Gauge Column */}
      <div className="score-gauge-column">
        <div className="gauge-outer-circle">
          <svg className="radial-svg" width="136" height="136" viewBox="0 0 136 136">
            <circle
              cx="68"
              cy="68"
              r={radius}
              className="gauge-bg-track"
              strokeWidth="9"
              fill="transparent"
            />
            <circle
              cx="68"
              cy="68"
              r={radius}
              className="gauge-progress-circle"
              strokeWidth="9"
              stroke={strokeColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="gauge-center-content">
            <span className="gauge-score-value" style={{ color: strokeColor }}>
              {clampedScore}
            </span>
            <span className="gauge-score-max">/100</span>
            <span className="gauge-score-caption">RISK SCORE</span>
          </div>
        </div>
      </div>

      {/* Narrative & Category Breakdown Column */}
      <div className="score-details-column">
        <div className="score-badge-row">
          <span
            className="risk-level-badge"
            style={{
              color: strokeColor,
              backgroundColor: badgeBg,
              borderColor: badgeBorder
            }}
          >
            <IconComponent size={16} />
            <span>{tierLabel}</span>
          </span>

          {aiAnalysis?.available && (
            <span className="ai-verified-chip" title="Synthesized with Google Gemini AI contextual reasoning">
              <SparklesIcon size={13} />
              <span>AI Synthesized</span>
            </span>
          )}
        </div>

        <h3 className="score-headline">
          {riskTier === 'high' && 'High Probability of Deception Detected'}
          {riskTier === 'moderate' && 'Caution Advised: Suspicious Patterns Found'}
          {riskTier === 'low' && 'No Major Psychological or Deception Patterns Found'}
        </h3>

        <p className="score-summary-text">
          {summary || (
            riskTier === 'high'
              ? 'This content displays critical hallmarks of social engineering, including high pressure urgency, impersonation, or credential theft attempts.'
              : riskTier === 'moderate'
                ? 'This content contains questionable triggers or unverified claims. Verify the sender independently before clicking any links or providing details.'
                : 'ScamLens did not identify manipulative red flags in this message. Always stay alert when sharing sensitive data.'
          )}
        </p>

        {/* Category Tag Cloud */}
        {categories.length > 0 && (
          <div className="detected-categories-cloud">
            <span className="categories-label">Identified Threat Vectors:</span>
            <div className="categories-pills">
              {categories.map((cat, i) => (
                <span key={i} className="threat-category-pill">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
