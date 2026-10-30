import React from 'react';

export default function SafetyChecklist({ recommendations = [] }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          🛡️ Recommended Action Steps
        </h3>
      </div>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
        Here are immediate protective steps you should follow regarding this communication:
      </p>

      <ul className="checklist">
        {recommendations.map((rec, index) => (
          <li key={index} className="checklist-item">
            <span className="checklist-icon">✓</span>
            <div>
              <strong>Step {index + 1}: </strong>
              <span>{rec}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
