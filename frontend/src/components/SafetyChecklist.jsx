import React from 'react';
import { ShieldCheckIcon, CheckCircleIcon } from './Icons';

export default function SafetyChecklist({ recommendations = [] }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="dashboard-section-card checklist-section">
      <div className="section-card-header">
        <div className="section-header-title">
          <ShieldCheckIcon size={20} className="section-icon emerald" />
          <h3 className="section-title">Recommended Defensive Action Steps</h3>
        </div>
        <span className="section-header-hint">Immediate incident response checklist</span>
      </div>

      <p className="checklist-subtext">
        Follow these practical countermeasures immediately to secure your accounts, credentials, and devices:
      </p>

      <div className="cyber-checklist-grid">
        {recommendations.map((rec, index) => (
          <div key={index} className="checklist-card-item">
            <div className="step-badge">
              <span className="step-badge-number">{index + 1}</span>
            </div>
            <div className="step-body">
              <span className="step-title">ACTION #{index + 1}</span>
              <p className="step-instruction">{rec}</p>
            </div>
            <div className="step-check-mark">
              <CheckCircleIcon size={18} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
