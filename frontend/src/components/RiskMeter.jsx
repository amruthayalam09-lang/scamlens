import React, { useState } from 'react';
import {
  ShieldAlertIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  SparklesIcon,
  ZapIcon,
  InfoIcon,
  ChevronDownIcon
} from './Icons';

/**
 * Card 1: Explainable Risk Score Card
 * Shows overall risk score, gauge, level, and an explicit breakdown explaining:
 * - Why this specific score was assigned
 * - How the score was calculated (Rule Engine score vs Gemini AI score)
 * - Key contributing factors
 */
export default function RiskMeter({ assessment }) {
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

  if (!assessment) return null;

  const {
    riskScore = 0,
    riskLevel = 'Low Risk',
    summary,
    ruleFindings,
    aiAnalysis,
    scoreBreakdown
  } = assessment;

  // Exact color palette:
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

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, riskScore));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const rationale = scoreBreakdown?.rationale || summary;
  const ruleScore = scoreBreakdown?.ruleScore ?? ruleFindings?.score ?? clampedScore;
  const aiScore = scoreBreakdown?.aiScore ?? (aiAnalysis?.data?.aiRiskScore ?? null);
  const contributingFactors = scoreBreakdown?.contributingFactors || [];

  return (
    <div className={`results-score-card xai-score-card ${riskTier}`}>
      {/* Top Card Label */}
      <div className="xai-card-indicator-strip">
        <span className="xai-tag-pill purple">
          <ZapIcon size={13} />
          <span>Card 1: Explainable Risk Score</span>
        </span>
        <span className="xai-model-badge">
          Dual-Engine Assessment (Regex Heuristics + Gemini 2.0 AI)
        </span>
      </div>

      <div className="score-main-flex-row">
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

        {/* Narrative & Rationale Column */}
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

          {/* Explainable Rationale Box */}
          <div className="xai-score-rationale-box">
            <span className="xai-rationale-title">Why This Score Was Assigned:</span>
            <p className="xai-rationale-text">{rationale}</p>
          </div>
        </div>
      </div>

      {/* Score Calculation Breakdown Section */}
      <div className="xai-score-breakdown-section">
        <button
          type="button"
          className="xai-toggle-breakdown-btn"
          onClick={() => setShowCalculationDetails(!showCalculationDetails)}
        >
          <InfoIcon size={15} />
          <span>View Detailed Scoring Mechanics</span>
          <ChevronDownIcon
            size={16}
            style={{
              transform: showCalculationDetails ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </button>

        {showCalculationDetails && (
          <div className="xai-calculation-details-panel">
            <div className="xai-subscores-grid">
              <div className="xai-subscore-card">
                <div className="xai-subscore-header">
                  <ZapIcon size={15} className="text-purple" />
                  <span className="xai-subscore-label">Rule Pattern Scanner</span>
                  <span className="xai-subscore-weight">45% weight</span>
                </div>
                <div className="xai-subscore-number">
                  {ruleScore} <span className="subscore-max">/100</span>
                </div>
                <p className="xai-subscore-desc">
                  Based on keyword matching, psychological urgency markers, and known scam syntax.
                </p>
              </div>

              <div className="xai-subscore-card">
                <div className="xai-subscore-header">
                  <SparklesIcon size={15} className="text-purple" />
                  <span className="xai-subscore-label">Gemini Contextual AI</span>
                  <span className="xai-subscore-weight">55% weight</span>
                </div>
                <div className="xai-subscore-number">
                  {aiScore !== null ? aiScore : 'N/A'} <span className="subscore-max">/100</span>
                </div>
                <p className="xai-subscore-desc">
                  Contextual semantic inference assessing deception subtlety and social engineering.
                </p>
              </div>
            </div>

            {/* Contributing Factors Pills */}
            {contributingFactors.length > 0 && (
              <div className="xai-factors-row">
                <span className="xai-factors-label">Contributing Factors:</span>
                <div className="xai-factors-pills">
                  {contributingFactors.map((factor, i) => (
                    <span
                      key={i}
                      className={`xai-factor-pill ${factor.severity || 'high'}`}
                    >
                      <strong>{factor.category}</strong>
                      {factor.phrase ? `: "${factor.phrase}"` : ''}
                      <span className="factor-pts">+{factor.weight || 20} pts</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
