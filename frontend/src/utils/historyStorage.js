/**
 * Privacy-First Analysis History Storage Manager
 * 
 * Stores scam analysis records locally on the user's client machine (localStorage).
 * No personally identifiable information or scan history is ever transmitted to external databases.
 */

const STORAGE_KEY = 'scamlens_analysis_history';
const MAX_HISTORY_ITEMS = 100;

/**
 * Mask sensitive sequences (e.g. 16-digit card numbers, 6-digit OTP codes) for privacy
 */
function sanitizePreview(text = '') {
  if (typeof text !== 'string') return '';
  return text
    // Mask potential 16-digit cards
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, '****-****-****-****')
    // Mask explicit 6-digit OTPs
    .replace(/(otp\s*(?:is|:)?\s*)\d{4,8}/gi, '$1******')
    .slice(0, 140);
}

/**
 * Retrieve all analysis records sorted from newest to oldest
 */
export function getAnalysisHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[ScamLens] Error reading analysis history from localStorage:', err);
    return [];
  }
}

/**
 * Save an analysis result into local history
 */
export function saveAnalysisRecord({
  type = 'message',
  inputPreview = '',
  fullInput = '',
  assessment = {},
  customTimestamp = null
}) {
  if (!assessment) return null;

  try {
    const history = getAnalysisHistory();

    const riskScore = Math.min(100, Math.max(0, Number(assessment.riskScore || 0)));
    let riskLevel = assessment.riskLevel || 'Low Risk';
    if (riskScore >= 60) riskLevel = 'High Risk';
    else if (riskScore >= 25) riskLevel = 'Medium Risk';
    else riskLevel = 'Low Risk';

    // Extract primary scam category / classification
    const scamType =
      assessment.aiExplanation?.scamType ||
      assessment.aiAnalysis?.data?.scamType ||
      assessment.ruleFindings?.categoriesDetected?.[0] ||
      assessment.domainSecurity?.flags?.[0] ||
      assessment.primaryCategory ||
      (riskScore >= 60 ? 'High-Risk Deception' : riskScore >= 25 ? 'Suspicious Indicator' : 'Safe / Clean');

    const warningSignsCount =
      assessment.warningSigns?.length ||
      assessment.ruleFindings?.matches?.length ||
      0;

    const record = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type, // 'message' | 'url' | 'email' | 'screenshot'
      timestamp: customTimestamp || new Date().toISOString(),
      preview: sanitizePreview(inputPreview || fullInput),
      fullInput: fullInput || inputPreview,
      riskScore,
      riskLevel,
      scamType,
      categories: assessment.ruleFindings?.categoriesDetected || [scamType],
      warningSignsCount,
      summary: assessment.summary || assessment.aiExplanation?.summary || '',
      assessment // Complete assessment retained for full 1-click restore/viewing
    };

    // Prepend newest item, cap at MAX_HISTORY_ITEMS
    const updated = [record, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Notify listeners across components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scamlens_history_updated', { detail: updated }));
    }

    return record;
  } catch (err) {
    console.error('[ScamLens] Failed to save analysis record:', err);
    return null;
  }
}

/**
 * Delete a single record by ID
 */
export function deleteAnalysisRecord(id) {
  try {
    const history = getAnalysisHistory();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scamlens_history_updated', { detail: updated }));
    }
    return true;
  } catch (err) {
    console.error('[ScamLens] Failed to delete analysis record:', err);
    return false;
  }
}

/**
 * Completely clear analysis history
 */
export function clearAllAnalysisHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scamlens_history_updated', { detail: [] }));
    }
    return true;
  } catch (err) {
    console.error('[ScamLens] Failed to clear analysis history:', err);
    return false;
  }
}

/**
 * Export history as a downloadable JSON file for security audits
 */
export function exportHistoryAsJson() {
  const history = getAnalysisHistory();
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scamlens-audit-history-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Pre-populate with representative sample scans for instant testing & evaluation
 */
export function seedSampleScans() {
  const now = Date.now();
  const samples = [
    {
      id: `sample_1_${now}`,
      type: 'message',
      timestamp: new Date(now - 1000 * 60 * 25).toISOString(), // 25 mins ago
      preview: 'Congratulations! You won ₹50,000. Pay ₹500 immediately to claim your prize.',
      fullInput: 'Congratulations! You won ₹50,000. Pay ₹500 immediately to claim your prize.',
      riskScore: 100,
      riskLevel: 'High Risk',
      scamType: 'Advance-Fee Lottery Scam',
      categories: ['payment_requests', 'unrealistic_rewards'],
      warningSignsCount: 3,
      summary: 'High-pressure advance fee demand disguised as a cash lottery prize.',
      assessment: {
        riskScore: 100,
        riskLevel: 'High Risk',
        summary: 'Detected 3 suspicious patterns across payment_requests and lottery fraud.',
        ruleFindings: {
          score: 100,
          matches: [
            { phrase: 'Congratulations! You won ₹50,000', categoryLabel: 'Unrealistic Prize Claim', severity: 'high', explanation: 'Unexpected lottery winnings without entering are classic advance-fee traps.' },
            { phrase: 'Pay ₹500 immediately', categoryLabel: 'Advance Payment Request', severity: 'high', explanation: 'Demands upfront payment before receiving funds.' },
            { phrase: 'to claim your prize', categoryLabel: 'Deceptive Reward Hook', severity: 'high', explanation: 'Lowers victim defense before monetary demand.' }
          ]
        },
        aiExplanation: {
          scamType: 'Advance-Fee Lottery Scam',
          reason: 'The sender is asking for money before providing the promised reward.'
        },
        personalizedSafetyRecommendations: [
          'Do not make any upfront payments to claim unverified prizes.',
          'Block this phone number and report it to cybercrime authorities.'
        ]
      }
    },
    {
      id: `sample_2_${now}`,
      type: 'url',
      timestamp: new Date(now - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
      preview: 'http://secure-hdfc-kyc-update.xyz/login',
      fullInput: 'http://secure-hdfc-kyc-update.xyz/login',
      riskScore: 92,
      riskLevel: 'High Risk',
      scamType: 'Phishing & Brand Typosquatting',
      categories: ['suspicious_links', 'credential_theft'],
      warningSignsCount: 4,
      summary: 'Unsecured HTTP link impersonating HDFC Bank using suspicious .xyz domain.',
      assessment: {
        riskScore: 92,
        riskLevel: 'High Risk',
        summary: 'Severe typosquatting targeting financial banking credentials.',
        domainSecurity: {
          domain: 'secure-hdfc-kyc-update.xyz',
          isHttps: false,
          flags: ['Impersonates HDFC Bank', 'Suspicious .xyz TLD', 'Insecure HTTP']
        },
        recommendations: [
          'Do not enter credentials on non-official bank domains.',
          'Always verify URLs start with official bank domain.'
        ]
      }
    },
    {
      id: `sample_3_${now}`,
      type: 'message',
      timestamp: new Date(now - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
      preview: 'Electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Call 9876543210 immediately.',
      fullInput: 'Electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Call 9876543210 immediately.',
      riskScore: 85,
      riskLevel: 'High Risk',
      scamType: 'Utility Disconnection Urgency Trap',
      categories: ['urgency_pressure', 'threatening_language'],
      warningSignsCount: 2,
      summary: 'False authority coercion threatening immediate power disconnection.',
      assessment: {
        riskScore: 85,
        riskLevel: 'High Risk',
        summary: 'Coercive urgency threat designed to force panicky phone payment.',
        aiExplanation: {
          scamType: 'Utility Bill Disconnection Scam',
          reason: 'Utility companies send formal postal notices, not immediate WhatsApp or SMS threats with personal mobile numbers.'
        },
        personalizedSafetyRecommendations: [
          'Call your official electricity board helpdesk directly.',
          'Never transfer money to personal mobile numbers under cutoff threats.'
        ]
      }
    },
    {
      id: `sample_4_${now}`,
      type: 'screenshot',
      timestamp: new Date(now - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
      preview: 'Part-time Work from Home: Like YouTube videos & earn ₹3,500 daily. Join Telegram @easyincome',
      fullInput: 'Part-time Work from Home: Like YouTube videos & earn ₹3,500 daily. Join Telegram @easyincome',
      riskScore: 78,
      riskLevel: 'High Risk',
      scamType: 'Telegram Task & Investment Scam',
      categories: ['fake_jobs', 'telegram_task'],
      warningSignsCount: 3,
      summary: 'Task scam luring victim into Telegram investment prepaid scheme.',
      assessment: {
        riskScore: 78,
        riskLevel: 'High Risk',
        summary: 'Classic task completion bait leading to frozen funds demands.',
        recommendations: [
          'No legitimate firm pays thousands for clicking YouTube likes.',
          'Never deposit money to "unlock" work-from-home earnings.'
        ]
      }
    },
    {
      id: `sample_5_${now}`,
      type: 'email',
      timestamp: new Date(now - 1000 * 60 * 60 * 52).toISOString(), // 2 days ago
      preview: 'support@paypal-security-alert-center.net - Unauthorized transaction of $499.00',
      fullInput: 'support@paypal-security-alert-center.net - Unauthorized transaction of $499.00',
      riskScore: 48,
      riskLevel: 'Moderate Risk',
      scamType: 'Spoofed Brand Invoice Phishing',
      categories: ['sender_spoofing', 'payment_requests'],
      warningSignsCount: 2,
      summary: 'Fake PayPal invoice using spoofed third-party sender domain.',
      assessment: {
        riskScore: 48,
        riskLevel: 'Moderate Risk',
        summary: 'Deceptive invoice alert attempting to trigger immediate callback.',
        recommendations: [
          'Check your real PayPal account directly by logging into paypal.com.',
          'Do not call phone numbers listed in unexpected invoice emails.'
        ]
      }
    },
    {
      id: `sample_6_${now}`,
      type: 'message',
      timestamp: new Date(now - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      preview: 'Your package order #402-8821919 has been dispatched with BlueDart. Track in official app.',
      fullInput: 'Your package order #402-8821919 has been dispatched with BlueDart. Track in official app.',
      riskScore: 0,
      riskLevel: 'Low Risk',
      scamType: 'Legitimate Delivery Notification',
      categories: ['safe_communication'],
      warningSignsCount: 0,
      summary: 'Standard dispatch status alert with zero urgency or credential requests.',
      assessment: {
        riskScore: 0,
        riskLevel: 'Low Risk',
        summary: 'No deception markers or malicious links identified.',
        recommendations: [
          'Message appears safe and informative.',
          'Always use the official merchant mobile app to track parcels.'
        ]
      }
    }
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('scamlens_history_updated', { detail: samples }));
  }
  return samples;
}
