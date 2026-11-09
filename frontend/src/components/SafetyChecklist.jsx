import React from 'react';
import { ShieldCheckIcon, CheckCircleIcon } from './Icons';

export default function SafetyChecklist({ recommendations = [] }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="result-white-card">
      <div className="result-card-header">
        <div className="card-header-title-wrap">
          <h4 className="result-card-heading">Recommended Safety Steps</h4>
          <p className="result-card-subheading">
            Immediate actions to protect your personal information, accounts, and money
          </p>
        </div>
        <span className="checklist-pill-badge">
          <ShieldCheckIcon size={14} />
          <span>Action Checklist</span>
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
