import React from 'react';
import { SparklesIcon, ShieldCheckIcon, AlertTriangleIcon, InfoIcon } from './Icons';

/**
 * Card 3: AI Explanation Card
 * Explains why the message may be suspicious in simple English,
 * shows the scam classification, and clearly separates AI interpretation from raw evidence.
 */
export default function AiExplanationCard({ aiExplanation, scamType, riskLevel }) {
  if (!aiExplanation && !scamType) return null;

  const classification = aiExplanation?.scamType || scamType || 'Suspicious Communication';
  const reason = aiExplanation?.reason || 'The message contains tactics frequently observed in deceptive communications.';
  const summary = aiExplanation?.summary || '';

  const isHighRisk = riskLevel === 'High Risk';
  const isModerateRisk = riskLevel === 'Moderate Risk' || riskLevel === 'Medium Risk';

  return (
    <div className="result-white-card xai-explanation-card">
      <div className="result-card-header">
        <div className="card-header-title-wrap">
          <div className="xai-header-badge-row">
            <span className="xai-tag-pill purple">
              <SparklesIcon size={13} />
              <span>Card 3: AI Analytical Explanation</span>
            </span>
            <span className="xai-interpretation-tag">
              <InfoIcon size={12} />
              <span>AI Contextual Interpretation</span>
            </span>
          </div>
          <h4 className="result-card-heading">Why This Message May Be Suspicious</h4>
          <p className="result-card-subheading">
            Plain-English explanation of deceptive intent and psychological manipulation tactics
          </p>
        </div>

        <div className="xai-classification-badge">
          <span className="xai-class-label">Classification:</span>
          <span className="xai-class-name">{classification}</span>
        </div>
      </div>

      <div className="xai-card-body">
        {/* Primary Plain-English Reason Box */}
        <div className="xai-primary-reason-box">
          <div className="xai-reason-icon-col">
            {isHighRisk ? (
              <div className="xai-icon-circle red">
                <AlertTriangleIcon size={20} />
              </div>
            ) : isModerateRisk ? (
              <div className="xai-icon-circle amber">
                <AlertTriangleIcon size={20} />
              </div>
            ) : (
              <div className="xai-icon-circle green">
                <ShieldCheckIcon size={20} />
              </div>
            )}
          </div>
          <div className="xai-reason-text-col">
            <span className="xai-reason-title">Core Deception Motive:</span>
            <p className="xai-reason-text">{reason}</p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {summary && (
          <div className="xai-detailed-summary-box">
            <span className="xai-summary-label">Detailed Contextual Assessment:</span>
            <p className="xai-summary-text">{summary}</p>
          </div>
        )}

        {/* Responsible AI Disclaimer Badge */}
        <div className="xai-disclaimer-pill">
          <InfoIcon size={14} className="xai-disclaimer-icon" />
          <span>
            <strong>Transparency Notice:</strong> This interpretation is generated through contextual AI analysis of psychological manipulation cues. It is designed to assist your judgment and does not constitute a legal or definitive accusation.
          </span>
        </div>
      </div>
    </div>
  );
}

