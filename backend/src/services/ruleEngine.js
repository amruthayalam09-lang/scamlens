/**
 * Rule Engine for ScamLens
 * Detects known scam patterns, keywords, psychological manipulation, and dangerous requests.
 * Extracts exact phrase coordinates for UI highlighting and generates plain English explanations.
 */

const { analyzeUrl } = require('./urlEngine');
const { analyzeEmail } = require('./emailEngine');

const PATTERN_DEFINITIONS = [
  // 1. Credentials & OTP Requests (Highest Severity)
  {
    category: 'credentials_otp',
    categoryLabel: 'Credential & OTP Harvesting',
    severity: 'high',
    weight: 40,
    rules: [
      {
        regex: /(?:share|send|provide|give|forward|enter)\s+(?:your\s+)?(?:otp|one[-\s]?time[-\s]?password|verification\s+code|6[-\s]?digit\s+code|security\s+code|pin|cvv|netbanking\s+password|login\s+password)/i,
        explanation: 'Legitimate banks and services never ask you to disclose your OTP, PIN, or verification code to anyone.',
        recommendation: 'Never share OTPs, PINs, or CVV numbers with anyone, even if they claim to be bank officials.'
      },
      {
        regex: /(?:install|download)\s+(?:anydesk|teamviewer|quicksupport|rustdesk|screen\s+share|airdroid)/i,
        explanation: 'Scammers frequently direct victims to install remote desktop applications so they can view screens and drain bank accounts.',
        recommendation: 'Do not install remote control or screen sharing apps at the instruction of an unknown sender.'
      },
      {
        regex: /(?:update|verify|re-activate)\s+(?:your\s+)?(?:kyc|pan\s+card|aadhaar|bank\s+account|debit\s+card)\s+(?:immediately|now|urgent)/i,
        explanation: 'Phishing messages commonly invent fake KYC or account expiration emergencies to steal banking credentials.',
        recommendation: 'Visit your official bank branch or app directly. Never click unsolicited KYC links.'
      }
    ]
  },

  // 2. Suspicious Payment Requests
  {
    category: 'payment_requests',
    categoryLabel: 'Suspicious Payment or Advance Fee',
    severity: 'high',
    weight: 35,
    rules: [
      {
        regex: /(?:pay|send|transfer|deposit)\s+(?:[$₹]\s?[\d,]+|\d+\s?(?:inr|rs|usd|rupees)?)\s+(?:(?:immediately|now|urgently)\s+)?to\s+confirm\s+(?:your\s+)?(?:position|seat|slot|internship|job|offer|admission|selection)/i,
        explanation: 'Demanding upfront money (such as fees or deposits) to confirm an internship or job position is a clear indicator of recruitment fraud. Legitimate employers pay you; they never charge you to work.',
        recommendation: 'Never pay money to secure an internship or job offer. Legitimate employers do not charge candidate confirmation fees.'
      },
      {
        regex: /(?:pay|send|transfer|deposit)\s+(?:an?\s+)?(?:(?:advance|registration|processing|confirmation|training|equipment|refundable|security|customs)\s+)*(?:fee|deposit|amount|charge|money)/i,
        explanation: 'Asking for advance fees, registration deposits, or processing charges before delivering services, jobs, or prizes is a hallmark of advance-fee fraud.',
        recommendation: 'Genuine companies do not ask you to pay money to receive winnings, loans, job offers, or parcels.'
      },
      {
        regex: /(?:pay|send|transfer)\s+(?:[$₹]\s?[\d,]+|\d+\s?(?:inr|rs|usd|rupees)?)\s+(?:immediately|urgently|right\s+now|today)/i,
        explanation: 'Demanding immediate monetary transfer is a primary indicator of financial deception designed to prevent verification.',
        recommendation: 'Do not transfer money to unknown parties under urgent demands or high pressure.'
      },
      {
        regex: /(?:buy|pay\s+with|purchase)\s+(?:google\s+play|apple|amazon|steam|itunes)\s+gift\s*cards?/i,
        explanation: 'Gift cards are untraceable and cannot be reversed. Demanding payment via gift cards is an unmistakable indicator of fraud.',
        recommendation: 'No government agency, utility company, or real business will ever request payment through gift cards.'
      },
      {
        regex: /(?:transfer|send|deposit)\s+(?:usdt|crypto|bitcoin|eth|doge|wallet\s+address)/i,
        explanation: 'Cryptocurrency transfers are irreversible and often used by fraudulent platforms to prevent funds from being recovered.',
        recommendation: 'Avoid transferring cryptocurrency to private wallets or unverified investment schemes.'
      },
      {
        regex: /(?:won|winner\s+of|selected\s+for)\s+(?:lottery|jackpot|lucky\s+draw|kbc|cash\s+prize|reward\s+of\s+[$₹]?\d+)/i,
        explanation: 'You cannot win a lottery or draw that you never entered. These messages lure victims into paying fake release taxes.',
        recommendation: 'Disregard unexpected lottery or prize notifications; they are always fraudulent.'
      }
    ]
  },

  // 3. Investment Promises
  {
    category: 'investment_promises',
    categoryLabel: 'Unrealistic Investment Promises',
    severity: 'high',
    weight: 35,
    rules: [
      {
        regex: /(?:guaranteed|assured|risk[-\s]?free)\s+(?:returns?|profit|income|payout|yield)/i,
        explanation: 'All genuine financial investments carry market risk. Anyone promising guaranteed or risk-free returns is misleading you.',
        recommendation: 'Be skeptical of any investment claiming risk-free or guaranteed high profits.'
      },
      {
        regex: /(?:double|triple|10x)\s+(?:your\s+money|investment|capital)\s+(?:in|within)\s+(?:\d+\s+(?:hours?|days?|weeks?|minutes?)|short\s+time)/i,
        explanation: 'Promises of doubling money in days or hours are hallmarks of Ponzi and pyramid schemes.',
        recommendation: 'Never deposit funds into platforms promising unrealistic quick returns.'
      },
      {
        regex: /(?:trading\s+bot|vip\s+signals?|insider\s+tips?|forex\s+algo)\s+(?:with\s+9[0-9]%|100%|daily\s+profit)/i,
        explanation: 'Fake trading bots and VIP signal groups on Telegram entice users with doctored screenshots of fake profits.',
        recommendation: 'Avoid unauthorized trading advisors and Telegram channel investment schemes.'
      }
    ]
  },

  // 4. Fake Jobs & Task Scams
  {
    category: 'job_offers',
    categoryLabel: 'Suspicious Job or Task Scam',
    severity: 'medium',
    weight: 30,
    rules: [
      {
        regex: /(?:congratulations!?\s+)?(?:you\s+have\s+been\s+)?(?:selected|shortlisted|chosen|hired)\s+for\s+(?:an?\s+)?(?:[a-zA-Z\-]+\s+)*(?:internship|job|position|role)/i,
        explanation: 'Unsolicited claims that you have been selected for an internship or job—especially without a prior formal interview or application—are common lures for recruitment fraud.',
        recommendation: 'Verify job offers directly with the hiring company through their verified corporate careers portal or official HR.'
      },
      {
        regex: /(?:no\s+interview(?:\s+needed|\s+required)?|without\s+(?:an?\s+)?interview|immediate\s+selection|hired\s+without\s+test|direct\s+selection|offer\s+letter\s+ready)/i,
        explanation: 'Legitimate employers evaluate candidates through proper screening and interviews before making offers.',
        recommendation: 'Be cautious of direct hiring without any formal interview or background verification.'
      },
      {
        regex: /(?:like|subscribe)\s+(?:youtube\s+videos?|instagram\s+posts?|tiktok)\s+(?:and|to)\s+earn/i,
        explanation: 'This is the signature pattern of task-based prepaid scams where small initial payouts lead to requests for large deposits.',
        recommendation: 'Do not participate in paid video-liking or Google Review rating tasks.'
      },
      {
        regex: /(?:earn|daily\s+income|daily\s+stipend|salary\s+of|stipend\s+of)\s+(?:[$₹]\s?[\d,]+|\d{3,6}\s?(?:inr|usd|per\s+month|per\s+day))/i,
        explanation: 'Extravagant earnings for entry-level or remote work without qualification is a classic recruitment trap.',
        recommendation: 'Verify job openings directly on corporate career portals, not via unsolicited messaging apps.'
      },
      {
        regex: /(?:contact|message|chat\s+with)\s+(?:our\s+)?(?:hr|manager|receptionist|coordinator)\s+(?:on|via)\s+(?:telegram|whatsapp)/i,
        explanation: 'Scammers shift communications to WhatsApp or Telegram to bypass company oversight and email spam filters.',
        recommendation: 'Insist on official corporate email communication from authenticated company domains.'
      }
    ]
  },

  // 5. Urgency & Pressure Tactics
  {
    category: 'urgency',
    categoryLabel: 'Urgency & Pressure Tactics',
    severity: 'medium',
    weight: 25,
    rules: [
      {
        regex: /(?:within|in)\s+\d{1,3}\s+(?:minutes?|mins?|hours?)(?:\s+to\s+(?:receive|claim|confirm|verify|pay|act))?/i,
        explanation: 'Strict minute-level deadlines (such as "within 30 minutes") are panic-inducing psychological tactics to force rushed decisions.',
        recommendation: 'Never rush into financial transactions due to ticking timers or short deadlines.'
      },
      {
        regex: /(?:bank\s+)?account\s+(?:will\s+be\s+)?(?:blocked|suspended|terminated|closed|frozen|disabled)/i,
        explanation: 'Threats that your bank account will be blocked or closed create panic and anxiety so victims act impulsively without verifying details.',
        recommendation: 'Do not rush. Independently verify your account status through your official banking app or branch.'
      },
      {
        regex: /(?:(?:immediately|urgently|now)\s+)?to\s+avoid\s+(?:suspension|blocking|closure|penalty|deactivation|disconnection)/i,
        explanation: 'Demanding immediate action to avoid suspension is a high-pressure psychological tactic designed to prevent calm thinking.',
        recommendation: 'Pause and consult trusted support. Legitimate organizations provide formal notices, not sudden chat ultimatums.'
      },
      {
        regex: /(?:limited\s+(?:seats?|slots?|openings?)|few\s+(?:seats?|slots?)\s+left|only\s+\d+\s+seats?\s+left|valid\s+(?:today|for\s+\d+\s+hours?)\s+only)/i,
        explanation: 'Artificial scarcity (such as "limited seats available") is used to induce fear of missing out and rush victims into payment.',
        recommendation: 'Do not let rush tactics push you into making fast payments without verification.'
      },
      {
        regex: /(?:urgent\s+action\s+required|immediate\s+attention|act\s+now|last\s+chance|final\s+notice)/i,
        explanation: 'Scammers create synthetic panic to compel immediate action before reason sets in.',
        recommendation: 'High-pressure deadlines are psychological tricks. Pause and consult a trusted friend or official support.'
      },
      {
        regex: /(?:electricity|power|gas|water)\s+(?:will\s+be\s+)?disconnected\s+(?:tonight|today|by\s+\d{1,2}(?::\d{2})?\s?(?:pm|am))/i,
        explanation: 'Utility disconnection threats are widespread scam scripts designed to frighten householders into urgent payments.',
        recommendation: 'Utility providers provide written notices on monthly bills, not sudden same-day disconnection SMS messages.'
      },
      {
        regex: /(?:legal\s+notice|arrest\s+warrant|police\s+case|court\s+order|customs\s+department)\s+(?:issued\s+against\s+you|in\s+your\s+name)/i,
        explanation: 'Impersonating law enforcement or customs officials using threatening language is extortion fraud.',
        recommendation: 'Law enforcement agencies never demand financial settlements or money transfers via chat apps.'
      }
    ]
  },

  // 6. Suspicious Links & Shorteners
  {
    category: 'suspicious_links',
    categoryLabel: 'Obfuscated or Suspicious Link',
    severity: 'medium',
    weight: 20,
    rules: [
      {
        regex: /(?:https?:\/\/)?(?:bit\.ly|tinyurl\.com|rb\.gy|is\.gd|cutt\.ly|t\.co|shorturl\.at)\/[a-zA-Z0-9_\-]+/i,
        explanation: 'URL shorteners conceal the true destination website, often disguising phishing sites or malicious file downloads.',
        recommendation: 'Do not click shortened URLs from unknown senders without expanding the destination URL first.'
      },
      {
        regex: /(?:https?:\/\/)?(?:t\.me|telegram\.me|wa\.me)\/[a-zA-Z0-9_\+\-]+/i,
        explanation: 'Direct links leading into anonymous messaging channels are frequently used to isolate victims away from public scrutiny.',
        recommendation: 'Exercise extreme caution before joining unfamiliar Telegram channels or private WhatsApp groups.'
      },
      {
        regex: /(?:download\s+apk|install\s+\.apk|apk\s+file)/i,
        explanation: 'Sideloading Android APKs outside of official app stores can install spyware, SMS interceptors, and banking Trojans.',
        recommendation: 'Never download or install APK files received through SMS, WhatsApp, or unsolicited emails.'
      }
    ]
  }
];

/**
 * Analyzes message text using rule patterns.
 * @param {string} text 
 * @returns {Object} Structured analysis with matches, score, and level
 */
function runRuleBasedAnalysis(text) {
  if (!text || typeof text !== 'string') {
    return {
      score: 0,
      riskLevel: 'Safe',
      matches: [],
      categoriesDetected: [],
      summary: 'No text provided for analysis.'
    };
  }

  const rawMatches = [];
  const matchedCategories = new Set();
  let accumulatedWeight = 0;

  for (const group of PATTERN_DEFINITIONS) {
    for (const rule of group.rules) {
      // Find all matches for regex
      const regex = new RegExp(rule.regex.source, rule.regex.flags.includes('g') ? rule.regex.flags : rule.regex.flags + 'g');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const phrase = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + phrase.length;

        // Check for duplicate or heavily overlapping matches
        const isDuplicate = rawMatches.some(
          existing => Math.abs(existing.startIndex - startIndex) < 3 && existing.category === group.category
        );

        if (!isDuplicate) {
          rawMatches.push({
            id: `rule-${group.category}-${startIndex}`,
            category: group.category,
            categoryLabel: group.categoryLabel,
            severity: group.severity,
            phrase: phrase,
            startIndex: startIndex,
            endIndex: endIndex,
            explanation: rule.explanation,
            recommendation: rule.recommendation,
            weight: group.weight
          });
          matchedCategories.add(group.category);
          accumulatedWeight += group.weight;
        }
      }
    }
  }

  // 7. Embedded Links / URLs Deep Scanning
  const detectedUrls = [];
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+[^\s<>"'{}|\\^`.,;:?!)]/gi;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    const rawFoundUrl = urlMatch[0];
    const startIndex = urlMatch.index;
    const endIndex = startIndex + rawFoundUrl.length;

    try {
      const urlAssessment = analyzeUrl(rawFoundUrl);
      detectedUrls.push(urlAssessment);

      // Add each specific warning discovered by the URL engine
      if (urlAssessment.warnings && urlAssessment.warnings.length > 0) {
        urlAssessment.warnings.forEach((w) => {
          rawMatches.push({
            id: `embedded-url-${w.id}-${startIndex}`,
            category: `url_${w.category}`,
            categoryLabel: `🔗 ${w.categoryLabel}`,
            severity: w.severity,
            phrase: rawFoundUrl,
            startIndex: startIndex,
            endIndex: endIndex,
            explanation: w.explanation,
            recommendation: w.recommendation,
            weight: w.weight
          });
          matchedCategories.add(`url_${w.category}`);
          accumulatedWeight += w.weight;
        });
      }
    } catch {
      // If parsing fails, ignore non-URL matches
    }
  }

  // 8. Embedded Email Addresses Deep Scanning
  const detectedEmails = [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  let emailMatch;
  while ((emailMatch = emailRegex.exec(text)) !== null) {
    const rawFoundEmail = emailMatch[0];
    const startIndex = emailMatch.index;
    const endIndex = startIndex + rawFoundEmail.length;

    try {
      const emailAssessment = analyzeEmail(rawFoundEmail);
      detectedEmails.push(emailAssessment);

      // Add each specific warning discovered by the Email engine
      if (emailAssessment.warnings && emailAssessment.warnings.length > 0) {
        emailAssessment.warnings.forEach((w) => {
          rawMatches.push({
            id: `embedded-email-${w.id}-${startIndex}`,
            category: `email_${w.category}`,
            categoryLabel: `✉️ ${w.categoryLabel}`,
            severity: w.severity,
            phrase: rawFoundEmail,
            startIndex: startIndex,
            endIndex: endIndex,
            explanation: w.explanation,
            recommendation: w.recommendation,
            weight: w.weight
          });
          matchedCategories.add(`email_${w.category}`);
          accumulatedWeight += w.weight;
        });
      }
    } catch {
      // If parsing fails, ignore non-email matches
    }
  }

  // Sort matches by start position in text
  rawMatches.sort((a, b) => a.startIndex - b.startIndex);

  // Compute normalized score between 0 and 100
  // Diversity of categories increases risk
  const categoryCount = matchedCategories.size;
  let scoreMultiplier = 1;
  if (categoryCount >= 3) scoreMultiplier = 1.25;
  else if (categoryCount === 2) scoreMultiplier = 1.1;

  const rawScore = Math.min(100, Math.round(accumulatedWeight * scoreMultiplier));

  let riskLevel = 'Low Risk';
  let badgeColor = 'green';
  if (rawScore >= 60 || rawMatches.some(m => m.severity === 'high')) {
    riskLevel = 'High Risk';
    badgeColor = 'red';
  } else if (rawScore >= 25) {
    riskLevel = 'Moderate Risk';
    badgeColor = 'amber';
  } else if (rawScore > 0) {
    riskLevel = 'Low Caution';
    badgeColor = 'blue';
  }

  return {
    score: rawScore,
    riskLevel: riskLevel,
    badgeColor: badgeColor,
    matches: rawMatches,
    categoriesDetected: Array.from(matchedCategories),
    totalMatches: rawMatches.length,
    detectedUrls,
    detectedEmails,
    analyzedAt: new Date().toISOString()
  };
}

module.exports = {
  runRuleBasedAnalysis,
  PATTERN_DEFINITIONS
};
