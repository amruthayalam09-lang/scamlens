import React from 'react';
import { ShieldCheckIcon, CheckCircleIcon } from './Icons';

/**
 * Card 5: Recommended Actions Card
 * Immediate defensive action steps tailored to the detected risk level and indicators.
 */
export default function SafetyChecklist({ recommendations = [] }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="result-white-card xai-action-card">
      <div className="result-card-header">
        <div className="card-header-title-wrap">
          <span className="xai-tag-pill purple">
            <ShieldCheckIcon size={13} />
            <span>Card 5: Recommended Defensive Actions</span>
          </span>
          <h4 className="result-card-heading">Immediate Safety Checklist</h4>
          <p className="result-card-subheading">
            Concrete actions to safeguard your personal credentials, bank accounts, and devices
          </p>
        </div>
        <span className="checklist-pill-badge">
          <ShieldCheckIcon size={14} />
          <span>Action Plan ({recommendations.length} Steps)</span>
        </span>
      </div>

      <div className="checklist-items-grid">
        {recommendations.map((rec, index) => (
          <div key={index} className="checklist-item-row">
            <div className="checklist-step-number">
              {index + 1}
            </div>
            <div className="checklist-text-wrap">
              <span className="checklist-step-title">STEP {index + 1}</span>
              <p className="checklist-instruction">{rec}</p>
            </div>
            <div className="checklist-check-icon">
              <CheckCircleIcon size={18} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
