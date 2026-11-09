import React, { useState, useRef } from 'react';
import {
  UploadCloudIcon,
  ImageIcon,
  SparklesIcon,
  TrashIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  CheckCircleIcon,
  FileTextIcon,
  LockIcon,
  ZapIcon,
  RefreshIcon
} from './Icons';

// Pre-packaged simulated scam screenshots generated via canvas for instant 1-click testing
const SAMPLE_PRESETS = [
  {
    title: '⚡ Power Cutoff Alert',
    badge: 'Urgency Scam',
    type: 'power',
    lines: [
      '⚡ URGENT NOTIFICATION',
      'Dear Customer, your electricity power will be',
      'disconnected tonight at 9:30 PM because your',
      'previous month bill was not updated.',
      'Immediately call Electricity Officer Mr. Sharma:',
      '📞 9876543210 or install AnyDesk to verify.'
    ]
  },
  {
    title: '💼 Telegram VIP Job',
    badge: 'Task Scam',
    type: 'job',
    lines: [
      'GLOBAL MEDIA HR RECRUITMENT',
      'Congratulations! You are selected for daily part-time work.',
      'Earn ₹3,000 - ₹8,000 daily working 10-15 minutes!',
      'Task: Just like YouTube videos & subscribe.',
      'No registration fee or interview needed.',
      'Contact Manager on Telegram: @hr_priya_tasks'
    ]
  },
  {
    title: '🏦 Bank KYC Suspension',
    badge: 'Credential Theft',
    type: 'bank',
    lines: [
      'STATE BANK ACCOUNT ALERT',
      'Your Savings A/c has been blocked due to pending KYC.',
      'To prevent permanent account deactivation, update your',
      'PAN card immediately: http://bit.ly/sbi-kyc-verify',
      'Enter your 6-digit OTP to unfreeze your balance.'
    ]
  }
];

export default function ScreenshotAnalyzer({ geminiConfigured }) {
  const [selectedImage, setSelectedImage] = useState(null); // { dataUrl, file, name, size }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // Helper to read and validate image file
  const processFile = (file) => {
    setError(null);
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Unsupported file type. Please upload a PNG, JPG, or JPEG image.');
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit. Please upload a smaller screenshot.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage({
        dataUrl: e.target.result,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type
      });
      setAssessment(null);
    };
    reader.onerror = () => {
      setError('Could not read the selected image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Generate canvas-based simulated screenshot for testing
  const handleLoadSample = (sample) => {
    setError(null);
    const canvas = document.createElement('canvas');
    canvas.width = 680;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');

    // Background gradient
    ctx.fillStyle = sample.type === 'power' ? '#FFFBEB' : sample.type === 'job' ? '#EFF6FF' : '#FEF2F2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Inner phone card
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(40, 30, 600, 360, 16);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Header bar
    ctx.fillStyle = sample.type === 'power' ? '#D97706' : sample.type === 'job' ? '#2563EB' : '#DC2626';
    ctx.fillRect(40, 30, 600, 48);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(sample.lines[0], 60, 62);

    // Body lines
    ctx.fillStyle = '#1F2937';
    ctx.font = '16px sans-serif';
    let y = 120;
    for (let i = 1; i < sample.lines.length; i++) {
      if (sample.lines[i].includes('📞') || sample.lines[i].includes('http') || sample.lines[i].includes('Telegram')) {
        ctx.fillStyle = '#DC2626';
        ctx.font = 'bold 16px monospace';
      } else {
        ctx.fillStyle = '#374151';
        ctx.font = '16px sans-serif';
      }
      ctx.fillText(sample.lines[i], 60, y);
      y += 36;
    }

    const dataUrl = canvas.toDataURL('image/png');
    setSelectedImage({
      dataUrl,
      name: `${sample.title.toLowerCase().replace(/\s+/g, '-')}-sample.png`,
      size: '94 KB',
      type: 'image/png'
    });
    setAssessment(null);
  };

  const handleClear = () => {
    setSelectedImage(null);
    setAssessment(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send screenshot to backend for Gemini Vision analysis
  const handleAnalyzeScreenshot = async () => {
    if (!selectedImage || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAssessment(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      const response = await fetch('/api/analyze-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage.dataUrl,
          mimeType: selectedImage.type || 'image/png'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Server returned status ${response.status}`);
      }

      setAssessment(data.assessment);
    } catch (err) {
      console.error('Screenshot analysis error:', err);
      if (err.name === 'AbortError') {
        setError('Screenshot analysis timed out. The image may be too large or the AI vision service took too long.');
      } else {
        setError(err.message || 'Could not connect to backend server. Please verify the backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Radial gauge calculations
  const riskScore = assessment?.riskScore || 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, riskScore));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = '#16A34A';
  let badgeBg = 'rgba(22, 163, 74, 0.08)';
  let badgeBorder = 'rgba(22, 163, 74, 0.25)';
  let tierLabel = 'Low Risk — Likely Safe';

  if (riskScore >= 60 || assessment?.riskLevel === 'High Risk') {
    strokeColor = '#EF4444';
    badgeBg = 'rgba(239, 68, 68, 0.08)';
    badgeBorder = 'rgba(239, 68, 68, 0.25)';
    tierLabel = 'High Risk — Strong Scam Indicators';
  } else if (riskScore >= 25 || assessment?.riskLevel === 'Moderate Risk') {
    strokeColor = '#F59E0B';
    badgeBg = 'rgba(245, 158, 11, 0.08)';
    badgeBorder = 'rgba(245, 158, 11, 0.25)';
    tierLabel = 'Medium Risk — Exercise Caution';
  }

  return (
    <div className="screenshot-analyzer-wrapper">
      {/* Upload & Dropzone Card */}
      <div className="input-card-container">
        {/* Sample Scenarios Quick Load */}
        <div className="presets-wrapper">
          <div className="presets-header">
            <span className="presets-label">
              <ZapIcon size={14} className="accent-icon" />
              Try a sample scam screenshot:
            </span>
            <span className="presets-hint">Simulate real-world WhatsApp, SMS & Bank screenshots</span>
          </div>
          <div className="preset-chips-list">
            {SAMPLE_PRESETS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                className="preset-chip-btn"
                onClick={() => handleLoadSample(sample)}
                disabled={isLoading}
                title="Load sample screenshot"
              >
                <span className="preset-chip-text">{sample.title}</span>
                <span className="preset-chip-badge">{sample.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dropzone or Preview Area */}
        {!selectedImage ? (
          <div
            className={`dropzone-container ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="dropzone-hidden-input"
              onChange={handleFileChange}
            />
            <div className="dropzone-icon-box">
              <UploadCloudIcon size={32} />
            </div>
            <h4 className="dropzone-title">Drag & drop your screenshot here, or click to browse</h4>
            <p className="dropzone-subtitle">
              Upload any screenshot of SMS, WhatsApp, payment receipts, job posts, or banking alerts
            </p>
            <div className="dropzone-format-tags">
              <span className="format-tag">PNG</span>
              <span className="format-tag">JPG</span>
              <span className="format-tag">JPEG</span>
              <span className="format-tag-dim">Max 5MB</span>
            </div>
          </div>
        ) : (
          <div className="image-preview-panel">
            <div className="preview-media-box">
              <img
                src={selectedImage.dataUrl}
                alt="Selected screenshot preview"
                className="preview-image"
              />
            </div>

            <div className="preview-meta-box">
              <div className="meta-filename-group">
                <ImageIcon size={18} className="meta-icon" />
                <div className="meta-text-wrap">
                  <span className="meta-filename">{selectedImage.name}</span>
                  <span className="meta-filesize">{selectedImage.size} • Ready for Multimodal Vision OCR</span>
                </div>
              </div>

              <div className="preview-action-buttons">
                <button
                  type="button"
                  className="btn-clear"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  <TrashIcon size={15} />
                  <span>Remove Image</span>
                </button>

                <button
                  type="button"
                  className="btn-primary-analyse"
                  onClick={handleAnalyzeScreenshot}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-dot"></span>
                      <span>Vision OCR & Threat Analysis...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon size={16} />
                      <span>Analyse Screenshot</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security & Privacy declaration */}
        <div className="input-action-footer">
          <div className="input-meta-info">
            <span className="privacy-pill">
              <LockIcon size={13} className="privacy-lock-icon" />
              Zero Persistent Storage: Image is processed in volatile memory only and never permanently saved
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="light-error-alert">
          <AlertTriangleIcon size={20} className="alert-icon" />
          <div className="alert-text-wrap">
            <strong>Screenshot Analysis Notice:</strong> {error}
          </div>
        </div>
      )}

      {/* Analysis Results Display */}
      {assessment && !isLoading && (
        <div className="results-wrapper">
          <div className="results-header-row">
            <h3 className="results-title">Screenshot Vision Threat Report</h3>
            <div className="results-actions-right">
              <button
                type="button"
                className="btn-upload-another"
                onClick={handleClear}
              >
                <RefreshIcon size={14} />
                <span>Upload Another Screenshot</span>
              </button>
            </div>
          </div>

          {/* Risk Score Card */}
          <div className={`results-score-card ${riskScore >= 60 ? 'high' : riskScore >= 25 ? 'moderate' : 'low'}`}>
            <div className="score-gauge-column">
              <div className="gauge-outer-circle">
                <svg className="radial-svg" width="136" height="136" viewBox="0 0 136 136">
                  <circle
                    cx="68"
                    cy="68"
                    r={radius}
                    className="gauge-bg-track"
                    strokeWidth="9"
                    fill="transparent"
                  />
                  <circle
                    cx="68"
                    cy="68"
                    r={radius}
                    className="gauge-progress-circle"
                    strokeWidth="9"
                    stroke={strokeColor}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="gauge-center-content">
                  <span className="gauge-score-value" style={{ color: strokeColor }}>
                    {clampedScore}
                  </span>
                  <span className="gauge-score-max">/100</span>
                  <span className="gauge-score-caption">RISK SCORE</span>
                </div>
              </div>
            </div>

            <div className="score-details-column">
              <div className="score-badge-row">
                <span
                  className="risk-level-badge"
                  style={{
                    color: strokeColor,
                    backgroundColor: badgeBg,
                    borderColor: badgeBorder
                  }}
                >
                  {riskScore >= 60 ? <ShieldAlertIcon size={16} /> : <ShieldCheckIcon size={16} />}
                  <span>{tierLabel}</span>
                </span>

                <span className="ai-verified-chip" title="Analyzed with Gemini 2.0 Multimodal Vision">
                  <SparklesIcon size={13} />
                  <span>Gemini Vision OCR</span>
                </span>

                {assessment.scamType && (
                  <span className="threat-category-pill">
                    {assessment.scamType}
                  </span>
                )}
              </div>

              <h3 className="score-headline">
                {riskScore >= 60
                  ? 'High Risk Deception Patterns Identified in Screenshot'
                  : riskScore >= 25
                    ? 'Questionable Indicators Found in Screenshot'
                    : 'No Significant Scam Triggers Found in Screenshot'}
              </h3>

              <p className="score-summary-text">{assessment.summary}</p>
            </div>
          </div>

          {/* Extracted Text Card */}
          {assessment.extractedText && (
            <div className="result-white-card">
              <div className="result-card-header">
                <div className="card-header-title-wrap">
                  <h4 className="result-card-heading">
                    <FileTextIcon size={18} className="heading-inline-icon" />
                    Visible Extracted Text Payload (OCR)
                  </h4>
                  <p className="result-card-subheading">
                    Full text read from the screenshot with flagged suspicious phrases highlighted
                  </p>
                </div>
              </div>
              <div className="highlighted-text-container">
                <pre className="ocr-text-block">{assessment.extractedText}</pre>
              </div>
            </div>
          )}

          {/* Suspicious Warning Signs Grid */}
          {assessment.warningSigns && assessment.warningSigns.length > 0 && (
            <div className="warning-cards-section">
              <div className="section-label-row">
                <h4 className="cards-group-title">
                  Identified Deception Clues ({assessment.warningSigns.length})
                </h4>
                <span className="cards-group-hint">
                  Reasons for suspicion extracted directly from the image
                </span>
              </div>

              <div className="warning-cards-grid">
                {assessment.warningSigns.map((warn, i) => (
                  <div key={i} className={`warning-item-card ${warn.severity || 'high'}`}>
                    <div className="warning-card-header">
                      <span className="warning-category-name">Flagged Deception Signal</span>
                      <span className="warning-severity-badge">
                        {(warn.severity || 'high').toUpperCase()} RISK
                      </span>
                    </div>

                    {warn.phraseOrClue && (
                      <div className="flagged-snippet-box">
                        <span className="snippet-caption">Found in Screenshot:</span>
                        <code className="snippet-quote">"{warn.phraseOrClue}"</code>
                      </div>
                    )}

                    <p className="warning-explanation-text">{warn.plainExplanation}</p>

                    {warn.recommendation && (
                      <div className="warning-action-tip">
                        <span className="action-tip-label">Action: </span>
                        <span className="action-tip-text">{warn.recommendation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Red Flags */}
          {assessment.visualClues && assessment.visualClues.length > 0 && (
            <div className="result-white-card">
              <div className="result-card-header">
                <div className="card-header-title-wrap">
                  <h4 className="result-card-heading">Visual Red Flags Detected</h4>
                  <p className="result-card-subheading">
                    Layout anomalies, spoofed brand cues, and urgency markers seen in the image
                  </p>
                </div>
              </div>
              <ul className="visual-clues-list">
                {assessment.visualClues.map((clue, idx) => (
                  <li key={idx} className="visual-clue-item">
                    <AlertTriangleIcon size={16} className="visual-clue-icon" />
                    <span>{clue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Recommendations Checklist */}
          {assessment.safetyRecommendations && assessment.safetyRecommendations.length > 0 && (
            <div className="result-white-card">
              <div className="result-card-header">
                <div className="card-header-title-wrap">
                  <h4 className="result-card-heading">Recommended Safety Countermeasures</h4>
                  <p className="result-card-subheading">
                    Follow these immediate defensive steps based on this screenshot
                  </p>
                </div>
                <span className="checklist-pill-badge">
                  <ShieldCheckIcon size={14} />
                  <span>Incident Checklist</span>
                </span>
              </div>
              <div className="checklist-items-grid">
                {assessment.safetyRecommendations.map((rec, index) => (
                  <div key={index} className="checklist-item-row">
                    <div className="checklist-step-number">{index + 1}</div>
                    <div className="checklist-text-wrap">
                      <span className="checklist-step-title">ACTION STEP #{index + 1}</span>
                      <p className="checklist-instruction">{rec}</p>
                    </div>
                    <div className="checklist-check-icon">
                      <CheckCircleIcon size={18} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
