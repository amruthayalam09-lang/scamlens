/**
 * Controller for message analysis in ScamLens.
 * Coordinates rule-based pattern scanner with Gemini AI service.
 */

const { runRuleBasedAnalysis } = require('./ruleEngine');
const {
  analyzeWithGemini,
  isGeminiConfigured,
  chatWithAssistant,
  analyzeScreenshotWithGemini,
  translateAndExplainScam,
  SUPPORTED_LANGUAGES
} = require('./geminiService');
const { analyzeUrl } = require('./urlEngine');
const { analyzeEmail } = require('./emailEngine');

/**
 * Handles POST /api/analyze
 */
async function handleAnalyze(req, res) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide a non-empty text message to analyze.'
      });
    }

    const cleanText = message.trim();

    // 1. Run Rule-Based Pattern Analysis
    const ruleFindings = runRuleBasedAnalysis(cleanText);

    // 2. Run Gemini AI Contextual Analysis (or get missing-key notice)
    const geminiResult = await analyzeWithGemini(cleanText, ruleFindings);

    // 3. Synthesize Combined Results
    let finalRiskScore = ruleFindings.score;
    let finalRiskLevel = ruleFindings.riskLevel;
    let finalSummary = '';
    const safetyRecommendations = [];

    // Collect base recommendations from matched rules
    ruleFindings.matches.forEach(m => {
      if (m.recommendation && !safetyRecommendations.includes(m.recommendation)) {
        safetyRecommendations.push(m.recommendation);
      }
    });

    if (geminiResult.available && geminiResult.data) {
      const aiData = geminiResult.data;
      // Balance rule score and AI score
      // If AI detected nuance not in static rules, or vice versa
      finalRiskScore = Math.round((ruleFindings.score * 0.45) + (aiData.aiRiskScore * 0.55));
      finalRiskScore = Math.min(100, Math.max(0, finalRiskScore));

      if (finalRiskScore >= 60) {
        finalRiskLevel = 'High Risk';
      } else if (finalRiskScore >= 25) {
        finalRiskLevel = 'Moderate Risk';
      } else {
        finalRiskLevel = 'Low Risk';
      }

      finalSummary = aiData.summary;

      // Add AI recommendations
      if (Array.isArray(aiData.personalizedSafetyRecommendations)) {
        aiData.personalizedSafetyRecommendations.forEach(rec => {
          if (!safetyRecommendations.includes(rec)) {
            safetyRecommendations.push(rec);
          }
        });
      }
    } else {
      // Rule-based fallback summary when AI is not configured
      if (ruleFindings.matches.length > 0) {
        finalSummary = `Detected ${ruleFindings.matches.length} suspicious pattern${ruleFindings.matches.length > 1 ? 's' : ''} across ${ruleFindings.categoriesDetected.length} category/categories (${ruleFindings.categoriesDetected.join(', ')}).`;
      } else {
        finalSummary = 'No obvious scam patterns or high-risk keywords were detected by the rule engine. However, always exercise caution with unexpected messages.';
      }
    }

    // Default recommendation if none matched
    if (safetyRecommendations.length === 0) {
      safetyRecommendations.push('Never send money, OTPs, or confidential personal information in response to unsolicited messages.');
      safetyRecommendations.push('If unsure, verify the sender through their official website or verified customer care number.');
    }

    const aiData = geminiResult.available && geminiResult.data ? geminiResult.data : null;

    // Fulfill Requirement 2 & 7: Explainable Score Breakdown and Rationale
    const scoreBreakdown = {
      finalScore: finalRiskScore,
      riskLevel: finalRiskLevel,
      ruleScore: ruleFindings.score,
      aiScore: aiData ? aiData.aiRiskScore : null,
      rationale: aiData?.scoreRationale || (
        ruleFindings.matches.length > 0
          ? `This message received a risk score of ${finalRiskScore}/100 because it matched ${ruleFindings.matches.length} known deception indicator(s) across: ${ruleFindings.categoriesDetected.join(', ')}.`
          : `This message received a low risk score of ${finalRiskScore}/100 because no high-pressure urgency markers, credential requests, or payment demands were found.`
      ),
      contributingFactors: ruleFindings.matches.map(m => ({
        category: m.categoryLabel,
        phrase: m.phrase,
        weight: m.weight || 20,
        severity: m.severity
      }))
    };

    // Fulfill Requirement 1, 5, 8: Plain-English AI Explanation
    const aiExplanation = {
      scamType: aiData?.scamType || (ruleFindings.matches.length > 0 ? ruleFindings.matches[0].categoryLabel : 'Unverified Communication'),
      reason: aiData?.reasoning || (
        ruleFindings.matches.length > 0
          ? ruleFindings.matches[0].explanation
          : 'No malicious manipulation patterns or high-risk requests were identified in this text.'
      ),
      summary: finalSummary
    };

    // Fulfill Requirement 6 & 7: Categorized Warning Signs & Distinguish Evidence from Conclusions
    const categorizedWarningSigns = [];
    ruleFindings.matches.forEach((m, idx) => {
      let standardCategory = 'other';
      const cat = (m.category || '').toLowerCase();
      const lbl = (m.categoryLabel || '').toLowerCase();

      if (cat.includes('payment') || lbl.includes('payment') || lbl.includes('fee')) {
        standardCategory = 'urgent_payment';
      } else if (cat.includes('credentials') || cat.includes('otp') || lbl.includes('otp')) {
        standardCategory = 'otp_request';
      } else if (cat.includes('investment') || lbl.includes('reward') || lbl.includes('prize') || lbl.includes('job')) {
        standardCategory = 'unrealistic_rewards';
      } else if (cat.includes('urgency') || cat.includes('fear') || lbl.includes('threat') || lbl.includes('cutoff')) {
        standardCategory = 'threatening_language';
      } else if (cat.includes('link') || lbl.includes('link') || lbl.includes('domain')) {
        standardCategory = 'suspicious_links';
      } else if (cat.includes('personal') || lbl.includes('personal') || lbl.includes('identity')) {
        standardCategory = 'personal_info';
      }

      categorizedWarningSigns.push({
        id: `warn-rule-${idx}`,
        source: 'Factual Pattern Evidence',
        standardCategory,
        categoryLabel: m.categoryLabel,
        phrase: m.phrase,
        explanation: m.explanation,
        severity: m.severity || 'high',
        recommendation: m.recommendation
      });
    });

    if (aiData && Array.isArray(aiData.warningSigns)) {
      aiData.warningSigns.forEach((aiWarn, idx) => {
        const isDuplicate = categorizedWarningSigns.some(
          s => s.phrase && aiWarn.phraseOrClue && s.phrase.toLowerCase().includes(aiWarn.phraseOrClue.toLowerCase())
        );
        if (!isDuplicate) {
          categorizedWarningSigns.push({
            id: `warn-ai-${idx}`,
            source: 'AI Analytical Interpretation',
            standardCategory: aiWarn.category || 'other',
            categoryLabel: aiWarn.categoryLabel || 'Contextual Manipulation Cue',
            phrase: aiWarn.phraseOrClue,
            explanation: aiWarn.plainExplanation,
            severity: aiWarn.severity || 'medium',
            recommendation: 'Verify the identity of the sender independently.'
          });
        }
      });
    }

    return res.json({
      success: true,
      assessment: {
        riskScore: finalRiskScore,
        riskLevel: finalRiskLevel,
        summary: finalSummary,
        scoreBreakdown,
        aiExplanation,
        warningSigns: categorizedWarningSigns,
        ruleFindings: {
          score: ruleFindings.score,
          riskLevel: ruleFindings.riskLevel,
          totalMatches: ruleFindings.totalMatches,
          categoriesDetected: ruleFindings.categoriesDetected,
          matches: ruleFindings.matches,
          detectedUrls: ruleFindings.detectedUrls || [],
          detectedEmails: ruleFindings.detectedEmails || []
        },
        aiAnalysis: geminiResult,
        personalizedSafetyRecommendations: safetyRecommendations,
        disclaimer: 'Notice: ScamLens provides an automated risk assessment based on pattern detection and AI reasoning. This is an educational and advisory assessment, not legal or definitive proof that a message is fraudulent or safe. Always verify communications through official channels.'
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error.message || 'An unexpected error occurred while analyzing the message.'
    });
  }
}

/**
 * Handles POST /api/analyze-url
 */
function handleAnalyzeUrl(req, res) {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide a non-empty web address (URL) to analyze.'
      });
    }

    const assessment = analyzeUrl(url.trim());

    return res.json({
      success: true,
      assessment
    });
  } catch (error) {
    return res.status(400).json({
      error: 'Analysis failed',
      message: error.message || 'Could not analyze the provided URL. Please check the format.'
    });
  }
}

/**
 * Handles POST /api/analyze-email
 */
function handleAnalyzeEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide a non-empty email address or sender line to analyze.'
      });
    }

    const assessment = analyzeEmail(email.trim());

    return res.json({
      success: true,
      assessment
    });
  } catch (error) {
    return res.status(400).json({
      error: 'Analysis failed',
      message: error.message || 'Could not analyze the provided email. Please check the format.'
    });
  }
}

/**
 * Handles POST /api/chat or /api/assistant
 */
async function handleChat(req, res) {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide a non-empty question or message for the AI assistant.'
      });
    }

    if (message.length > 3000) {
      return res.status(400).json({
        error: 'Message too long',
        message: 'Please keep your question under 3000 characters.'
      });
    }

    const result = await chatWithAssistant(message.trim(), Array.isArray(history) ? history : []);
    return res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: 'Assistant Error',
      message: error.message || 'An error occurred while communicating with the AI Assistant.'
    });
  }
}

/**
 * Handles POST /api/analyze-screenshot
 */
async function handleAnalyzeScreenshot(req, res) {
  try {
    const { image, mimeType = 'image/png' } = req.body;

    if (!image || typeof image !== 'string' || image.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide a valid screenshot image in base64 format.'
      });
    }

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const cleanMime = mimeType.toLowerCase();
    if (!allowedMimeTypes.includes(cleanMime)) {
      return res.status(400).json({
        error: 'Unsupported image format',
        message: 'Please upload a PNG, JPG, or JPEG image.'
      });
    }

    // Strip prefix if present (e.g. data:image/png;base64,)
    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, '').trim();

    // Security check: Payload size limit (approx 6MB decoded)
    if (cleanBase64.length > 9000000) {
      return res.status(400).json({
        error: 'File too large',
        message: 'Screenshot exceeds maximum allowed size (5MB). Please upload a smaller image.'
      });
    }

    // Run multimodal Gemini Vision analysis
    const visionResult = await analyzeScreenshotWithGemini(cleanBase64, cleanMime === 'image/jpg' ? 'image/jpeg' : cleanMime);

    if (!visionResult.available) {
      return res.status(503).json({
        error: 'Vision AI Unavailable',
        message: visionResult.message,
        setupInstructions: visionResult.setupInstructions
      });
    }

    const aiData = visionResult.data || {};
    const extractedText = aiData.extractedText || '';

    // Run Rule Engine on extracted text as an additional heuristic verification layer
    const ruleFindings = extractedText ? runRuleBasedAnalysis(extractedText) : { matches: [], score: 0, categoriesDetected: [] };

    // Combine suspicious phrases
    const warningSigns = [];
    if (Array.isArray(aiData.suspiciousPhrases)) {
      aiData.suspiciousPhrases.forEach(sp => {
        warningSigns.push({
          phraseOrClue: sp.phrase,
          plainExplanation: sp.explanation,
          severity: sp.severity || 'high',
          recommendation: sp.recommendation
        });
      });
    } else if (Array.isArray(aiData.warningSigns)) {
      aiData.warningSigns.forEach(ws => warningSigns.push(ws));
    }

    // Incorporate rule matches if not already covered
    ruleFindings.matches.forEach(m => {
      const alreadyFlagged = warningSigns.some(ws => ws.phraseOrClue && ws.phraseOrClue.toLowerCase().includes(m.phrase.toLowerCase()));
      if (!alreadyFlagged) {
        warningSigns.push({
          phraseOrClue: m.phrase,
          plainExplanation: m.explanation,
          severity: m.severity || 'medium',
          recommendation: m.recommendation
        });
      }
    });

    const finalRiskScore = typeof aiData.riskScore === 'number'
      ? Math.min(100, Math.max(0, Math.round(aiData.riskScore)))
      : (ruleFindings.score > 0 ? ruleFindings.score : 20);

    let finalRiskLevel = aiData.riskLevel;
    if (!finalRiskLevel) {
      if (finalRiskScore >= 60) finalRiskLevel = 'High Risk';
      else if (finalRiskScore >= 25) finalRiskLevel = 'Moderate Risk';
      else finalRiskLevel = 'Low Risk';
    }

    return res.json({
      success: true,
      assessment: {
        extractedText,
        scamType: aiData.scamType || 'Screenshot Communication',
        riskScore: finalRiskScore,
        riskLevel: finalRiskLevel,
        summary: aiData.summary || 'Screenshot analysis completed.',
        warningSigns,
        visualClues: aiData.visualClues || [],
        safetyRecommendations: aiData.safetyRecommendations || [
          'Verify unexpected messages directly with the sender through an official phone call.',
          'Never share passwords, UPI PINs, or OTPs.',
          'Do not install remote assistance applications (AnyDesk, TeamViewer) from unverified requests.'
        ],
        ruleFindings,
        disclaimer: 'Notice: ScamLens Screenshot Analyzer utilizes optical character recognition and multimodal AI threat modeling. This educational assessment is advisory. Always independently verify suspicious communications before sharing funds or credentials.'
      }
    });
  } catch (error) {
    console.error('Screenshot analysis error:', error);
    return res.status(500).json({
      error: 'Screenshot Analysis Failed',
      message: error.message || 'Could not analyze screenshot. Please try another image.'
    });
  }
}

/**
 * Handles POST /api/translate
 * Translates and explains suspicious messages into Telugu, Hindi, Tamil, Kannada, or English.
 */
async function handleTranslateScam(req, res) {
  try {
    const { message, targetLanguage = 'te' } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A message string is required for translation.'
      });
    }

    const trimmed = message.trim();
    // Run rule engine pre-scan to preserve objective baseline risk evaluation
    const ruleFindings = runRuleBasedAnalysis(trimmed);

    const translationResult = await translateAndExplainScam(trimmed, targetLanguage, ruleFindings);

    const langInfo = SUPPORTED_LANGUAGES[targetLanguage] || SUPPORTED_LANGUAGES['en'];

    return res.json({
      success: true,
      originalMessage: trimmed,
      targetLanguage: langInfo.name,
      targetLanguageCode: targetLanguage,
      riskScore: ruleFindings.score,
      riskLevel: ruleFindings.riskLevel,
      translation: translationResult.data,
      source: translationResult.source
    });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({
      error: 'Translation Failed',
      message: error.message || 'An unexpected error occurred during translation.'
    });
  }
}

/**
 * Handles GET /api/status
 */
function handleStatus(req, res) {
  res.json({
    status: 'online',
    service: 'ScamLens API',
    version: '1.0.0',
    geminiConfigured: isGeminiConfigured()
  });
}

module.exports = {
  handleAnalyze,
  handleAnalyzeUrl,
  handleAnalyzeEmail,
  handleAnalyzeScreenshot,
  handleChat,
  handleTranslateScam,
  handleStatus
};
