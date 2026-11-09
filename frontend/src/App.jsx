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
import {
  ShieldCheckIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
  ZapIcon,
  LockIcon,
  GlobeIcon,
  MailIcon,
  MessageSquareIcon,
  CpuIcon,
  TerminalIcon,
  SparklesIcon
} from './components/Icons';

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

  // Check backend and Gemini status on initial load and keep polling
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
        setError(err.message || 'Could not connect to the backend server. Please make sure the backend is running.');
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
        setError(err.message || 'Could not connect to the backend server. Please make sure the backend is running.');
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
        setError(err.message || 'Could not connect to the backend server. Please make sure the backend is running.');
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

    if (assessment.aiAnalysis?.data?.warningSigns) {
      assessment.aiAnalysis.data.warningSigns.forEach((aiWarn, i) => {
        const isDuplicate = warningCards.some(
          w => w.phrase && aiWarn.phraseOrClue && w.phrase.toLowerCase().includes(aiWarn.phraseOrClue.toLowerCase())
        );
        if (!isDuplicate) {
          warningCards.push({
            id: `ai-warn-${i}`,
            categoryLabel: 'AI Contextual Reasoning',
            phrase: aiWarn.phraseOrClue,
            explanation: aiWarn.plainExplanation,
            severity: 'medium',
            recommendation: 'Be cautious of this psychological manipulation pattern.'
          });
        }
      });
    }
  }

  // Count embedded links or emails found inside scanned message
  const embeddedUrlCount = messageAssessment?.ruleFindings?.detectedUrls?.length || 0;
  const embeddedEmailCount = messageAssessment?.ruleFindings?.detectedEmails?.length || 0;

  return (
    <div className="scamlens-app">
      {/* Dynamic Background Cyber Lighting */}
      <div className="cyber-ambient-grid"></div>
      <div className="cyber-glow-top-left"></div>
      <div className="cyber-glow-top-right"></div>
      <div className="cyber-glow-center"></div>

      {/* Top Navbar */}
      <Header
        backendStatus={backendStatus}
        geminiConfigured={geminiConfigured}
      />

      <main className="main-content-layout">
        {/* Requirement 3: Impressive Homepage with heading "Think Before You Trust." */}
        <section className="hero-section">
          <div className="hero-pill-badge">
            <span className="pill-radar-dot"></span>
            <span className="pill-text">AI SCAM INTELLIGENCE & SOCIAL ENGINEERING DEFENSE</span>
          </div>

          <h1 className="hero-headline">
            Think Before <span className="headline-gradient">You Trust.</span>
          </h1>

          <p className="hero-tagline">
            Social engineers exploit urgency, fear, and fake authority to steal OTPs, credentials, and savings.
            ScamLens deconstructs suspicious messages, phishing URLs, and spoofed senders in real time — explaining hidden psychological manipulation in plain English.
          </p>

          {/* Cyber Trust & Feature Pillars */}
          <div className="trust-metrics-strip">
            <div className="trust-metric-item">
              <ZapIcon size={16} className="metric-icon" />
              <div className="metric-text-wrap">
                <span className="metric-title">0ms Pattern Match</span>
                <span className="metric-subtitle">Instant Offline Heuristics</span>
              </div>
            </div>

            <div className="metric-divider"></div>

            <div className="trust-metric-item">
              <CpuIcon size={16} className="metric-icon" />
              <div className="metric-text-wrap">
                <span className="metric-title">Gemini 2.0 Flash</span>
                <span className="metric-subtitle">Deep Deception Reasoning</span>
              </div>
            </div>

            <div className="metric-divider"></div>

            <div className="trust-metric-item">
              <LockIcon size={16} className="metric-icon" />
              <div className="metric-text-wrap">
                <span className="metric-title">100% Privacy-First</span>
                <span className="metric-subtitle">Zero User Data Stored</span>
              </div>
            </div>

            <div className="metric-divider"></div>

            <div className="trust-metric-item">
              <TerminalIcon size={16} className="metric-icon" />
              <div className="metric-text-wrap">
                <span className="metric-title">Multi-Vector Analysis</span>
                <span className="metric-subtitle">SMS, Links & Email Senders</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Mode Tab Switcher */}
        <div className="mode-switcher-container">
          <div className="mode-switcher-nav" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'message'}
              className={`mode-tab-btn ${activeTab === 'message' ? 'active' : ''}`}
              onClick={() => { setActiveTab('message'); setError(null); }}
            >
              <MessageSquareIcon size={18} className="tab-icon" />
              <span className="tab-label">Message / SMS Scanner</span>
              <span className="tab-tag-badge">HEURISTIC</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'url'}
              className={`mode-tab-btn ${activeTab === 'url' ? 'active' : ''}`}
              onClick={() => { setActiveTab('url'); setError(null); }}
            >
              <GlobeIcon size={18} className="tab-icon" />
              <span className="tab-label">Link & Domain Inspector</span>
              <span className="tab-tag-badge cyan">URL</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'email'}
              className={`mode-tab-btn ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => { setActiveTab('email'); setError(null); }}
            >
              <MailIcon size={18} className="tab-icon" />
              <span className="tab-label">Email & Sender Auditor</span>
              <span className="tab-tag-badge purple">SENDER</span>
            </button>
          </div>
        </div>

        {/* Active Input Scanner Section */}
        <section className="scanner-section">
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
        </section>

        {/* Optional Gemini AI Key Banner (only on message tab if not yet added) */}
        {!geminiConfigured && activeTab === 'message' && (
          <ApiKeyNotice
            setupInstructions={assessment?.aiAnalysis?.setupInstructions}
          />
        )}

        {/* Error Notification Alert */}
        {error && (
          <div className="cyber-error-alert">
            <div className="alert-icon-box">
              <AlertTriangleIcon size={22} className="alert-error-icon" />
            </div>
            <div className="alert-content-box">
              <strong className="alert-error-title">Analysis Engine Warning:</strong>
              <p className="alert-error-message">{error}</p>
            </div>
          </div>
        )}

        {/* Informational Guidance (shown before analysis) */}
        {!assessment && !isLoading && !error && (
          <section className="architecture-preview-card">
            <div className="preview-card-header">
              <div className="preview-title-wrap">
                <SparklesIcon size={20} className="preview-icon" />
                <h3 className="preview-title">
                  {activeTab === 'message' && 'How ScamLens Triages Suspicious Messages'}
                  {activeTab === 'url' && 'How ScamLens Deconstructs Phishing Websites'}
                  {activeTab === 'email' && 'How ScamLens Unmasks Fake Email Senders'}
                </h3>
              </div>
              <span className="preview-mode-tag">CYBERSECURITY FRAMEWORK</span>
            </div>

            <p className="preview-description">
              {activeTab === 'message' && 'Inspect messages before you transfer funds, share OTPs, or click links sent by unknown contacts:'}
              {activeTab === 'url' && 'Inspect web links, banking redirects, and typosquatted domains in a secure isolated environment:'}
              {activeTab === 'email' && 'Detect free webmail impersonation, lookalike domains, and disposable spam infrastructure:'}
            </p>

            <div className="workflow-steps-grid">
              <div className="workflow-step-card">
                <div className="step-num-pill">01</div>
                <h4 className="workflow-step-title">
                  {activeTab === 'message' && 'Payload Ingestion'}
                  {activeTab === 'url' && 'Domain Resolution'}
                  {activeTab === 'email' && 'Header Inspection'}
                </h4>
                <p className="workflow-step-desc">
                  {activeTab === 'message' && 'Paste any SMS, WhatsApp chat, fake job offer, or lottery claim into the scanner.'}
                  {activeTab === 'url' && 'Paste any shortened bit.ly URL, banking portal, or suspicious customer care link.'}
                  {activeTab === 'email' && 'Paste any sender address or full header line (e.g. PayPal Alert <support@gmail.com>).'}
                </p>
              </div>

              <div className="workflow-step-card">
                <div className="step-num-pill">02</div>
                <h4 className="workflow-step-title">Heuristic Scanning</h4>
                <p className="workflow-step-desc">
                  {activeTab === 'message' && 'Instant pattern matching searches for OTP demands, remote desktop tools, and panic keywords.'}
                  {activeTab === 'url' && 'Checks for typosquatting, deceptive brand subdomains, unencrypted HTTP, and raw IP addresses.'}
                  {activeTab === 'email' && 'Verifies lookalike company domains, free webmail abuse, and disposable mailboxes.'}
                </p>
              </div>

              <div className="workflow-step-card">
                <div className="step-num-pill">03</div>
                <h4 className="workflow-step-title">Threat Synthesis</h4>
                <p className="workflow-step-desc">
                  Combines heuristic findings with Google Gemini AI contextual evaluation to produce a 0–100 risk score and step-by-step action plan.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Results Dashboard (Shown when analysis completes) */}
        {assessment && (
          <section className="results-dashboard-container">
            {/* 1. Risk Meter Overview Dashboard Card */}
            <RiskMeter assessment={assessment} />

            {/* Embedded Link/Email Notification Pills (if scanned message contained links/emails) */}
            {activeTab === 'message' && (embeddedUrlCount > 0 || embeddedEmailCount > 0) && (
              <div className="embedded-telemetry-strip">
                {embeddedUrlCount > 0 && (
                  <div className="embedded-pill url">
                    <GlobeIcon size={15} />
                    <span>{embeddedUrlCount} Embedded URL{embeddedUrlCount > 1 ? 's' : ''} Detected & Flagged</span>
                  </div>
                )}
                {embeddedEmailCount > 0 && (
                  <div className="embedded-pill email">
                    <MailIcon size={15} />
                    <span>{embeddedEmailCount} Embedded Email Address{embeddedEmailCount > 1 ? 'es' : ''} Detected & Flagged</span>
                  </div>
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

            {/* 3. Reassurance Card when Zero Red Flags are Detected */}
            {warningCards.length === 0 && (
              <div className="clean-verdict-card">
                <div className="clean-icon-wrap">
                  <ShieldCheckIcon size={26} className="clean-icon" />
                </div>
                <div className="clean-text-wrap">
                  <h4 className="clean-title">
                    {activeTab === 'message' && 'No Obvious Scam Indicators Detected'}
                    {activeTab === 'url' && 'No Deceptive Link Indicators Detected'}
                    {activeTab === 'email' && 'No Deceptive Sender Indicators Detected'}
                  </h4>
                  <p className="clean-desc">
                    {activeTab === 'message' && 'This message does not appear to contain known social engineering keywords, advance-payment demands, artificial urgency, or OTP harvesting patterns. Always exercise standard caution with unsolicited contacts.'}
                    {activeTab === 'url' && 'This web address does not match known typosquatting patterns, deceptive subdomains, raw IP hosts, or high-risk TLD tricks. Always verify the domain name matches the official verified site.'}
                    {activeTab === 'email' && 'This sender email does not exhibit known free webmail impersonation, throwaway inboxes, or lookalike typosquatting. Always exercise normal care with unsolicited attachments.'}
                  </p>
                </div>
              </div>
            )}

            {/* 4. Warning Sign Cards Grid */}
            {warningCards.length > 0 && (
              <div className="dashboard-section-card">
                <div className="section-card-header">
                  <div className="section-header-title">
                    <ShieldAlertIcon size={20} className="section-icon crimson" />
                    <h3 className="section-title">Detected Deception Patterns & Warning Signs</h3>
                  </div>
                  <span className="flagged-count-badge">
                    {warningCards.length} Vector{warningCards.length > 1 ? 's' : ''} Flagged
                  </span>
                </div>

                <p className="section-subtitle">
                  Here is why each flagged clue, phrase, or infrastructure element raises concern:
                </p>

                <div className="warning-cards-cyber-grid">
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

            {/* 5. Step-by-Step Action Checklist */}
            <SafetyChecklist
              recommendations={assessment.personalizedSafetyRecommendations}
            />

            {/* 6. Legal & Advisory Disclaimer */}
            <Disclaimer text={assessment.disclaimer} />
          </section>
        )}
      </main>

      {/* Modern Cyber Footer */}
      <footer className="cyber-footer">
        <div className="footer-container">
          <div className="footer-brand-row">
            <div className="footer-brand">
              <span className="brand-title">Scam<span className="brand-accent">Lens</span></span>
              <span className="footer-badge">AI CYBER DEFENSE</span>
            </div>
            <p className="footer-mission">
              Empowering ordinary people to identify social engineering, phishing, and scam manipulation before financial loss.
            </p>
          </div>

          <div className="footer-meta-row">
            <div className="footer-pill-group">
              <span className="footer-meta-pill">🎓 College CSE Major Project</span>
              <span className="footer-meta-pill">⚡ Dual-Layer Rule + Gemini AI</span>
              <span className="footer-meta-pill">🔒 Zero Message Logging</span>
            </div>
            <span className="copyright-text">ScamLens © 2026. Built for Public Cyber Awareness.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
