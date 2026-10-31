import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MessageInput from './components/MessageInput';
import LinkInput from './components/LinkInput';
import EmailInput from './components/EmailInput';
import RiskMeter from './components/RiskMeter';
import HighlightViewer from './components/HighlightViewer';
import UrlViewer from './components/UrlViewer';
import EmailViewer from './components/EmailViewer';
import WarningCard from './components/WarningCard';
import SafetyChecklist from './components/SafetyChecklist';
import Disclaimer from './components/Disclaimer';
import ApiKeyNotice from './components/ApiKeyNotice';

export default function App() {
  const [activeTab, setActiveTab] = useState('message'); // 'message' | 'url' | 'email'

  // Message analysis state
  const [message, setMessage] = useState('');
  const [messageAssessment, setMessageAssessment] = useState(null);
  const [lastAnalyzedText, setLastAnalyzedText] = useState('');

  // URL / Link analysis state
  const [url, setUrl] = useState('');
  const [urlAssessment, setUrlAssessment] = useState(null);

  // Email / Sender analysis state
  const [email, setEmail] = useState('');
  const [emailAssessment, setEmailAssessment] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [backendStatus, setBackendStatus] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);

  // Active assessment depending on current tab
  const assessment = activeTab === 'message'
    ? messageAssessment
    : activeTab === 'url'
      ? urlAssessment
      : emailAssessment;

  // Check backend and Gemini status on initial load
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setBackendStatus(true);
          setGeminiConfigured(Boolean(data.geminiConfigured));
        } else {
          setBackendStatus(false);
        }
      } catch (err) {
        console.warn('Backend server not reachable yet:', err);
        setBackendStatus(false);
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyzeMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);
    setMessageAssessment(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let response;
      try {
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: message.trim() }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Server returned ${response.status}`);
      }

      setMessageAssessment(data.assessment);
      setLastAnalyzedText(message.trim());

      if (data.assessment?.aiAnalysis?.available !== undefined) {
        setGeminiConfigured(data.assessment.aiAnalysis.available);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setMessageAssessment(null);
      if (err.name === 'AbortError') {
        setError('The analysis timed out after 30 seconds. The AI service may be overloaded — please try again.');
      } else {
        setError(err.message || 'Could not connect to the backend server. Please make sure the backend is running on port 5000.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeUrl = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setUrlAssessment(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response;
      try {
        response = await fetch('/api/analyze-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Server returned ${response.status}`);
      }

      setUrlAssessment(data.assessment);
    } catch (err) {
      console.error('URL analysis error:', err);
      setUrlAssessment(null);
      if (err.name === 'AbortError') {
        setError('The link analysis timed out. Please check that the backend server is reachable.');
      } else {
        setError(err.message || 'Could not connect to the backend server. Please make sure the backend is running on port 5000.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeEmail = async () => {
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);
    setEmailAssessment(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response;
      try {
        response = await fetch('/api/analyze-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Server returned ${response.status}`);
      }

      setEmailAssessment(data.assessment);
    } catch (err) {
      console.error('Email analysis error:', err);
      setEmailAssessment(null);
      if (err.name === 'AbortError') {
        setError('The email analysis timed out. Please check that the backend server is reachable.');
      } else {
        setError(err.message || 'Could not connect to the backend server. Please make sure the backend is running on port 5000.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearMessage = () => {
    setMessage('');
    setMessageAssessment(null);
    setError(null);
    setLastAnalyzedText('');
  };

  const handleClearUrl = () => {
    setUrl('');
    setUrlAssessment(null);
    setError(null);
  };

  const handleClearEmail = () => {
    setEmail('');
    setEmailAssessment(null);
    setError(null);
  };

  // Combine rule-based matches and AI warning signs for the cards
  const warningCards = [];
  if (assessment) {
    // Add rule matches
    if (assessment.ruleFindings?.matches) {
      assessment.ruleFindings.matches.forEach(m => {
        warningCards.push({
          id: m.id,
          categoryLabel: m.categoryLabel,
          phrase: m.phrase,
          explanation: m.explanation,
          severity: m.severity,
          recommendation: m.recommendation
        });
      });
    }

    // Add any unique AI warnings
    if (assessment.aiAnalysis?.data?.warningSigns) {
      assessment.aiAnalysis.data.warningSigns.forEach((aiWarn, i) => {
        const isDuplicate = warningCards.some(
          w => w.phrase && aiWarn.phraseOrClue && w.phrase.toLowerCase().includes(aiWarn.phraseOrClue.toLowerCase())
        );
        if (!isDuplicate) {
          warningCards.push({
            id: `ai-warn-${i}`,
            categoryLabel: 'AI Contextual Finding',
            phrase: aiWarn.phraseOrClue,
            explanation: aiWarn.plainExplanation,
            severity: 'medium',
            recommendation: 'Be cautious of this pattern in unsolicited communication.'
          });
        }
      });
    }
  }

  // Count embedded links or emails found inside a scanned message
  const embeddedUrlCount = messageAssessment?.ruleFindings?.detectedUrls?.length || 0;
  const embeddedEmailCount = messageAssessment?.ruleFindings?.detectedEmails?.length || 0;

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        backendStatus={backendStatus}
        geminiConfigured={geminiConfigured}
      />

      {/* Hero Intro */}
      <section className="hero">
        <div className="hero-pill">
          <span>🛡️</span> Scam Pattern Recognition Engine
        </div>
        <h2 className="hero-title">
          Understand Suspicious Messages, Links & Emails <span>Before You Lose Money</span>
        </h2>
        <p className="hero-description">
          Paste any confusing SMS, WhatsApp message, email body, suspicious link, or sender address.
          ScamLens breaks down psychological manipulation, website deception, and sender spoofing in plain English.
        </p>
      </section>

      {/* Feature Mode Tab Switcher */}
      <div className="tab-switcher" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'message'}
          className={`tab-btn ${activeTab === 'message' ? 'active' : ''}`}
          onClick={() => { setActiveTab('message'); setError(null); }}
        >
          <span>📩</span>
          <span>Message Scanner</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'url'}
          className={`tab-btn ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => { setActiveTab('url'); setError(null); }}
        >
          <span>🔗</span>
          <span>Link / URL Scanner</span>
          <span className="tab-badge">URL</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'email'}
          className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => { setActiveTab('email'); setError(null); }}
        >
          <span>✉️</span>
          <span>Email / Sender Scanner</span>
          <span className="tab-badge email-badge">EMAIL</span>
        </button>
      </div>

      {/* Main Input Component based on active tab */}
      {activeTab === 'message' && (
        <MessageInput
          message={message}
          setMessage={setMessage}
          onAnalyze={handleAnalyzeMessage}
          isLoading={isLoading}
          onClear={handleClearMessage}
        />
      )}

      {activeTab === 'url' && (
        <LinkInput
          url={url}
          setUrl={setUrl}
          onAnalyze={handleAnalyzeUrl}
          isLoading={isLoading}
          onClear={handleClearUrl}
        />
      )}

      {activeTab === 'email' && (
        <EmailInput
          email={email}
          setEmail={setEmail}
          onAnalyze={handleAnalyzeEmail}
          isLoading={isLoading}
          onClear={handleClearEmail}
        />
      )}

      {/* Gemini Configuration Notice if not configured and on message tab */}
      {!geminiConfigured && activeTab === 'message' && (
        <ApiKeyNotice
          setupInstructions={assessment?.aiAnalysis?.setupInstructions}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="card alert-card error">
          <div className="alert-card-title">⚠️ Error during analysis:</div>
          <p className="alert-card-message">{error}</p>
        </div>
      )}

      {/* Instructions Card shown before any analysis has been submitted */}
      {!assessment && !isLoading && !error && (
        <div className="card instructions-card">
          <div className="card-header">
            <h3 className="card-title">
              {activeTab === 'message' && '📖 How to Use ScamLens Message Scanner'}
              {activeTab === 'url' && '📖 How to Use ScamLens Link Scanner'}
              {activeTab === 'email' && '📖 How to Use ScamLens Email Scanner'}
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.92rem' }}>
            {activeTab === 'message' && 'Check messages before you click links, share private details, or transfer money:'}
            {activeTab === 'url' && 'Safely inspect suspicious links, phishing redirects, and lookalike domains without clicking them:'}
            {activeTab === 'email' && 'Safely verify sender identity, detect free webmail brand impersonation, and spot disposable email addresses:'}
          </p>
          <div className="instruction-steps">
            <div className="instruction-step">
              <span className="step-num">1</span>
              <div>
                <strong>
                  {activeTab === 'message' && 'Paste Suspicious Text'}
                  {activeTab === 'url' && 'Paste Suspicious Link'}
                  {activeTab === 'email' && 'Paste Sender Address or Header'}
                </strong>
                <p>
                  {activeTab === 'message' && 'Paste any SMS, WhatsApp chat, email body, internship offer, or payment request into the box above.'}
                  {activeTab === 'url' && 'Paste any web address, shortened link (bit.ly), or bank portal URL into the box above.'}
                  {activeTab === 'email' && 'Paste any sender email address or full header line (e.g. PayPal Support <support@gmail.com>).'}
                </p>
              </div>
            </div>
            <div className="instruction-step">
              <span className="step-num">2</span>
              <div>
                <strong>Try a Preset Sample</strong>
                <p>
                  {activeTab === 'message' && 'Click any of the sample buttons above to see how common scam patterns look.'}
                  {activeTab === 'url' && 'Click any sample button above (e.g. PayPal subdomain spoof, typosquatting) to see how deceptive links work.'}
                  {activeTab === 'email' && 'Click any sample button above (e.g. PayPal on free Gmail, Amaz0n typosquatting) to see how fake senders disguise themselves.'}
                </p>
              </div>
            </div>
            <div className="instruction-step">
              <span className="step-num">3</span>
              <div>
                <strong>
                  {activeTab === 'message' && 'Click "Analyse Message"'}
                  {activeTab === 'url' && 'Click "Analyse Link"'}
                  {activeTab === 'email' && 'Click "Analyse Email Sender"'}
                </strong>
                <p>
                  {activeTab === 'message' && 'ScamLens automatically scans for advance fee demands, credential requests, fake urgency, embedded deceptive links, and spoofed emails.'}
                  {activeTab === 'url' && 'ScamLens inspects domain ownership, deceptive subdomains, typosquatting, URL shorteners, and HTTP protocol security.'}
                  {activeTab === 'email' && 'ScamLens verifies free webmail impersonation, lookalike domains, disposable inboxes, and high-abuse TLDs.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results View */}
      {assessment && (
        <div className="results-container">
          {/* 1. Risk Meter Overview */}
          <RiskMeter assessment={assessment} />

          {/* Embedded link and email indicators pill row if found in message scan */}
          {activeTab === 'message' && (embeddedUrlCount > 0 || embeddedEmailCount > 0) && (
            <div className="embedded-indicators">
              {embeddedUrlCount > 0 && (
                <span className="embedded-indicator-pill">
                  🔗 {embeddedUrlCount} Embedded Link{embeddedUrlCount > 1 ? 's' : ''} Inspected & Flagged
                </span>
              )}
              {embeddedEmailCount > 0 && (
                <span className="embedded-indicator-pill">
                  ✉️ {embeddedEmailCount} Embedded Email{embeddedEmailCount > 1 ? 's' : ''} Inspected & Flagged
                </span>
              )}
            </div>
          )}

          {/* 2. Message Highlight Viewer, URL Inspector, or Email Breakdown */}
          {activeTab === 'message' && (
            <HighlightViewer
              text={lastAnalyzedText}
              matches={assessment.ruleFindings?.matches || []}
            />
          )}

          {activeTab === 'url' && (
            <UrlViewer assessment={assessment} />
          )}

          {activeTab === 'email' && (
            <EmailViewer assessment={assessment} />
          )}

          {/* 3. Reassurance Card if zero suspicious indicators were found */}
          {warningCards.length === 0 && (
            <div className="card alert-card success">
              <div className="alert-card-header">
                <span className="alert-card-icon">✅</span>
                <strong className="alert-card-headline">
                  {activeTab === 'message' && 'No Obvious Scam Indicators Detected'}
                  {activeTab === 'url' && 'No Obvious Link Deception Detected'}
                  {activeTab === 'email' && 'No Obvious Sender Deception Detected'}
                </strong>
              </div>
              <p className="alert-card-body">
                {activeTab === 'message' && 'This message does not appear to contain known scam keywords, advance-payment demands, artificial urgency, or OTP harvesting patterns. As always, continue exercising standard caution with unsolicited senders.'}
                {activeTab === 'url' && 'This web address does not appear to contain known typosquatting, brand impersonation in subdomains, raw IP patterns, or high-risk TLD tricks. Always verify the domain name matches the official site.'}
                {activeTab === 'email' && 'This email address does not appear to exhibit known brand impersonation, disposable inbox traits, or lookalike typosquatting. Always exercise normal caution with unexpected attachments.'}
              </p>
            </div>
          )}

          {/* 4. Simple English Explanations for Warning Signs */}
          {warningCards.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  🔍 Detected Warning Signs Explained
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {warningCards.length} indicator{warningCards.length > 1 ? 's' : ''} detected
                </span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {activeTab === 'message' && 'Here is why each highlighted phrase, embedded link, or email in the message raises concern:'}
                {activeTab === 'url' && 'Here is why each structural element in this link raises concern:'}
                {activeTab === 'email' && 'Here is why this email address or sender identity raises concern:'}
              </p>

              <div className="warning-signs-grid">
                {warningCards.map((card) => (
                  <WarningCard
                    key={card.id}
                    categoryLabel={card.categoryLabel}
                    phrase={card.phrase}
                    explanation={card.explanation}
                    severity={card.severity}
                    recommendation={card.recommendation}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 5. Actionable Safety Recommendations */}
          <SafetyChecklist
            recommendations={assessment.personalizedSafetyRecommendations}
          />

          {/* 6. Legal / Assessment Disclaimer */}
          <Disclaimer text={assessment.disclaimer} />
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <span>College CSE Project</span>
          <span>•</span>
          <span>Rule Engine + Google Gemini AI</span>
          <span>•</span>
          <span>No User Data Stored</span>
        </div>
        <p>ScamLens is built to empower everyday citizens against digital fraud and social engineering.</p>
      </footer>
    </div>
  );
}
