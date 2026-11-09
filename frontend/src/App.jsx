import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroIllustration from './components/HeroIllustration';
import AiAssistant from './components/AiAssistant';
import ScreenshotAnalyzer from './components/ScreenshotAnalyzer';
import MessageInput from './components/MessageInput';
import LinkInput from './components/LinkInput';
import EmailInput from './components/EmailInput';
import RiskMeter from './components/RiskMeter';
import HighlightViewer from './components/HighlightViewer';
import AiExplanationCard from './components/AiExplanationCard';
import WarningSignsCard from './components/WarningSignsCard';
import UrlViewer from './components/UrlViewer';
import EmailViewer from './components/EmailViewer';
import WarningCard from './components/WarningCard';
import SafetyChecklist from './components/SafetyChecklist';
import Disclaimer from './components/Disclaimer';
import ApiKeyNotice from './components/ApiKeyNotice';
import Dashboard from './components/Dashboard';
import { saveAnalysisRecord } from './utils/historyStorage';
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
  SparklesIcon,
  ChevronRightIcon,
  ImageIcon,
  BarChartIcon
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

      // Save to local privacy-conscious threat history
      saveAnalysisRecord({
        type: 'message',
        inputPreview: message.trim(),
        fullInput: message.trim(),
        assessment: data.assessment
      });

      if (data.assessment?.aiAnalysis?.available !== undefined) {
        setGeminiConfigured(data.assessment.aiAnalysis.available);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setMessageAssessment(null);
      if (err.name === 'AbortError') {
        setError('The analysis timed out. The server or AI service took too long to respond — please try again.');
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

      // Save to local privacy-conscious threat history
      saveAnalysisRecord({
        type: 'url',
        inputPreview: url.trim(),
        fullInput: url.trim(),
        assessment: data.assessment
      });
    } catch (err) {
      console.error('URL analysis error:', err);
      setUrlAssessment(null);
      if (err.name === 'AbortError') {
        setError('The URL analysis timed out. Please check that the backend server is reachable.');
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

      // Save to local privacy-conscious threat history
      saveAnalysisRecord({
        type: 'email',
        inputPreview: email.trim(),
        fullInput: email.trim(),
        assessment: data.assessment
      });
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

  const scrollToScanner = () => {
    const el = document.getElementById('scanner');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToDashboard = () => {
    const el = document.getElementById('dashboard');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToScreenshot = () => {
    const el = document.getElementById('screenshot-analyzer');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToAssistant = () => {
    const el = document.getElementById('ai-assistant');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLoadInScanner = (record) => {
    if (!record) return;

    if (record.type === 'message') {
      setActiveTab('message');
      setMessage(record.fullInput || record.preview || '');
      setLastAnalyzedText(record.fullInput || record.preview || '');
      setMessageAssessment(record.assessment);
      scrollToScanner();
    } else if (record.type === 'url') {
      setActiveTab('url');
      setUrl(record.fullInput || record.preview || '');
      setUrlAssessment(record.assessment);
      scrollToScanner();
    } else if (record.type === 'email') {
      setActiveTab('email');
      setEmail(record.fullInput || record.preview || '');
      setEmailAssessment(record.assessment);
      scrollToScanner();
    } else if (record.type === 'screenshot') {
      scrollToScreenshot();
    }
  };

  return (
    <div className="scamlens-root">
      {/* 1. Navbar */}
      <Header
        backendStatus={backendStatus}
        geminiConfigured={geminiConfigured}
        onScanClick={scrollToScanner}
      />

      <main className="page-content">
        {/* 2. Hero Section: Soft Lavender Background, Large Heading, Subtitle, Purple CTA, Illustration */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-text-col">
              <div className="hero-tag-pill">
                <span className="pill-dot-purple"></span>
                <span className="pill-tag-text">AI-POWERED SCAM PATTERN DETECTION</span>
              </div>

              <h1 className="hero-title">
                Think Before <span className="hero-title-highlight">You Trust.</span>
              </h1>

              <p className="hero-subtitle">
                ScamLens is an intelligent scam pattern recognition engine designed for ordinary people.
                Deconstruct suspicious messages, phishing links, and fake senders in real time — understanding
                psychological manipulation before you lose money or credentials.
              </p>

              <div className="hero-cta-group">
                <button
                  type="button"
                  className="btn-hero-primary"
                  onClick={scrollToScanner}
                >
                  <ZapIcon size={18} />
                  <span>Scan Content</span>
                </button>

                <button
                  type="button"
                  className="btn-hero-assistant"
                  onClick={scrollToDashboard}
                >
                  <BarChartIcon size={18} />
                  <span>Risk Dashboard</span>
                </button>

                <button
                  type="button"
                  className="btn-hero-assistant"
                  onClick={scrollToScreenshot}
                >
                  <ImageIcon size={18} />
                  <span>Screenshot OCR</span>
                </button>

                <button
                  type="button"
                  className="btn-hero-assistant"
                  onClick={scrollToAssistant}
                >
                  <SparklesIcon size={18} />
                  <span>AI Assistant</span>
                </button>

                <button
                  type="button"
                  className="btn-hero-secondary"
                  onClick={scrollToHowItWorks}
                >
                  <span>How it Works</span>
                  <ChevronRightIcon size={16} />
                </button>
              </div>

              {/* Trust Metric Badges */}
              <div className="hero-trust-row">
                <div className="trust-pill-item">
                  <ZapIcon size={15} className="trust-icon" />
                  <span>Instant Offline Heuristics</span>
                </div>
                <div className="trust-pill-item">
                  <CpuIcon size={15} className="trust-icon" />
                  <span>Gemini 2.0 Flash AI</span>
                </div>
                <div className="trust-pill-item">
                  <LockIcon size={15} className="trust-icon" />
                  <span>100% Privacy-First</span>
                </div>
              </div>
            </div>

            {/* AI / Cybersecurity Illustration */}
            <div className="hero-illustration-col">
              <HeroIllustration />
            </div>
          </div>
        </section>

        {/* 3. Scanner Section */}
        <section id="scanner" className="scanner-section">
          <div className="section-container">
            <div className="section-header-center">
              <span className="section-eyebrow">LIVE DEFENSE CONSOLE</span>
              <h2 className="section-heading">Inspect Suspicious Content</h2>
              <p className="section-subheading">
                Paste any SMS, WhatsApp alert, web link, or sender email to analyze deception patterns.
              </p>
            </div>

            {/* Mode Tab Switcher */}
            <div className="scanner-tabs-bar">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'message' ? 'active' : ''}`}
                onClick={() => { setActiveTab('message'); setError(null); }}
              >
                <MessageSquareIcon size={17} />
                <span>Message & SMS Scanner</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'url' ? 'active' : ''}`}
                onClick={() => { setActiveTab('url'); setError(null); }}
              >
                <GlobeIcon size={17} />
                <span>Link & Domain Inspector</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
                onClick={() => { setActiveTab('email'); setError(null); }}
              >
                <MailIcon size={17} />
                <span>Email & Sender Auditor</span>
              </button>
            </div>

            {/* Active Input Container */}
            <div className="scanner-input-container">
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
            </div>

            {/* Optional Gemini AI Key Banner (if not yet configured) */}
            {!geminiConfigured && activeTab === 'message' && (
              <ApiKeyNotice
                setupInstructions={assessment?.aiAnalysis?.setupInstructions}
              />
            )}

            {/* Error Notification Alert */}
            {error && (
              <div className="light-error-alert">
                <AlertTriangleIcon size={20} className="alert-icon" />
                <div className="alert-text-wrap">
                  <strong>Notice:</strong> {error}
                </div>
              </div>
            )}

            {/* 4. Analysis Results Section */}
            {assessment && !isLoading && (
              <div className="results-wrapper">
                <div className="results-header-row">
                  <h3 className="results-title">Analysis Assessment Report</h3>
                  <span className="results-timestamp">
                    Inspected just now • {activeTab.toUpperCase()} PAYLOAD
                  </span>
                </div>

                {/* Card 1: Prominent Explainable Risk Score Card */}
                <RiskMeter assessment={assessment} />

                {/* Card 2: Visual Highlight Viewer & Phrase Meaning Breakdown for message tab */}
                {activeTab === 'message' && (
                  <HighlightViewer
                    text={lastAnalyzedText || message}
                    matches={assessment.ruleFindings?.matches || []}
                  />
                )}

                {/* Card 3: AI Explanation Card (Plain-English Motive, Classification, Responsible AI Notice) */}
                {activeTab === 'message' && (
                  <AiExplanationCard
                    aiExplanation={assessment.aiExplanation}
                    scamType={assessment.aiAnalysis?.data?.scamType}
                    riskLevel={assessment.riskLevel}
                  />
                )}

                {/* Card 4: Categorized Warning Signs (separates Factual Evidence from AI Contextual Reasoning) */}
                {activeTab === 'message' && (
                  <WarningSignsCard
                    warningSigns={assessment.warningSigns || warningCards}
                  />
                )}

                {/* Link telemetry card for URL tab */}
                {activeTab === 'url' && (
                  <UrlViewer urlAssessment={assessment} />
                )}

                {/* Email telemetry card for Email tab */}
                {activeTab === 'email' && (
                  <EmailViewer emailAssessment={assessment} />
                )}

                {/* Warning Cards Grid for URL and Email tabs */}
                {activeTab !== 'message' && warningCards.length > 0 && (
                  <div className="warning-cards-section">
                    <div className="section-label-row">
                      <h4 className="cards-group-title">
                        Detected Deception Triggers ({warningCards.length})
                      </h4>
                      <span className="cards-group-hint">
                        Detailed breakdown of psychological tactics and suspicious patterns
                      </span>
                    </div>

                    <div className="warning-cards-grid">
                      {warningCards.map((warn) => (
                        <WarningCard
                          key={warn.id}
                          categoryLabel={warn.categoryLabel}
                          phrase={warn.phrase}
                          explanation={warn.explanation}
                          severity={warn.severity}
                          recommendation={warn.recommendation}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Reassurance Card when 0 warnings on URL/Email */}
                {activeTab !== 'message' && warningCards.length === 0 && (
                  <div className="reassurance-card">
                    <div className="reassurance-icon">
                      <ShieldCheckIcon size={24} />
                    </div>
                    <div className="reassurance-text">
                      <h4>Clean Verification Verdict</h4>
                      <p>
                        No high-pressure urgency, credential theft, fake authority, or known deception keywords
                        were identified. Always verify unexpected payment requests directly with the sender.
                      </p>
                    </div>
                  </div>
                )}

                {/* Card 5: Safety Action Steps Checklist */}
                <SafetyChecklist
                  recommendations={assessment.personalizedSafetyRecommendations || assessment.recommendations || []}
                />

                {/* Ethical Disclaimer */}
                <Disclaimer text={assessment.disclaimer} />
              </div>
            )}
          </div>
        </section>

        {/* 4. Scam Risk Analytics Dashboard */}
        <Dashboard onLoadInScanner={handleLoadInScanner} />

        {/* 5. Screenshot Analyzer Section */}
        <section id="screenshot-analyzer" className="screenshot-section">
          <div className="section-container">
            <div className="section-header-center">
              <span className="section-eyebrow">MULTIMODAL COMPUTER VISION OCR</span>
              <h2 className="section-heading">Screenshot Scam Analyzer</h2>
              <p className="section-subheading">
                Upload or drop any screenshot of suspicious WhatsApp chats, SMS alerts, fake job offers, or payment screens to detect hidden scam patterns.
              </p>
            </div>

            <ScreenshotAnalyzer geminiConfigured={geminiConfigured} />
          </div>
        </section>

        {/* 5. AI Assistant Section */}
        <section id="ai-assistant" className="assistant-section">
          <div className="section-container">
            <div className="section-header-center">
              <span className="section-eyebrow">INTERACTIVE SAFETY ADVISOR</span>
              <h2 className="section-heading">ScamLens AI Assistant</h2>
              <p className="section-subheading">
                Have questions about a confusing message, unexpected OTP request, or job offer?
                Ask our digital safety assistant for instant, plain-English guidance.
              </p>
            </div>

            <AiAssistant geminiConfigured={geminiConfigured} />
          </div>
        </section>

        {/* 5. How It Works Section */}
        <section id="how-it-works" className="how-it-works-section">
          <div className="section-container">
            <div className="section-header-center">
              <span className="section-eyebrow">SIMPLE 3-STEP DEFENSE</span>
              <h2 className="section-heading">How ScamLens Protects You</h2>
              <p className="section-subheading">
                Designed specifically for everyday people to quickly verify suspicious messages before taking action.
              </p>
            </div>

            <div className="steps-cards-grid">
              <div className="step-feature-card">
                <div className="step-card-num">01</div>
                <div className="step-card-icon-box">
                  <MessageSquareIcon size={24} />
                </div>
                <h3 className="step-card-title">Paste Suspicious Content</h3>
                <p className="step-card-desc">
                  Copy any confusing text message, WhatsApp forward, bank OTP alert, job offer, or email link into the scanner.
                </p>
              </div>

              <div className="step-feature-card">
                <div className="step-card-num">02</div>
                <div className="step-card-icon-box">
                  <CpuIcon size={24} />
                </div>
                <h3 className="step-card-title">Dual-Engine Detection</h3>
                <p className="step-card-desc">
                  Our offline pattern rule engine matches known fraud keywords in 0ms, while Google Gemini 2.0 analyzes subtle psychological manipulation.
                </p>
              </div>

              <div className="step-feature-card">
                <div className="step-card-num">03</div>
                <div className="step-card-icon-box">
                  <ShieldCheckIcon size={24} />
                </div>
                <h3 className="step-card-title">Plain-English Guidance</h3>
                <p className="step-card-desc">
                  Receive a clear 0-100 risk score, highlighted deceitful phrases, and simple defensive countermeasures you can follow immediately.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Features Grid Section */}
        <section id="features" className="features-section">
          <div className="section-container">
            <div className="section-header-center">
              <span className="section-eyebrow">WHY SCAMLENS</span>
              <h2 className="section-heading">Engineered for Accuracy & Privacy</h2>
              <p className="section-subheading">
                Combining speed, artificial intelligence, and privacy-first principles.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-item-card">
                <div className="feature-icon-wrapper">
                  <ZapIcon size={20} />
                </div>
                <h4 className="feature-title">Urgency & Pressure Detection</h4>
                <p className="feature-text">
                  Detects artificial time limits, electricity cutoff threats, and immediate bank freeze tactics used to force rushed mistakes.
                </p>
              </div>

              <div className="feature-item-card">
                <div className="feature-icon-wrapper">
                  <GlobeIcon size={20} />
                </div>
                <h4 className="feature-title">Subdomain & Brand Spoofing</h4>
                <p className="feature-text">
                  Unmasks sneaky subdomains like <code>paypal.com.account-update.xyz</code> where the true destination domain is disguised.
                </p>
              </div>

              <div className="feature-item-card">
                <div className="feature-icon-wrapper">
                  <SparklesIcon size={20} />
                </div>
                <h4 className="feature-title">Gemini 2.0 AI Synthesis</h4>
                <p className="feature-text">
                  Goes beyond keyword matching to interpret emotional context, subtle deception, and advance-fee promise patterns.
                </p>
              </div>

              <div className="feature-item-card">
                <div className="feature-icon-wrapper">
                  <LockIcon size={20} />
                </div>
                <h4 className="feature-title">100% Privacy Guarantee</h4>
                <p className="feature-text">
                  Your submitted messages are inspected in memory and never stored in a permanent database or sold to third parties.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. About / Footer Section */}
        <footer id="about" className="footer-section">
          <div className="footer-container">
            <div className="footer-top-row">
              <div className="footer-brand-info">
                <div className="footer-logo">
                  <span className="logo-text">Scam<span className="logo-accent">Lens</span></span>
                  <span className="logo-pill">AI</span>
                </div>
                <p className="footer-tagline">
                  AI-Powered Scam Pattern Detection for Ordinary People.
                  Empowering internet users to spot social engineering and avoid financial fraud.
                </p>
                <div className="footer-badge-pill">
                  <span>🎓 Computer Science & Engineering Major Project</span>
                </div>
              </div>

              <div className="footer-links-col">
                <h5 className="footer-heading">Platform</h5>
                <button type="button" className="footer-link-btn" onClick={scrollToScanner}>Message Scanner</button>
                <button type="button" className="footer-link-btn" onClick={scrollToScreenshot}>Screenshot OCR</button>
                <button type="button" className="footer-link-btn" onClick={scrollToScanner}>URL Inspector</button>
                <button type="button" className="footer-link-btn" onClick={scrollToScanner}>Email Auditor</button>
                <button type="button" className="footer-link-btn" onClick={scrollToAssistant}>AI Assistant</button>
              </div>

              <div className="footer-links-col">
                <h5 className="footer-heading">Information</h5>
                <button type="button" className="footer-link-btn" onClick={scrollToHowItWorks}>How It Works</button>
                <button type="button" className="footer-link-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Top</button>
              </div>
            </div>

            <div className="footer-bottom-row">
              <p className="footer-copyright">
                © {new Date().getFullYear()} ScamLens. Built for cybersecurity awareness and research.
              </p>
              <div className="footer-privacy-note">
                <span>Privacy-First • No Tracking • Ethical AI</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
