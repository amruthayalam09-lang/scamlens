import React from 'react';
import { ShieldAlertIcon, ShieldCheckIcon, AlertTriangleIcon, CpuIcon, ZapIcon } from './Icons';

export default function RiskMeter({ assessment }) {
  if (!assessment) return null;

  const { riskScore = 0, riskLevel = 'Low Risk', summary, ruleFindings, aiAnalysis } = assessment;

  let riskTier = 'low';
  let tierLabel = 'LOW RISK / SAFE';
  let strokeColor = '#10b981';
  let glowColor = 'rgba(16, 185, 129, 0.4)';

  if (riskScore >= 60 || riskLevel === 'High Risk') {
    riskTier = 'high';
    tierLabel = 'CRITICAL RISK / SCAM';
    strokeColor = '#ef4444';
    glowColor = 'rgba(239, 68, 68, 0.4)';
  } else if (riskScore >= 25 || riskLevel === 'Moderate Risk') {
    riskTier = 'moderate';
    tierLabel = 'MODERATE RISK / CAUTION';
    strokeColor = '#f59e0b';
    glowColor = 'rgba(245, 158, 11, 0.4)';
  }

  const categories = ruleFindings?.categoriesDetected || [];
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, riskScore)) / 100) * circumference;

  return (
    <div className={`risk-dashboard-card ${riskTier}`}>
      {/* Visual Radial Gauge */}
      <div className="gauge-column">
        <div className="gauge-outer-ring">
          <svg className="radial-gauge-svg" width="140" height="140" viewBox="0 0 140 140">
            {/* Background track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              className="gauge-track"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              className="gauge-progress"
              strokeWidth="10"
              stroke={strokeColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
            />
          </svg>

          {/* Centered Score Display */}
          <div className="gauge-center-content">
            <span className="gauge-score-value">{riskScore}</span>
            <span className="gauge-score-scale">/ 100</span>
            <span className="gauge-score-caption">RISK SCORE</span>
          </div>
        </div>

        {/* Dynamic Threat Status Badge */}
        <div className={`threat-badge-pill ${riskTier}`}>
          <span className="threat-beacon"></span>
          <span className="threat-badge-text">{tierLabel}</span>
        </div>
      </div>

      {/* Threat Summary & Vectors */}
      <div className="assessment-details-column">
        <div className="assessment-header-bar">
          <div className="assessment-title-group">
            {riskTier === 'high' ? (
              <ShieldAlertIcon size={22} className="threat-status-icon high" />
            ) : riskTier === 'moderate' ? (
              <AlertTriangleIcon size={22} className="threat-status-icon moderate" />
            ) : (
              <ShieldCheckIcon size={22} className="threat-status-icon low" />
            )}
            <h3 className="assessment-title">Threat Assessment Overview</h3>
          </div>

          <div className="engine-status-chip">
            {aiAnalysis?.available ? (
              <span className="ai-active-chip" title="Analyzed with Google Gemini 2.0 Flash + Pattern Rules">
                <CpuIcon size={14} />
                <span>Gemini AI + Rule Synthesis</span>
              </span>
            ) : (
              <span className="rule-active-chip" title="Scanned via offline Heuristic Pattern Rules">
                <ZapIcon size={14} />
                <span>Heuristic Rule Engine</span>
              </span>
            )}
          </div>
        </div>

        <p className="assessment-summary-text">
          {summary}
        </p>

        {/* Identified Threat Vectors */}
        {categories.length > 0 && (
          <div className="threat-vectors-wrap">
            <span className="vectors-title">IDENTIFIED THREAT VECTORS:</span>
            <div className="vectors-tags-list">
              {categories.map((cat, idx) => (
                <div key={idx} className={`vector-tag-pill ${riskTier}`}>
                  <span className="vector-alert-bullet">⚠</span>
                  <span className="vector-name">{cat.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
