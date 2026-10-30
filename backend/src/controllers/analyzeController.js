/**
 * Controller for message analysis in ScamLens.
 * Coordinates rule-based pattern scanner with Gemini AI service.
 */

const { runRuleBasedAnalysis } = require('../services/ruleEngine');
const { analyzeWithGemini, isGeminiConfigured } = require('../services/geminiService');
const { analyzeUrl } = require('../services/urlEngine');
const { analyzeEmail } = require('../services/emailEngine');

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

    return res.json({
      success: true,
      assessment: {
        riskScore: finalRiskScore,
        riskLevel: finalRiskLevel,
        summary: finalSummary,
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
  handleStatus
};
