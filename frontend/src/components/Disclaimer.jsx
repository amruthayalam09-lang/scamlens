import React from 'react';
import { ShieldIcon } from './Icons';

export default function Disclaimer({ text }) {
  const defaultText =
    text ||
    'Important Notice: ScamLens provides automated pattern assessments based on keyword heuristic rules and Gemini AI contextual evaluation. This is an educational and advisory assessment, not definitive legal proof that a communication is fraudulent or safe. Always verify independently through official telephone lines or verified websites before taking financial actions.';

  return (
    <div className="compliance-disclaimer-card">
      <div className="disclaimer-icon-wrap">
        <ShieldIcon size={20} className="disclaimer-icon" />
      </div>
      <div className="disclaimer-text-wrap">
        <strong className="disclaimer-heading">Advisory Assessment & Ethical AI Notice</strong>
        <p className="disclaimer-body">{defaultText}</p>
      </div>
    </div>
  );
}
