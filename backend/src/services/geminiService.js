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

module.exports = {
  isGeminiConfigured,
  analyzeWithGemini
};
