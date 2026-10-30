import React from 'react';

export default function Disclaimer({ text }) {
  const defaultText =
    text ||
    'Important Notice: ScamLens provides an automated risk assessment based on keyword pattern detection and AI reasoning. This is an educational and advisory assessment, not legal or definitive proof that a message is fraudulent or safe. If in doubt, independently verify with official organizations before clicking links or sending money.';

  return (
    <div className="disclaimer-card">
      <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>⚖️</span>
      <div>
        <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
          Advisory Assessment Disclaimer
        </strong>
        <p>{defaultText}</p>
      </div>
    </div>
  );
}
