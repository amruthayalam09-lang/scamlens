import React from 'react';

export default function ApiKeyNotice({ setupInstructions }) {
  const steps = setupInstructions || {
    step1: 'Visit Google AI Studio at https://aistudio.google.com/app/apikey',
    step2: 'Click "Create API Key" (it is free for developers & college projects)',
    step3: 'For local: add to backend/.env | For Vercel: add GEMINI_API_KEY in Vercel Project Settings → Environment Variables',
    step4: 'Restart your backend or trigger a Vercel redeploy'
  };

  return (
    <div className="key-notice">
      <div className="key-notice-icon">⚙️</div>
      <div className="key-notice-content">
        <h4>Want deeper AI analysis? Add your Google Gemini API Key</h4>
        <p>
          The built-in <strong>Rule Pattern Engine</strong> is actively detecting scams. To activate Gemini AI's deep contextual reasoning and deception analysis:
        </p>
        <ol className="key-steps">
          <li>
            1. {steps.step1 || 'Get a free key from Google AI Studio'}{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
              (Open AI Studio ↗)
            </a>
          </li>
          <li>2. {steps.step2}</li>
          <li>
            3. In local: paste <code>GEMINI_API_KEY=AIzaSy...</code> into <code>backend/.env</code>. On Vercel: set <code>GEMINI_API_KEY</code> in Project Settings.
          </li>
          <li>4. {steps.step4}</li>
        </ol>
      </div>
    </div>
  );
}
