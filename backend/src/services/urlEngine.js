/**
 * URL Pattern Engine for ScamLens
 * Analyzes web addresses for structural deception, typosquatting, brand impersonation,
 * suspicious subdomains, URL shorteners, raw IP hosts, high-abuse TLDs, and protocol security.
 * Runs 100% locally with zero external network tracking or third-party data leakage.
 */

const KNOWN_BRANDS = [
  { name: 'paypal', official: ['paypal.com'] },
  { name: 'amazon', official: ['amazon.com', 'amazon.in', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.ca', 'amazon.es', 'amazon.it', 'amazon.co.jp'] },
  { name: 'google', official: ['google.com', 'google.co.in', 'google.co.uk', 'google.de'] },
  { name: 'microsoft', official: ['microsoft.com', 'live.com', 'office.com', 'outlook.com', 'azure.com'] },
  { name: 'apple', official: ['apple.com', 'icloud.com'] },
  { name: 'netflix', official: ['netflix.com'] },
  { name: 'facebook', official: ['facebook.com', 'fb.com'] },
  { name: 'instagram', official: ['instagram.com'] },
  { name: 'whatsapp', official: ['whatsapp.com'] },
  { name: 'telegram', official: ['telegram.org', 't.me'] },
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
  { name: 'indiapost', official: ['indiapost.gov.in'] },
  { name: 'binance', official: ['binance.com'] },
  { name: 'coinbase', official: ['coinbase.com'] }
];

const KNOWN_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'rb.gy', 'is.gd', 'cutt.ly', 'shorturl.at',
  'ow.ly', 'buff.ly', 'goo.gl', 'tiny.cc', 'bc.vc', 'adf.ly', 'bitly.com', 'qr.ae'
]);

const SUSPICIOUS_TLDS = new Set([
  'xyz', 'top', 'click', 'buzz', 'club', 'tk', 'ml', 'ga', 'cf', 'gq',
  'work', 'link', 'rest', 'fit', 'surf', 'cam', 'quest', 'agency', 'monster',
  'stream', 'party', 'live', 'support'
]);

const DECEPTIVE_KEYWORDS = [
  'login', 'signin', 'sign-in', 'log-in', 'secure', 'security', 'verify', 'verification',
  'update', 'kyc', 'account', 'banking', 'support', 'billing', 'confirm', 'confirmation',
  'recover', 'wallet', 'password', 'helpdesk', 'portal', 'claim', 'refund', 'authenticate'
];

// Common leetspeak character substitutions
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

// Two-part Country Code Second-Level Domains (ccSLDs)
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
 * Analyzes a URL string for deception patterns.
 * @param {string} rawUrl 
 * @returns {Object} Structured assessment
 */
function analyzeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('Please provide a URL to analyze.');
  }

  let input = rawUrl.trim();
  let hadNoProtocol = false;

  // Prepend http:// for parsing if user pasted just a domain or path
  if (!/^https?:\/\//i.test(input)) {
    input = 'http://' + input;
    hadNoProtocol = true;
  }

  let parsed;
  try {
    parsed = new URL(input);
  } catch (err) {
    throw new Error('Invalid URL format. Please enter a valid web address (e.g. https://example.com).');
  }

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.toLowerCase();
  const pathname = parsed.pathname;

  if (!hostname || hostname.length === 0) {
    throw new Error('Invalid URL format: could not extract a valid host name.');
  }

  const warnings = [];
  let accumulatedWeight = 0;

  // 1. Raw Numerical IP Address Check
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (isIpv4) {
    warnings.push({
      id: 'url-raw-ip',
      category: 'ip_hostname',
      categoryLabel: 'Numeric IP Address as Hostname',
      severity: 'high',
      clue: hostname,
      explanation: 'Legitimate public services use registered brand domain names with verifiable ownership. Direct numerical IP addresses are frequently used in phishing attacks to bypass domain registration oversight.',
      recommendation: 'Do not access login, banking, or payment portals hosted on raw numerical IP addresses.',
      weight: 40
    });
    accumulatedWeight += 40;
  }

  // 2. "@" Symbol in URL Check
  if (rawUrl.includes('@')) {
    warnings.push({
      id: 'url-at-symbol',
      category: 'authority_obfuscation',
      categoryLabel: 'URL Credentials / Redirection Trick',
      severity: 'high',
      clue: '@ symbol in URL',
      explanation: 'The "@" character in a URL is an evasion technique. Web browsers treat text before the "@" as user credentials and silently navigate to the destination following it, deceiving users about the real target website.',
      recommendation: 'Avoid opening links containing the "@" character.',
      weight: 35
    });
    accumulatedWeight += 35;
  }

  const { mainDomain, subdomains, tld } = parseDomainParts(hostname);
  const domainNameOnly = mainDomain.split('.')[0];

  // 3. URL Shortener Check
  if (KNOWN_SHORTENERS.has(hostname) || KNOWN_SHORTENERS.has(mainDomain)) {
    warnings.push({
      id: 'url-shortener',
      category: 'url_shortener',
      categoryLabel: 'Obfuscated Link (URL Shortener)',
      severity: 'medium',
      clue: hostname,
      explanation: 'URL shorteners conceal the true destination address, hiding malicious or disposable domains from users and email scanners.',
      recommendation: 'Use a free URL expander tool or avoid clicking shortened links from unsolicited messages.',
      weight: 25
    });
    accumulatedWeight += 25;
  }

  // 4. Brand Impersonation & Typosquatting
  for (const brand of KNOWN_BRANDS) {
    const isOfficialDomain = brand.official.some(off => hostname === off || hostname.endsWith('.' + off));

    if (!isOfficialDomain) {
      // 4a. Brand name in subdomain while main domain is different (e.g. paypal.com.attacker.xyz)
      const brandInSubdomain = subdomains.includes(brand.name);
      if (brandInSubdomain) {
        warnings.push({
          id: `url-subdomain-spoof-${brand.name}`,
          category: 'subdomain_spoofing',
          categoryLabel: 'Brand Impersonation in Subdomain',
          severity: 'high',
          clue: `${subdomains} (inside ${hostname})`,
          explanation: `The brand name "${brand.name.toUpperCase()}" appears in the subdomain prefix, but the real registered destination is "${mainDomain}". This is a classic social engineering trick to make victims think they are visiting the official service.`,
          recommendation: `Check the end of the domain name. The real website is "${mainDomain}", NOT the official ${brand.name} website.`,
          weight: 40
        });
        accumulatedWeight += 40;
        break;
      }

      // 4b. Deceptive hyphenation combining brand + security word (e.g. sbi-kyc-update.com)
      const hasDeceptiveKeyword = DECEPTIVE_KEYWORDS.some(kw => domainNameOnly.includes(kw));
      const hasBrandInDomain = domainNameOnly.includes(brand.name);
      if (hasBrandInDomain && hasDeceptiveKeyword) {
        warnings.push({
          id: `url-brand-deceptive-${brand.name}`,
          category: 'brand_spoofing',
          categoryLabel: 'Brand Spoofing with Deceptive Keywords',
          severity: 'high',
          clue: mainDomain,
          explanation: `The domain name combines "${brand.name.toUpperCase()}" with security, banking, or login keywords, but it is not an official domain operated by ${brand.name.toUpperCase()}. Genuine organizations do not register improvised secondary domains for account management.`,
          recommendation: `Navigate directly to ${brand.name}'s official website by typing their verified address into your browser.`,
          weight: 40
        });
        accumulatedWeight += 40;
        break;
      }

      // 4c. Look-alike Typosquatting (e.g. amaz0n, paypa1, g00gle)
      const normalizedDomain = normalizeLeet(domainNameOnly);
      if (normalizedDomain.includes(brand.name) && domainNameOnly !== brand.name) {
        warnings.push({
          id: `url-typosquatting-${brand.name}`,
          category: 'typosquatting',
          categoryLabel: 'Look-Alike Brand Typosquatting',
          severity: 'high',
          clue: mainDomain,
          explanation: `The domain "${mainDomain}" appears to imitate "${brand.name.toUpperCase()}" using visual character substitutions (such as '0' for 'o' or '1' for 'l'). Typosquatting is intentionally used to mislead users who glance quickly at a link.`,
          recommendation: `Inspect domain spelling character by character. Official organizations never substitute letters with numbers in their core web domains.`,
          weight: 35
        });
        accumulatedWeight += 35;
        break;
      }
    }
  }

  // 5. High-Abuse Top-Level Domain (TLD)
  if (SUSPICIOUS_TLDS.has(tld)) {
    warnings.push({
      id: `url-suspicious-tld-${tld}`,
      category: 'suspicious_tld',
      categoryLabel: 'High-Abuse Top-Level Domain',
      severity: 'medium',
      clue: `.${tld}`,
      explanation: `Domains ending in .${tld} are frequently offered at ultra-low prices or without identity verification, making them disproportionately favored by scammers for disposable phishing campaigns.`,
      recommendation: `Exercise heightened scrutiny with unexpected communications pointing to .${tld} addresses.`,
      weight: 20
    });
    accumulatedWeight += 20;
  }

  // 6. Excessive Hyphens in Domain Name
  const hyphenCount = (domainNameOnly.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    warnings.push({
      id: 'url-excessive-hyphens',
      category: 'domain_structure',
      categoryLabel: 'Excessive Hyphens in Domain',
      severity: 'medium',
      clue: `${hyphenCount} hyphens in "${mainDomain}"`,
      explanation: 'Scam domains frequently chain multiple words together with hyphens (e.g., "secure-login-account-update") to look authentic while creating an unregistered address.',
      recommendation: 'Check whether the domain matches the authentic brand name without extraneous hyphenated words.',
      weight: 15
    });
    accumulatedWeight += 15;
  }

  // 7. Excessive Subdomains (Deep Nesting)
  const subdomainParts = subdomains ? subdomains.split('.') : [];
  if (subdomainParts.length >= 3) {
    warnings.push({
      id: 'url-excessive-subdomains',
      category: 'domain_structure',
      categoryLabel: 'Deep Subdomain Nesting',
      severity: 'medium',
      clue: `${subdomainParts.length} subdomain levels (${subdomains})`,
      explanation: 'Deeply nested subdomains are often used in mobile phishing attacks to push the real domain off the narrow screen or address bar.',
      recommendation: 'Look closely at the actual domain right before the first single slash (/), which represents the real host.',
      weight: 15
    });
    accumulatedWeight += 15;
  }

  // 8. Unencrypted HTTP Connection
  if (protocol === 'http:' && !hadNoProtocol) {
    warnings.push({
      id: 'url-insecure-http',
      category: 'insecure_protocol',
      categoryLabel: 'Unencrypted HTTP Connection',
      severity: 'medium',
      clue: 'http://',
      explanation: 'This link uses plain HTTP rather than encrypted HTTPS. Note: An HTTP connection alone does not prove a site is fraudulent (some legacy personal websites use HTTP). However, any modern service that handles logins, passwords, payments, or private information without HTTPS encryption exposes your data to interception on public Wi-Fi.',
      recommendation: 'Never type passwords, debit/credit cards, or sensitive data on unencrypted HTTP pages.',
      weight: 20
    });
    accumulatedWeight += 20;
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
    summary = `Identified ${warnings.length} warning sign${warnings.length > 1 ? 's' : ''} in the URL structure (${warnings.map(w => w.categoryLabel).slice(0, 3).join(', ')}${warnings.length > 3 ? '...' : ''}).`;
  } else {
    summary = 'No common phishing patterns, brand impersonation signs, or misleading structures were detected in this URL. However, always ensure you are on the intended website before entering sensitive information.';
  }

  const safetyRecommendations = [];
  warnings.forEach(w => {
    if (w.recommendation && !safetyRecommendations.includes(w.recommendation)) {
      safetyRecommendations.push(w.recommendation);
    }
  });

  if (safetyRecommendations.length === 0) {
    safetyRecommendations.push('Ensure the domain name exactly matches the official company or organization you intend to visit.');
    safetyRecommendations.push('Look for the padlock symbol in your browser address bar to verify an encrypted HTTPS connection.');
    safetyRecommendations.push('Never enter banking credentials or OTPs on pages reached via unexpected text messages.');
  }

  return {
    url: parsed.href,
    hostname,
    protocol,
    mainDomain,
    subdomains: subdomains || '(None)',
    path: pathname || '/',
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
    disclaimer: 'Notice: ScamLens URL analysis evaluates structural patterns, brand impersonation indicators, and protocol security. This pattern check is advisory and educational; it cannot guarantee whether an external website is legitimate or safe. Never enter sensitive passwords, OTPs, or payment details on unverified sites.'
  };
}

module.exports = {
  analyzeUrl,
  KNOWN_BRANDS,
  KNOWN_SHORTENERS,
  SUSPICIOUS_TLDS
};
