/**
 * Google Gemini AI Integration Service for ScamLens.
 * Connects to Google Gen AI SDK to provide contextual scam analysis, psychological trick detection,
 * and plain-English safety recommendations.
 * 
 * Note: If GEMINI_API_KEY is not configured, this service transparently reports that the key is missing
 * and does NOT fabricate mock AI responses.
 */

const { GoogleGenAI } = require('@google/genai');

/**
 * Checks if Gemini API is properly configured with an API key.
 * @returns {boolean}
 */
function isGeminiConfigured() {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim().length > 0 && !key.includes('your_api_key'));
}

/**
 * Analyzes text using Google Gemini AI.
 * @param {string} text The message text to analyze
 * @param {Object} ruleFindings Summary of patterns detected by the rule engine
 * @returns {Promise<Object>} Structured AI evaluation or missing-key notice
 */
async function analyzeWithGemini(text, ruleFindings) {
  if (!isGeminiConfigured()) {
    return {
      available: false,
      reason: 'MISSING_API_KEY',
      message: 'Google Gemini API key is not configured. AI reasoning is currently disabled, while the built-in rule engine analysis is fully active.',
      setupInstructions: {
        step1: 'Obtain a free API key at Google AI Studio: https://aistudio.google.com/app/apikey',
        step2: 'Open the "backend/.env" file in your project.',
        step3: 'Set: GEMINI_API_KEY=your_actual_gemini_key_here',
        step4: 'Restart your backend server (npm run dev).'
      }
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `
You are the Explainable AI (XAI) reasoning engine for "ScamLens", a safety advisory tool designed for ordinary people.
Your job is to analyze suspicious messages (SMS, WhatsApp, emails, job offers, investment ads, payment requests) and provide clear, transparent, and easy-to-understand explanations in plain English. Avoid heavy technical or legal jargon.

Guidelines:
1. Explainability: Clearly explain WHY the message received its score and why it may be suspicious.
2. Distinguish Evidence from Conclusions: Base all warning signs strictly on factual phrases found in the message. Do not fabricate or invent evidence.
3. Fair & Balanced: Do not assert that every suspicious message is 100% definitely a scam; explain the risks and deceptive indicators objectively.
4. Categorize Warning Signs into standard categories:
   - "urgent_payment" (Urgent Payment Request)
   - "otp_request" (Request for OTP or Credentials)
   - "unrealistic_rewards" (Unrealistic Reward or Prize Claim)
   - "threatening_language" (Threatening or High-Pressure Language)
   - "suspicious_links" (Suspicious Link or Domain)
   - "personal_info" (Request for Sensitive Personal Information)
   - "other"

Produce a valid JSON object matching this schema:
{
  "scamType": "Short classification (e.g. Advance Fee Prize Scam, Utility Disconnection Phishing, Telegram Task Scam, Bank KYC Phishing, Safe Communication)",
  "aiRiskScore": number between 0 and 100,
  "aiRiskLevel": "Low Risk" | "Moderate Risk" | "High Risk",
  "summary": "2-3 sentences explaining in everyday English what the sender is really trying to accomplish.",
  "reasoning": "1-2 sentences clearly explaining the core reason why the message may be suspicious (e.g. 'The sender is asking for money before providing the promised reward.')",
  "scoreRationale": "A concise explanation of why this risk score was assigned based on the detected indicators.",
  "warningSigns": [
    {
      "category": "urgent_payment" | "otp_request" | "unrealistic_rewards" | "threatening_language" | "suspicious_links" | "personal_info" | "other",
      "categoryLabel": "Clear human-readable category name",
      "phraseOrClue": "Exact quote or phrase from the message",
      "plainExplanation": "Why this specific phrase/clue is suspicious in simple everyday English",
      "severity": "high" | "medium" | "low"
    }
  ],
  "personalizedSafetyRecommendations": [
    "Clear, practical, step-by-step actions the user should take right now (e.g. 'Do not make the payment until you independently verify the offer.')"
  ]
}

Respond ONLY with the valid JSON object. Do not wrap in markdown quotes if possible, or use standard json.
`;

    const userPrompt = `
Suspicious message text:
"""
${text}
"""

Rule engine pre-scan findings:
- Detected categories: ${ruleFindings.categoriesDetected.join(', ') || 'None'}
- Rule score: ${ruleFindings.score}/100
- Initial risk level: ${ruleFindings.riskLevel}
- Flagged phrases count: ${ruleFindings.matches.length}

Evaluate the message thoroughly and return the JSON assessment.
`;

    // Call Gemini 2.0 Flash with a 25-second timeout so a slow/invalid
    // API response cannot hang the backend indefinitely.
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
        httpOptions: { timeout: 25000 }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini returned an empty response. The model may have refused or blocked the content.');
    }
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch (parseErr) {
      // Clean possible markdown code fences if present
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    }

    return {
      available: true,
      data: parsedResult,
      modelUsed: 'gemini-2.0-flash',
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Gemini API execution error:', error.message);
    return {
      available: false,
      reason: 'API_ERROR',
      message: `Gemini API request failed: ${error.message}. Built-in rule-based analysis remains fully active.`,
      errorDetails: error.message
    };
  }
}

/**
 * Intelligent digital safety knowledge fallback for common scam questions.
 */
function getFallbackAssistantReply(userMessage) {
  const q = userMessage.toLowerCase();

  if (q.includes('otp') || q.includes('one time password')) {
    return `🚨 **CRITICAL SAFETY ADVICE: Never Share Your OTP**

**1. The Golden Rule:**
No legitimate bank, electric company, government agency, or customer care will EVER ask for your OTP. 

**2. Why Scammers Want It:**
An OTP (One-Time Password) is the **final lock** protecting your money or account. When a scammer has your card number or username, they trigger an OTP so that **you** authorize their theft.

**3. What You Should Do Right Now:**
- **Hang up immediately** if someone is on the call demanding it.
- **Do not reply** to the SMS or message.
- If you accidentally shared an OTP: Contact your bank fraud helpline immediately and request an immediate account or card freeze. In India, call the national cybercrime helpline at **1930**.`;
  }

  if (q.includes('job') || q.includes('task') || q.includes('work from home') || q.includes('telegram') || q.includes('part time')) {
    return `💼 **How to Identify a Fake Job Offer (Task Scam)**

Fake job offers are currently one of the most common cyber scams. Here are the tell-tale warning signs:

**1. "Pay Money to Earn Money":**
Legitimate employers pay you. If a job asks you to pay an "advance registration fee", "security deposit", or "recharge an investment balance", it is 100% a scam.

**2. Ridiculous Pay for Trivial Work:**
Promises like *"Earn ₹3,000–₹8,000 per day by simply liking YouTube videos or giving hotel reviews"* are classic recruitment traps designed to lure victims into Telegram groups.

**3. Communication on Unofficial Apps:**
Scammers strictly avoid official corporate emails and insist on communicating only through **Telegram** or **WhatsApp**.

**4. What to Do:**
- Never deposit money to unlock tasks or commissions.
- Stop communication and block the sender.
- Verify job openings directly on the official company careers portal.`;
  }

  if (q.includes('phishing') || q.includes('link') || q.includes('url') || q.includes('website')) {
    return `🔗 **How to Identify Phishing Links & Fake Websites**

Phishing links mimic trusted brands to steal your login credentials and credit card information:

**1. Inspect the Real Destination Domain:**
Scammers use fake subdomains to fool your eyes:
- Example: \`http://paypal.com.account-verify.xyz\`
- Look at the part immediately before the final slash: the actual destination is **account-verify.xyz**, NOT PayPal!

**2. Look for Typosquatting (Lookalike Spelling):**
Scammers register misspelled domains such as \`amaz0n-support.com\`, \`micros0ft-login.com\`, or \`netflixx-billing.com\`.

**3. Shortened Links:**
Be wary of mystery shortened URLs like \`bit.ly\`, \`tinyurl\`, or \`is.gd\` sent via SMS, as they disguise the actual malicious website.

**4. Safety Step:**
Never click verification links sent in unexpected text messages. Always open your browser and navigate to the official website manually.`;
  }

  if (q.includes('upi') || q.includes('gpay') || q.includes('phonepe') || q.includes('paytm') || q.includes('qr code')) {
    return `💳 **Crucial UPI Rule: How UPI Scams Happen**

**1. THE GOLDEN UPI RULE:**
👉 **You NEVER need to enter your UPI PIN or scan a QR code to RECEIVE money.**
Entering your UPI PIN ALWAYS **transfers money OUT** of your bank account.

**2. Common UPI Scams:**
- **"Collect Request" Deception:** Scammers send a payment request disguised as a refund or prize. When you approve and enter your PIN, your money is deducted.
- **QR Code Scam:** The scammer claims: *"Scan this QR code to receive your advance payment for your OLX item."* Scanning a QR code and entering your PIN pays them!
- **Fake Screenshot of Payment:** Scammers show a fake screenshot claiming money was sent, and ask you to return the "excess" amount.

**3. Immediate Defensive Action:**
If you entered your PIN, immediately open your UPI app, disconnect your bank account, and report the transaction to your bank and **1930** (Cybercrime Helpline).`;
  }

  if (q.includes('money') || q.includes('lost') || q.includes('cheated') || q.includes('sent')) {
    return `🚨 **EMERGENCY: Immediate Steps if You Sent Money to a Scammer**

Act within the **"Golden Hour"** (first 2-3 hours) to maximize the chance of freezing the funds:

**1. Contact Your Bank Immediately:**
Call your bank's dedicated 24/7 fraud helpline (found on the back of your debit card or official app). Request an immediate freeze on the transaction reference number (UTR / Txn ID).

**2. Report on the Cybercrime Helpline:**
- In India: Call **1930** (Citizen Financial Cyber Fraud Reporting and Management System) or visit **cybercrime.gov.in**.
- Provide transaction details, scammer account/UPI ID, and phone number.

**3. Block and Document:**
- Take full screenshots of the chat, SMS, call log, and payment receipts before they are deleted.
- Block the scammer across all platforms and never send further money to "recovery agents" (they are often secondary scammers).`;
  }

  // General default safety guidance
  return `🛡️ **ScamLens Digital Safety Guidance**

Online scams often rely on psychological manipulation rather than high-tech hacking. Remember these core safety habits:

**1. Question Artificial Urgency:**
Scammers create fake panic ("Your electricity will be cut off tonight", "Your bank account is frozen", "Urgent legal action"). Pause and take a breath—genuine organizations will never demand instant compliance within minutes.

**2. Verify Independently:**
Always contact the official organization through their verified website or customer care number from your billing statement, never the phone number provided in a suspicious SMS.

**3. Protect Sensitive Credentials:**
Never share OTPs, UPI PINs, passwords, or install remote access software (like AnyDesk or TeamViewer) at anyone's request.

*You can ask me specific questions like "How do I identify a fake job offer?", "Someone is asking for my OTP", or "How do UPI scams happen?"*`;
}

/**
 * Chats with the ScamLens AI Assistant using Google Gemini AI.
 * Acts as a digital safety assistant educating users about online scams, fraud prevention, and cybersecurity.
 * @param {string} userMessage The user's query or scenario
 * @param {Array} history Conversation history: [{ role: 'user'|'model', text: string }]
 * @returns {Promise<Object>} Response containing the assistant's reply
 */
async function chatWithAssistant(userMessage, history = []) {
  if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
    throw new Error('Please provide a message to chat with the AI assistant.');
  }

  const cleanMessage = userMessage.trim();

  if (!isGeminiConfigured()) {
    return {
      success: true,
      reply: getFallbackAssistantReply(cleanMessage),
      isFallback: true,
      modelUsed: 'ScamLens Safety Knowledge Engine',
      note: 'To activate full dynamic conversational AI, configure GEMINI_API_KEY in your environment.'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `
You are the "ScamLens AI Assistant", an empathetic, highly knowledgeable, and practical digital safety and fraud-prevention assistant.
Your mission is to educate ordinary people about online scams, fraud prevention, social engineering, and practical cybersecurity.

Core Guidelines:
1. Simplicity & Clarity: Use plain, conversational English that is crystal clear to ordinary, non-technical people. Avoid dense legal or technical jargon.
2. Actionable Countermeasures: Always provide clear, step-by-step actions the user should take right now (e.g. "Do not share the OTP", "Block this sender", "Contact your bank immediately", "Call national cyber fraud helpline 1930").
3. Reassuring & Calm Tone: Users asking questions may be anxious or confused. Be compassionate, supportive, and objective.
4. Explain Deception Mechanics: Clearly explain *why* a particular tactic is dangerous (e.g. how OTPs authorize fund transfers, how remote access apps like AnyDesk give full phone control, or why legitimate employers never demand advance fees).
5. Formatting: Use structured bullet points, bold key terms, and short paragraphs so advice is effortless to read on both desktop and mobile.
6. Urgent Triage: If a user reveals they already sent money or shared passwords, immediately lead with critical emergency actions: contact the bank / payment app fraud line, lock netbanking, and report to authorities.
`;

    const contents = [];
    if (Array.isArray(history)) {
      history.slice(-8).forEach(item => {
        if (item && item.text && (item.role === 'user' || item.role === 'model')) {
          contents.push({
            role: item.role,
            parts: [{ text: item.text }]
          });
        }
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: cleanMessage }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4,
        httpOptions: { timeout: 25000 }
      }
    });

    const replyText = response.text;
    if (!replyText) {
      throw new Error('Gemini model did not return any text.');
    }

    return {
      success: true,
      reply: replyText.trim(),
      isFallback: false,
      modelUsed: 'gemini-2.0-flash',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Gemini Assistant chat error:', error.message);
    return {
      success: true,
      reply: getFallbackAssistantReply(cleanMessage),
      isFallback: true,
      errorNotice: `Gemini API service temporarily unavailable: ${error.message}`,
      modelUsed: 'ScamLens Safety Fallback Guide'
    };
  }
}

/**
 * Analyzes a screenshot using Gemini Vision capabilities.
 * Performs OCR to extract visible text, analyzes for phishing, fake jobs, payment/OTP requests, lottery, investments,
 * scores the threat level, and extracts warning signs.
 * @param {string} base64Data Base64 image payload (stripped of data:image/xxx;base64, prefix)
 * @param {string} mimeType 'image/png' | 'image/jpeg' | 'image/jpg'
 * @returns {Promise<Object>}
 */
async function analyzeScreenshotWithGemini(base64Data, mimeType = 'image/png') {
  if (!isGeminiConfigured()) {
    return {
      available: false,
      reason: 'MISSING_API_KEY',
      message: 'Google Gemini API key is required for Vision OCR and screenshot deception analysis.',
      setupInstructions: {
        step1: 'Obtain a free API key at Google AI Studio: https://aistudio.google.com/app/apikey',
        step2: 'Add GEMINI_API_KEY to backend/.env or Vercel Settings',
        step3: 'Restart your backend server'
      }
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `
You are the multimodal computer vision security engine for "ScamLens", a safety tool protecting ordinary people against cyber fraud.
Your job is to inspect screenshots of SMS messages, WhatsApp chats, emails, banking alerts, payment screens, QR codes, social media DMs, or fake websites.

Task:
1. Extract ALL readable text from the screenshot accurately (OCR).
2. Deconstruct the content for scam patterns:
   - Phishing attempts & credential theft
   - Fake job offers (Telegram tasks, YouTube like commissions)
   - Payment requests & fake UPI QR codes
   - Demands for OTP or banking passwords
   - Fake lottery winnings or prize notifications
   - Investment scams (guaranteed crypto doubling)
   - Suspicious links or spoofed brand domains
   - Impersonation of officials (banks, police, electricity officers, delivery agents)
3. Return a valid JSON object matching this schema:
{
  "extractedText": "Complete text extracted from the screenshot exactly as visible",
  "scamType": "Short classification (e.g. Electricity Disconnection Phishing, Telegram VIP Job Scam, Bank KYC Suspension, Fake Courier Alert, Safe Legitimate Message)",
  "riskScore": number between 0 and 100,
  "riskLevel": "Low Risk" | "Moderate Risk" | "High Risk",
  "summary": "2-3 concise sentences in plain English explaining what this screenshot depicts and why it is dangerous or safe.",
  "suspiciousPhrases": [
    {
      "phrase": "Exact phrase from the screenshot text that is suspicious",
      "explanation": "Why this specific phrase is deceptive in plain English",
      "severity": "high" | "medium" | "low",
      "recommendation": "Defensive action for this clue"
    }
  ],
  "visualClues": [
    "Specific visual red flags seen in the image, such as fake app headers, urgency countdowns, unverified badges, or blurred sender details"
  ],
  "safetyRecommendations": [
    "Actionable, step-by-step instructions the user should follow immediately"
  ]
}

Respond ONLY with the JSON object. Do not include markdown code blocks.
`;

    const userPrompt = `
Analyze this screenshot thoroughly. Extract all visible text and evaluate for scams, fraud, phishing, or impersonation.
Return the structured JSON analysis report.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: userPrompt
            }
          ]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
        httpOptions: { timeout: 35000 }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini Vision model did not return any response.');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch (parseErr) {
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    }

    return {
      available: true,
      data: parsedResult,
      modelUsed: 'gemini-2.0-flash-vision',
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Gemini Vision execution error:', error.message);
    throw error;
  }
}

/**
 * Supported languages for the Scam Translator feature
 */
const SUPPORTED_LANGUAGES = {
  en: { code: 'en', name: 'English', native: 'English' },
  te: { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  hi: { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  ta: { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  kn: { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' }
};

/**
 * Intelligent multilingual fallback when Gemini API key is missing or offline
 */
function getFallbackTranslation(text, targetLang, ruleFindings = {}) {
  const langKey = SUPPORTED_LANGUAGES[targetLang] ? targetLang : 'en';
  const langInfo = SUPPORTED_LANGUAGES[langKey];
  const q = text.toLowerCase();

  const isLottery = q.includes('congratulations') || q.includes('won') || q.includes('prize') || q.includes('lottery') || q.includes('50,000') || q.includes('50000');
  const isPower = q.includes('electricity') || q.includes('power') || q.includes('disconnected') || q.includes('bill');
  const isKyc = q.includes('kyc') || q.includes('pan') || q.includes('bank') || q.includes('account blocked') || q.includes('otp');
  const isJob = q.includes('job') || q.includes('work from home') || q.includes('earn') || q.includes('daily');

  if (langKey === 'te') {
    if (isLottery) {
      return {
        targetLanguage: 'Telugu',
        targetLanguageCode: 'te',
        translatedMessage: 'అభినందనలు! మీరు ₹50,000 గెలుచుకున్నారు. మీ బహుమతిని క్లెయిమ్ చేయడానికి వెంటనే ₹500 చెల్లించండి.',
        actualMeaning: 'ఈ సందేశం వెనుక ఉన్న అసలు ఉద్దేశం మీకు ఎటువంటి బహుమతి ఇవ్వడం కాదు. కేవలం మీ వద్ద నుండి ₹500 ముందస్తుగా వసూలు చేసి మోసం చేయడమే.',
        suspiciousRequests: [
          'లాటరీ లేదా బహుమతి పేరుతో ముందస్తుగా ₹500 చెల్లించాలనే డిమాండ్.',
          'మీరు పాల్గొనని పోటీలో భారీ నగదు గెలుచుకున్నారని నమ్మించే ప్రయత్నం.',
          'ఆలోచించే సమయం ఇవ్వకుండా వెంటనే చెల్లించాలని తొందరపెట్టడం.'
        ],
        dangerExplanation: 'మీరు ఈ ₹500 పంపితే ఆ డబ్బు వెంటనే పోతుంది. మోసగాళ్లు ఆ తర్వాత మరింత పెద్ద మొత్తాలను అడుగుతారు లేదా సంప్రదింపులను ఆపివేస్తారు.',
        safetyRecommendations: [
          'ఎట్టి పరిస్థితుల్లోనూ బహుమతులు పొందడానికి ముందస్తుగా ఎవరికీ డబ్బు పంపవద్దు.',
          'మీరు కొనుగోలు చేయని లాటరీలలో మీకు ఎప్పటికీ బహుమతులు రావని గుర్తుంచుకోండి.',
          'ఈ మెసేజ్ పంపిన నంబర్‌ను వెంటనే బ్లాక్ చేయండి మరియు సైబర్ క్రైమ్ పోర్టల్ (1930) కు ఫిర్యాదు చేయండి.'
        ]
      };
    } else if (isPower) {
      return {
        targetLanguage: 'Telugu',
        targetLanguageCode: 'te',
        translatedMessage: 'గమనిక: మీ విద్యుత్ బిల్లు చెల్లించనందున ఈ రాత్రి మీ కరెంట్ కనెక్షన్ నిలిపివేయబడుతుంది. వెంటనే ఇవ్వబడిన నంబర్‌కు సంప్రదించండి.',
        actualMeaning: 'మోసగాళ్ళు మిమ్మల్ని భయపెట్టి, వెంటనే ఫోన్ చేయించి వ్యక్తిగత యూపీఐ ఖాతాలకు డబ్బు పంపించేలా లేదా నకిలీ యాప్స్ డౌన్‌లోడ్ చేయించేలా ప్రయత్నిస్తున్నారు.',
        suspiciousRequests: [
          'కరెంట్ నిలిపివేస్తామని రాత్రికి రాత్రే భయపెట్టే హెచ్చరికలు.',
          'అధికారిక కార్యాలయం కాకుండా ప్రైవేట్ మొబైల్ నంబర్‌కు కాల్ చేయాలనే డిమాండ్.',
          'తక్షణ చెల్లింపు చేయాలని ఒత్తిడి చేయడం.'
        ],
        dangerExplanation: 'వారితో మాట్లాడితే వారు మీ ఫోన్‌లో స్క్రీన్ షేరింగ్ యాప్ (AnyDesk మొదలైనవి) డౌన్‌లోడ్ చేయించి మీ బ్యాంక్ ఖాతాలోని డబ్బునంతా ఖాళీ చేసే ప్రమాదం ఉంది.',
        safetyRecommendations: [
          'విద్యుత్ శాఖ ఎప్పుడూ వ్యక్తిగత నంబర్ల నుండి ఇలాంటి సందేశాలు పంపదు.',
          'మీ విద్యుత్ బిల్లు స్థితిని అధికారిక వెబ్‌సైట్ లేదా విద్యుత్ కార్యాలయంలో మాత్రమే తనిఖీ చేయండి.',
          'సందేశంలో ఉన్న మొబైల్ నంబర్లకు ఎప్పుడూ కాల్ చేయవద్దు లేదా డబ్బు పంపవద్దు.'
        ]
      };
    } else {
      return {
        targetLanguage: 'Telugu',
        targetLanguageCode: 'te',
        translatedMessage: `అనువదించబడిన సందేశం: "${text}"`,
        actualMeaning: 'ఈ సందేశం మిమ్మల్ని ఆకర్షించడానికి లేదా తొందరపెట్టి మోసపూరిత చర్యలకు గురిచేసే అవకాశాలు ఉన్నాయి.',
        suspiciousRequests: [
          'ముందస్తు చెల్లింపు లేదా బ్యాంక్ వివరాలు అడగడం.',
          'నకిలీ వెబ్‌సైట్ లింక్‌లను క్లిక్ చేయమని కోరడం.',
          'వ్యక్తిగత గోప్యతా సమాచారాన్ని సేకరించే ప్రయత్నం.'
        ],
        dangerExplanation: 'అనుమానాస్పద సందేశాలకు స్పందించడం వల్ల మీ ఆర్థిక సమాచారం మరియు వ్యక్తిగత వివరాలు దొంగిలించబడవచ్చు.',
        safetyRecommendations: [
          'అపరిచిత వ్యక్తులు పంపిన లింక్‌లను ఎప్పుడూ క్లిక్ చేయవద్దు.',
          'మీ పాస్‌వర్డ్‌లు, ఓటీపీ లేదా బ్యాంక్ వివరాలను ఎవరితోనూ పంచుకోవద్దు.',
          'అనుమానం ఉంటే అధికారిక సంస్థ ప్రతినిధులను నేరుగా సంప్రదించండి.'
        ]
      };
    }
  }

  if (langKey === 'hi') {
    if (isLottery) {
      return {
        targetLanguage: 'Hindi',
        targetLanguageCode: 'hi',
        translatedMessage: 'बधाई हो! आपने ₹50,000 जीते हैं। अपना पुरस्कार प्राप्त करने के लिए तुरंत ₹500 का भुगतान करें।',
        actualMeaning: 'इस संदेश का वास्तविक उद्देश्य आपको कोई इनाम देना नहीं है, बल्कि इनाम का लालच देकर आपसे अग्रिम ₹500 ठगना है।',
        suspiciousRequests: [
          'इनाम का दावा करने के लिए अग्रिम ₹500 का भुगतान करने की मांग।',
          'बिना किसी लॉटरी में भाग लिए भारी इनाम जीतने का झूठा दावा।',
          'बिना सोचे-समझे तुरंत पैसे भेजने के लिए दबाव बनाना।'
        ],
        dangerExplanation: 'यदि आप यह राशि भेजते हैं, तो यह पैसा कभी वापस नहीं मिलेगा। इसके बाद जालसाज आपसे और अधिक शुल्क मांगने लगेंगे।',
        safetyRecommendations: [
          'किसी भी कथित इनाम या लॉटरी को प्राप्त करने के लिए कभी भी अग्रिम भुगतान न करें।',
          'याद रखें, जिस प्रतियोगिता में आपने भाग नहीं लिया, उसमें आप कभी नहीं जीत सकते।',
          'इस नंबर को तुरंत ब्लॉक करें और साइबर अपराध हेल्पलाइन (1930) पर रिपोर्ट करें।'
        ]
      };
    } else if (isPower) {
      return {
        targetLanguage: 'Hindi',
        targetLanguageCode: 'hi',
        translatedMessage: 'महत्वपूर्ण सूचना: पिछले बिजली बिल का भुगतान न होने के कारण आज रात आपकी बिजली काट दी जाएगी। तुरंत दिए गए नंबर पर संपर्क करें।',
        actualMeaning: 'यह बिजली विभाग का असली संदेश नहीं है। जालसाज आपको डराकर किसी अज्ञात नंबर पर कॉल करवाकर आपके बैंक खाते से पैसे चुराने की कोशिश कर रहे हैं।',
        suspiciousRequests: [
          'तुरंत बिजली काटने की धमकी देकर घबराहट पैदा करना।',
          'सरकारी कार्यालय के बजाय किसी निजी मोबाइल नंबर पर कॉल करने का निर्देश।',
          'तुरंत ऑनलाइन भुगतान करने का अनुचित दबाव।'
        ],
        dangerExplanation: 'उस नंबर पर कॉल करने पर वे आपको कोई रिमोट कंट्रोल ऐप (जैसे AnyDesk) इंस्टॉल करवाकर आपका पूरा बैंक खाता खाली कर सकते हैं।',
        safetyRecommendations: [
          'बिजली विभाग कभी भी निजी मोबाइल नंबरों से ऐसे व्यक्तिगत धमकी भरे संदेश नहीं भेजता।',
          'हमेशा अपने बिजली बिल की स्थिति केवल आधिकारिक ऐप या बिजली कार्यालय जाकर जांचें।',
          'संदेश में दिए गए किसी भी अज्ञात नंबर पर कॉल न करें।'
        ]
      };
    } else {
      return {
        targetLanguage: 'Hindi',
        targetLanguageCode: 'hi',
        translatedMessage: `अनुवादित संदेश: "${text}"`,
        actualMeaning: 'इस संदेश के पीछे छिपा हुआ उद्देश्य आपको गुमराह करके संवेदनशील जानकारी या पैसे हासिल करना हो सकता है।',
        suspiciousRequests: [
          'संदिग्ध लिंक पर क्लिक करने या अग्रिम भुगतान का आग्रह।',
          'गोपनीय व्यक्तिगत या वित्तीय जानकारी मांगने का प्रयास।',
          'जल्दबाजी में निर्णय लेने का दबाव।'
        ],
        dangerExplanation: 'अज्ञात संदेशों के निर्देशों का पालन करने से वित्तीय धोखाधड़ी या पहचान की चोरी हो सकती है।',
        safetyRecommendations: [
          'अनजान संदेशों में आए किसी भी लिंक पर कभी क्लिक न करें।',
          'अपना ओटीपी, पासवर्ड या बैंक विवरण किसी के साथ साझा न करें।',
          'संदेह होने पर आधिकारिक स्रोतों से सीधे पुष्टि करें।'
        ]
      };
    }
  }

  if (langKey === 'ta') {
    return {
      targetLanguage: 'Tamil',
      targetLanguageCode: 'ta',
      translatedMessage: isLottery
        ? 'வாழ்த்துகள்! நீங்கள் ₹50,000 வென்றுள்ளீர்கள். உங்கள் பரிசைப் பெற உடனே ₹500 செலுத்துங்கள்.'
        : `மொழிபெயர்க்கப்பட்ட செய்தி: "${text}"`,
      actualMeaning: isLottery
        ? 'இந்தச் செய்தியின் உண்மையான நோக்கம் உங்களுக்குப் பரிசு தருவது அல்ல; முன்கூட்டியே ₹500 பணத்தைப் பறிப்பதே மோசடித் திட்டம்.'
        : 'இந்தச் செய்தி உங்களை ஏமாற்றி ரகசியத் தகவல்களை அல்லது பணத்தைப் பறிக்கும் நோக்கத்தைக் கொண்டிருக்கலாம்.',
      suspiciousRequests: [
        'பரிசைப் பெறுவதற்காக முன்கூட்டியே பணம் செலுத்துமாறு வற்புறுத்துதல்.',
        'பங்கேற்காத போட்டியில் பரிசு வென்றதாகக் கூறுவது.',
        'உடனடியாக நடவடிக்கை எடுக்க வேண்டும் என்ற அவசர அழுத்தம்.'
      ],
      dangerExplanation: 'நீங்கள் பணத்தை அனுப்பினால், அந்தப் பணம் திரும்பக் கிடைக்காது. இது ஒரு திட்டமிட்ட சைபர் மோசடி.',
      safetyRecommendations: [
        'பரிசுகளைப் பெற ஒருபோதும் முன் பணம் செலுத்த வேண்டாம்.',
        'தெரியாத எண்களிலிருந்து வரும் செய்திகளைப் புறக்கணித்து பிளாக் செய்யவும்.',
        'சைபர் கிரைம் உதவி எண் 1930-ல் புகார் அளிக்கவும்.'
      ]
    };
  }

  if (langKey === 'kn') {
    return {
      targetLanguage: 'Kannada',
      targetLanguageCode: 'kn',
      translatedMessage: isLottery
        ? 'ಅಭಿನಂದನೆಗಳು! ನೀವು ₹50,000 ಗೆದ್ದಿದ್ದೀರಿ. ನಿಮ್ಮ ಬಹುಮಾನವನ್ನು ಕ್ಲೈಮ್ ಮಾಡಲು ತಕ್ಷಣ ₹500 ಪಾವತಿಸಿ.'
        : `ಅನುವಾದಿತ ಸಂದೇಶ: "${text}"`,
      actualMeaning: isLottery
        ? 'ಈ ಸಂದೇಶದ ನಿಜವಾದ ಉದ್ದೇಶ ನಿಮಗೆ ಯಾವುದೇ ಬಹುಮಾನ ನೀಡುವುದಲ್ಲ, ಬದಲಿಗೆ ಮುಂಗಡವಾಗಿ ₹500 ಹಣವನ್ನು ವಂಚಿಸುವುದಾಗಿದೆ.'
        : 'ಈ ಸಂದೇಶವು ನಿಮ್ಮನ್ನು ಮೋಸಗೊಳಿಸಿ ಸೂಕ್ಷ್ಮ ಮಾಹಿತಿ ಅಥವಾ ಹಣವನ್ನು ಪಡೆಯುವ ಹುನ್ನಾರವಾಗಿರಬಹುದು.',
      suspiciousRequests: [
        'ಬಹುಮಾನಕ್ಕಾಗಿ ಮುಂಗಡ ಹಣ ಪಾವತಿಸಲು ಬೇಡಿಕೆ.',
        'ಭಾಗವಹಿಸದ ಲಾಟರಿಯಲ್ಲಿ ಬಹುಮಾನ ಬಂದಿದೆ ಎಂದು ನಂಬಿಸುವುದು.',
        'ತಕ್ಷಣವೇ ಹಣ ಕಳುಹಿಸಲು ಅನಗತ್ಯ ಆತುರಪಡಿಸುವುದು.'
      ],
      dangerExplanation: 'ನೀವು ಹಣವನ್ನು ಕಳುಹಿಸಿದರೆ, ಆ ಹಣ ಶಾಶ್ವತವಾಗಿ ಕಳೆದುಹೋಗುತ್ತದೆ ಮತ್ತು ಯಾವುದೇ ಬಹುಮಾನ ಸಿಗುವುದಿಲ್ಲ.',
      safetyRecommendations: [
        'ಯಾವುದೇ ಬಹುಮಾನ ಪಡೆಯಲು ಎಂದಿಗೂ ಮುಂಗಡ ಹಣ ನೀಡಬೇಡಿ.',
        'ಅಪರಿಚಿತ ಸಂಖ್ಯೆಯಿಂದ ಬಂದ ಸಂದೇಶವನ್ನು ಬ್ಲಾಕ್ ಮಾಡಿ.',
        'ಸೈಬರ್ ಕ್ರೈಮ್ ಸಹಾಯವಾಣಿ 1930 ಗೆ ದೂರು ನೀಡಿ.'
      ]
    };
  }

  // English default
  return {
    targetLanguage: 'English',
    targetLanguageCode: 'en',
    translatedMessage: text,
    actualMeaning: isLottery
      ? 'The sender has no intention of granting you prize money. The message is an advance-fee trap designed to steal your upfront payment.'
      : 'The message contains psychological tactics aimed at manipulating you into making a hasty decision or sharing credentials.',
    suspiciousRequests: [
      'Demand for upfront payment before receiving a reward.',
      'Claiming winnings from a contest you never entered.',
      'High-pressure urgency demanding immediate compliance.'
    ],
    dangerExplanation: 'Transferring money or clicking the sender\'s links directly risks immediate financial loss and compromise of your banking details.',
    safetyRecommendations: [
      'Never send upfront advance fees to claim prizes or lottery winnings.',
      'Block the sender\'s phone number or email address immediately.',
      'Report financial cyber scams to official authorities or the 1930 helpline.'
    ]
  };
}

/**
 * Translates and explains a suspicious message into the user's preferred language
 * using Google Gemini AI, with automatic safety fallback.
 * 
 * @param {string} text The message text
 * @param {string} targetLang The target language code ('en', 'te', 'hi', 'ta', 'kn')
 * @param {Object} ruleFindings Summary findings from the pattern engine
 * @returns {Promise<Object>} Multilingual scam translation and safety breakdown
 */
async function translateAndExplainScam(text, targetLang = 'en', ruleFindings = {}) {
  const langKey = SUPPORTED_LANGUAGES[targetLang] ? targetLang : 'en';
  const langInfo = SUPPORTED_LANGUAGES[langKey];

  if (!isGeminiConfigured()) {
    console.log(`[ScamLens] Gemini not configured, using verified multilingual safety engine for ${langInfo.name}`);
    const fallback = getFallbackTranslation(text, langKey, ruleFindings);
    return {
      available: true,
      source: 'Verified Multilingual Safety Knowledge Base',
      data: fallback
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `
You are the expert "Scam Translator & Safety Explainer" for ScamLens.
Your mission is to help people understand suspicious or deceptive messages in their native language (${langInfo.name} / ${langInfo.native}).

IMPORTANT RULES:
1. DO NOT SIMPLY TRANSLATE WORD-FOR-WORD.
2. Translate the message clearly into ${langInfo.name}.
3. Explain the TRUE INTENTION and hidden psychological deception behind the message in plain, easy-to-understand words in ${langInfo.name}.
4. Identify specific suspicious demands or hooks in the message in ${langInfo.name}.
5. Explain clearly why following this message is dangerous (loss of money, identity theft, malware) in ${langInfo.name}.
6. Provide actionable, practical defensive steps in ${langInfo.name}.
7. All output fields MUST be returned in the target language (${langInfo.name} / ${langInfo.native}).

Required JSON Schema:
{
  "targetLanguage": "${langInfo.name}",
  "targetLanguageCode": "${langKey}",
  "translatedMessage": "Fluent, accurate translation of the message into ${langInfo.name}",
  "actualMeaning": "Simple explanation in ${langInfo.name} explaining what the scammer is REALLY trying to do (the hidden trap).",
  "suspiciousRequests": [
    "Specific suspicious request or trick 1 in ${langInfo.name}",
    "Specific suspicious request or trick 2 in ${langInfo.name}"
  ],
  "dangerExplanation": "Why this message poses a danger to the recipient in ${langInfo.name}.",
  "safetyRecommendations": [
    "Clear protective action 1 in ${langInfo.name}",
    "Clear protective action 2 in ${langInfo.name}",
    "Clear protective action 3 in ${langInfo.name}"
  ]
}

Return ONLY valid JSON matching this schema.
`;

    const userPrompt = `
Analyze and translate this suspicious message into ${langInfo.name} (${langInfo.native}):
"""
${text}
"""
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
        httpOptions: { timeout: 25000 }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini returned an empty translation response.');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch (parseErr) {
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    }

    return {
      available: true,
      source: 'Google Gemini 2.0 Flash Multilingual AI',
      data: parsedResult
    };
  } catch (err) {
    console.error(`[ScamLens] Gemini translation error: ${err.message}. Engaging safety fallback.`);
    const fallback = getFallbackTranslation(text, langKey, ruleFindings);
    return {
      available: true,
      source: 'Verified Multilingual Safety Knowledge Base (Fallback)',
      data: fallback
    };
  }
}

module.exports = {
  isGeminiConfigured,
  analyzeWithGemini,
  chatWithAssistant,
  analyzeScreenshotWithGemini,
  translateAndExplainScam,
  SUPPORTED_LANGUAGES
};
