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
You are the AI reasoning engine for "ScamLens", a safety advisory tool designed for ordinary people.
Your job is to analyze suspicious messages (SMS, WhatsApp, emails, job offers, investment ads, payment requests) and provide clear, reassuring, and easy-to-understand explanations in plain English. Avoid heavy technical or legal jargon.

Analyze the given message along with the rule-based scanner's initial findings.
Produce a valid JSON object matching this schema:
{
  "scamType": "Short classification (e.g. Utility Disconnection Phishing, Telegram Task Scam, Advance Fee Fraud, Bank KYC Phishing, Safe Communication)",
  "aiRiskScore": number between 0 and 100,
  "aiRiskLevel": "Low Risk" | "Moderate Risk" | "High Risk",
  "summary": "2-3 sentences explaining in everyday English what the sender is really trying to accomplish and whether it appears dangerous.",
  "psychologicalTricks": [
    "Short explanation of psychological manipulation like artificial urgency, fear of penalty, greed, or fake authority"
  ],
  "warningSigns": [
    {
      "phraseOrClue": "Specific part or concept from message",
      "plainExplanation": "Why this is a warning sign in simple everyday English"
    }
  ],
  "personalizedSafetyRecommendations": [
    "Clear, practical, step-by-step actions the user should take right now to stay safe"
  ],
  "confidenceScore": number between 0 and 100
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

module.exports = {
  isGeminiConfigured,
  analyzeWithGemini,
  chatWithAssistant,
  analyzeScreenshotWithGemini
};
