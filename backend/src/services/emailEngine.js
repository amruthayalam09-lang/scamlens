/**
/**
 * Email Pattern Engine for ScamLens
 * Analyzes email addresses and sender headers for:
 * - Free webmail brand impersonation (e.g. paypal-support@gmail.com)
 * - Lookalike domain typosquatting (e.g. support@amaz0n.com)
 * - Deceptive compound brand domains (e.g. sbi-kyc-alert.com)
 * - Subdomain spoofing (e.g. alert@paypal.com.security.xyz)
 * - High-abuse suspicious TLDs (.xyz, .top, .click, etc.)
 * - Disposable / temporary email providers (mailinator, yopmail, etc.)
 * Runs 100% locally with zero external network tracking or third-party data leakage.
 */

const KNOWN_BRANDS = [
  { name: 'paypal', official: ['paypal.com'] },
  { name: 'amazon', official: ['amazon.com', 'amazon.in', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.ca'] },
  { name: 'google', official: ['google.com', 'gmail.com'] },
  { name: 'microsoft', official: ['microsoft.com', 'live.com', 'office.com', 'outlook.com', 'azure.com'] },
  { name: 'apple', official: ['apple.com', 'icloud.com'] },
  { name: 'netflix', official: ['netflix.com'] },
  { name: 'facebook', official: ['facebook.com', 'fb.com', 'meta.com'] },
  { name: 'instagram', official: ['instagram.com'] },
  { name: 'whatsapp', official: ['whatsapp.com'] },
  { name: 'telegram', official: ['telegram.org'] },
  { name: 'sbi', official: ['onlinesbi.sbi', 'sbi.co.in', 'statebankofindia.com'] },
  { name: 'hdfc', official: ['hdfcbank.com'] },
  { name: 'icici', official: ['icicibank.com'] },
  { name: 'axisbank', official: ['axisbank.com'] },
  { name: 'paytm', official: ['paytm.com'] },
  { name: 'phonepe', official: ['phonepe.com'] },
  { name: 'fedex', official: ['fedex.com'] },
  { name: 'dhl', official: ['dhl.com'] },
  { name: 'ups', official: ['ups.com'] },
  { name: 'usps', official: ['usps.com'] },
  { name: 'binance', official: ['binance.com'] },
  { name: 'coinbase', official: ['coinbase.com'] }
];

const FREE_WEBMAIL_PROVIDERS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'rediffmail.com', 'protonmail.com', 'proton.me', 'aol.com', 'zoho.com',
  'icloud.com', 'me.com', 'mac.com', 'mail.com', 'gmx.com', 'gmx.net',
  'fastmail.com', 'tutanota.com', 'tuta.io'
]);

const DISPOSABLE_EMAIL_PROVIDERS = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
  'guerrillamail.com', 'throwawaymail.com', 'yopmail.com', 'sharklasers.com',
  'dispostable.com', 'getairmail.com', 'trashmail.com', 'fakeinbox.com',
  'nada.ltd', 'mohmal.com', 'generator.email', 'crazymailing.com'
]);

const SUSPICIOUS_TLDS = new Set([
  'xyz', 'top', 'click', 'buzz', 'club', 'tk', 'ml', 'ga', 'cf', 'gq',
  'work', 'link', 'rest', 'fit', 'surf', 'cam', 'quest', 'agency', 'monster',
  'stream', 'party', 'live', 'support', 'online', 'site'
]);

const DECEPTIVE_KEYWORDS = [
  'support', 'service', 'security', 'alert', 'notice', 'verify', 'verification',
  'billing', 'invoice', 'helpdesk', 'care', 'customer', 'official', 'refund',
  'account', 'banking', 'recovery', 'update', 'portal', 'dept', 'officer'
];

function normalizeLeet(str) {
  return str
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/vv/g, 'w')
    .replace(/rn/g, 'm');
}

const TWO_PART_TLDS = new Set([
  'co.in', 'net.in', 'org.in', 'gen.in', 'ind.in', 'gov.in', 'edu.in', 'res.in', 'ac.in',
  'co.uk', 'org.uk', 'me.uk', 'ltd.uk', 'plc.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
  'com.br', 'com.mx', 'com.sg', 'co.jp', 'com.ph', 'co.nz', 'co.za'
]);

function parseDomainParts(hostname) {
  const parts = hostname.toLowerCase().split('.');
  if (parts.length < 2) return { mainDomain: hostname, subdomains: '', tld: '' };

  const lastTwo = parts.slice(-2).join('.');
  let mainDomain = '';
  let subdomains = '';
  let tld = '';

  if (parts.length >= 3 && TWO_PART_TLDS.has(lastTwo)) {
    tld = lastTwo;
    mainDomain = parts[parts.length - 3] + '.' + tld;
    subdomains = parts.slice(0, parts.length - 3).join('.');
  } else {
    tld = parts[parts.length - 1];
    mainDomain = parts.slice(-2).join('.');
    subdomains = parts.slice(0, -2).join('.');
  }

  return { mainDomain, subdomains, tld };
}

/**
 * Extracts and cleans email and display name from raw input.
 * Supports "Name <user@domain.com>" and bare "user@domain.com".
 */
function parseEmailString(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    throw new Error('Please enter an email address to analyze.');
  }

  const trimmed = rawInput.trim();
  let displayName = '';
  let email = '';

  const headerMatch = trimmed.match(/^(?:["']?([^"']+)["']?\s*)?<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>$/);
  if (headerMatch) {
    displayName = (headerMatch[1] || '').trim();
    email = headerMatch[2].toLowerCase();
  } else {
    const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (!emailMatch) {
      throw new Error('Invalid email format. Please provide a valid address like support@company.com or "Name" <name@domain.com>.');
    }
    email = emailMatch[0].toLowerCase();
    displayName = trimmed.replace(emailMatch[0], '').replace(/[<>"']/g, '').trim();
  }

  const [localPart, domain] = email.split('@');
  return {
    rawInput: trimmed,
    displayName,
    email,
    localPart,
    domain: domain.toLowerCase()
  };
}

/**
 * Analyzes an email address for deception patterns.
 * @param {string} rawInput 
 * @returns {Object} Structured assessment
 */
function analyzeEmail(rawInput) {
  const parsed = parseEmailString(rawInput);
  const { email, displayName, localPart, domain } = parsed;

  const warnings = [];
  let accumulatedWeight = 0;

  const { mainDomain, subdomains, tld } = parseDomainParts(domain);
  const domainNameOnly = mainDomain.split('.')[0];
  const isFreeProvider = FREE_WEBMAIL_PROVIDERS.has(domain);
  const isDisposable = DISPOSABLE_EMAIL_PROVIDERS.has(domain);

  // 1. Free Webmail Brand Impersonation (e.g. paypal-security@gmail.com or SBI Helpline <officer@yahoo.com>)
  if (isFreeProvider) {
    const combinedToCheck = `${displayName} ${localPart}`.toLowerCase();
    for (const brand of KNOWN_BRANDS) {
      // Exclude legitimate Google addresses using gmail.com
      if (brand.name === 'google' && domain.includes('gmail.com')) continue;

      if (combinedToCheck.includes(brand.name)) {
        warnings.push({
          id: `email-free-provider-brand-${brand.name}`,
          category: 'free_webmail_impersonation',
          categoryLabel: 'Free Webmail Impersonating Official Brand',
          severity: 'high',
          clue: `${email} (claiming to be ${brand.name.toUpperCase()})`,
          explanation: `The sender references "${brand.name.toUpperCase()}", but is using a free public webmail address (@${domain}). Genuine institutions always send communications from their verified official corporate domain, never from free public mailboxes.`,
          recommendation: `Disregard requests from this address. Real ${brand.name} representatives never email customers from @${domain}.`,
          weight: 45
        });
        accumulatedWeight += 45;
        break;
      }
    }

    // Generic security keyword in localpart on free provider (e.g. kyc-update-dept@gmail.com)
    const hasDeceptiveKeyword = DECEPTIVE_KEYWORDS.some(kw => localPart.includes(kw));
    if (hasDeceptiveKeyword && !warnings.some(w => w.category === 'free_webmail_impersonation')) {
      warnings.push({
        id: 'email-free-provider-deceptive-keyword',
        category: 'free_webmail_deceptive',
        categoryLabel: 'Official-Sounding Free Email Address',
        severity: 'high',
        clue: `${localPart}@${domain}`,
        explanation: `The email uses corporate keywords like "${localPart}" on a free personal webmail service (@${domain}). Scammers create these free accounts to pretend they are official corporate desks.`,
        recommendation: 'Official organizations do not manage security, billing, or accounts via personal webmail.',
        weight: 35
      });
      accumulatedWeight += 35;
    }
  }

  // 2. Disposable / Temporary Email Check
  if (isDisposable) {
    warnings.push({
      id: 'email-disposable-provider',
      category: 'disposable_email',
      categoryLabel: 'Disposable / Throwaway Email Address',
      severity: 'high',
      clue: `@${domain}`,
      explanation: `This address uses a temporary, anonymous inbox provider (${domain}) that requires no identity verification and expires within hours. Fraudsters use disposable emails to conduct attacks without leaving an audit trail.`,
      recommendation: 'Never reply to, send funds to, or accept job/internship contracts from throwaway email addresses.',
      weight: 40
    });
    accumulatedWeight += 40;
  }

  // 3. Brand Typosquatting in Email Domain (e.g. support@amaz0n.com or info@paypa1.com)
  for (const brand of KNOWN_BRANDS) {
    const isOfficialDomain = brand.official.some(off => domain === off || domain.endsWith('.' + off));

    if (!isOfficialDomain) {
      // 3a. Subdomain brand spoofing (e.g. security@paypal.com.customer-support.xyz)
      if (subdomains.includes(brand.name)) {
        warnings.push({
          id: `email-subdomain-spoof-${brand.name}`,
          category: 'subdomain_spoofing',
          categoryLabel: 'Brand Impersonation in Email Subdomain',
          severity: 'high',
          clue: `@${domain}`,
          explanation: `The brand "${brand.name.toUpperCase()}" is placed in the subdomain, but the actual sending server domain is "${mainDomain}". This trick deceives users into believing the email originated from the real company.`,
          recommendation: `Notice the true domain suffix "${mainDomain}". This is NOT an official ${brand.name} email address.`,
          weight: 40
        });
        accumulatedWeight += 40;
        break;
      }

      // 3b. Deceptive compound domain (e.g. hr@sbi-kyc-update.com)
      const hasDeceptiveKeyword = DECEPTIVE_KEYWORDS.some(kw => domainNameOnly.includes(kw));
      const hasBrandInDomain = domainNameOnly.includes(brand.name);
      if (hasBrandInDomain && hasDeceptiveKeyword) {
        warnings.push({
          id: `email-brand-deceptive-${brand.name}`,
          category: 'brand_spoofing',
          categoryLabel: 'Brand Spoofing with Fake Domain',
          severity: 'high',
          clue: `@${mainDomain}`,
          explanation: `The domain blends "${brand.name.toUpperCase()}" with security keywords, but it is not operated by ${brand.name.toUpperCase()}. Organizations send emails only from their primary registered domain.`,
          recommendation: `Check the sender's exact domain. Authentic ${brand.name} communications only come from verified corporate addresses like ${brand.official[0]}.`,
          weight: 40
        });
        accumulatedWeight += 40;
        break;
      }

      // 3c. Leetspeak typosquatting (e.g. netf1ix, micros0ft)
      const normalizedDomain = normalizeLeet(domainNameOnly);
      if (normalizedDomain.includes(brand.name) && domainNameOnly !== brand.name) {
        warnings.push({
          id: `email-typosquatting-${brand.name}`,
          category: 'typosquatting',
          categoryLabel: 'Look-Alike Email Typosquatting',
          severity: 'high',
          clue: `@${mainDomain}`,
          explanation: `The sender domain "${mainDomain}" deliberately mimics "${brand.name.toUpperCase()}" using look-alike characters to trick recipients into believing it is genuine.`,
          recommendation: `Inspect every letter of the domain name carefully. Genuine companies never alter their core spelling with number replacements.`,
          weight: 40
        });
        accumulatedWeight += 40;
        break;
      }
    }
  }

  // 4. High-Abuse Suspicious TLD in Email Domain
  if (SUSPICIOUS_TLDS.has(tld)) {
    warnings.push({
      id: `email-suspicious-tld-${tld}`,
      category: 'suspicious_tld',
      categoryLabel: 'High-Abuse Top-Level Domain in Email',
      severity: 'medium',
      clue: `.${tld}`,
      explanation: `Email domains ending in .${tld} are frequently associated with disposable spam and phishing infrastructure due to low registration costs and minimal oversight.`,
      recommendation: `Be especially vigilant with unsolicited emails coming from .${tld} domains.`,
      weight: 20
    });
    accumulatedWeight += 20;
  }

  // 5. Excessive Hyphens in Email Domain
  const hyphenCount = (domainNameOnly.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    warnings.push({
      id: 'email-excessive-hyphens',
      category: 'domain_structure',
      categoryLabel: 'Excessive Hyphens in Sender Domain',
      severity: 'medium',
      clue: `${hyphenCount} hyphens in "${mainDomain}"`,
      explanation: 'Domains with multiple hyphens (e.g. "secure-banking-alert-support") are frequently created by scammers attempting to simulate valid corporate services.',
      recommendation: 'Check against the company\'s official website to verify whether they operate that hyphenated domain.',
      weight: 15
    });
    accumulatedWeight += 15;
  }

  // 6. Suspicious Random Local Part (automated campaign bot)
  if (/^[a-z0-9]{12,}$/i.test(localPart) || /^(?:noreply|support|alert)\d{6,}$/i.test(localPart)) {
    warnings.push({
      id: 'email-random-mailbox',
      category: 'automated_campaign',
      categoryLabel: 'Automated Bot Mailbox Pattern',
      severity: 'medium',
      clue: localPart,
      explanation: 'The mailbox prefix consists of a machine-generated string or high-digit sequence commonly used by automated mass-phishing bots.',
      recommendation: 'Legitimate business contacts use clear, human-readable or standard departmental email addresses.',
      weight: 15
    });
    accumulatedWeight += 15;
  }

  // Calculate normalized score
  const rawScore = Math.min(100, Math.round(accumulatedWeight));

  let riskLevel = 'Low Risk';
  let badgeColor = 'green';
  if (rawScore >= 55 || warnings.some(w => w.severity === 'high')) {
    riskLevel = 'High Risk';
    badgeColor = 'red';
  } else if (rawScore >= 25) {
    riskLevel = 'Moderate Risk';
    badgeColor = 'amber';
  } else if (rawScore > 0) {
    riskLevel = 'Low Caution';
    badgeColor = 'blue';
  }

  let summary = '';
  if (warnings.length > 0) {
    summary = `Identified ${warnings.length} warning sign${warnings.length > 1 ? 's' : ''} in the sender email address (${warnings.map(w => w.categoryLabel).slice(0, 3).join(', ')}${warnings.length > 3 ? '...' : ''}).`;
  } else {
    summary = 'No obvious email spoofing, brand impersonation, or disposable mailbox patterns were detected in this email address. However, always verify unsolicited senders before clicking attachments or sharing sensitive information.';
  }

  const safetyRecommendations = [];
  warnings.forEach(w => {
    if (w.recommendation && !safetyRecommendations.includes(w.recommendation)) {
      safetyRecommendations.push(w.recommendation);
    }
  });

  if (safetyRecommendations.length === 0) {
    safetyRecommendations.push('Check the email header details to confirm the sender domain matches the organization they claim to represent.');
    safetyRecommendations.push('Never download unsolicited attachments (.zip, .pdf.exe, .apk) sent via email.');
    safetyRecommendations.push('When in doubt, reply through official customer support portals found via web search rather than hitting "Reply".');
  }

  return {
    email,
    displayName: displayName || '(None)',
    localPart,
    domain,
    mainDomain,
    subdomains: subdomains || '(None)',
    isFreeProvider,
    isDisposable,
    score: rawScore,
    riskScore: rawScore,
    riskLevel,
    badgeColor,
    summary,
    totalWarnings: warnings.length,
    warnings,
    ruleFindings: {
      score: rawScore,
      riskLevel,
      totalMatches: warnings.length,
      categoriesDetected: Array.from(new Set(warnings.map(w => w.category))),
      matches: warnings.map(w => ({
        id: w.id,
        category: w.category,
        categoryLabel: w.categoryLabel,
        severity: w.severity,
        phrase: w.clue,
        explanation: w.explanation,
        recommendation: w.recommendation,
        weight: w.weight
      }))
    },
    safetyRecommendations,
    personalizedSafetyRecommendations: safetyRecommendations,
    disclaimer: 'Notice: ScamLens Email analysis examines address syntax, brand impersonation vectors, free webmail abuse, and domain reputation indicators. This assessment is educational and advisory; always exercise caution with unexpected messages.'
  };
}

module.exports = {
  analyzeEmail,
  parseEmailString,
  FREE_WEBMAIL_PROVIDERS,
  DISPOSABLE_EMAIL_PROVIDERS
};

