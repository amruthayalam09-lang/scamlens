module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.json({
    name: 'ScamLens API Serverless',
    status: 'Running',
    platform: 'Vercel Serverless Functions',
    endpoints: {
      status: 'GET /api/status',
      analyze: 'POST /api/analyze',
      analyzeUrl: 'POST /api/analyze-url',
      analyzeEmail: 'POST /api/analyze-email'
    }
  });
};

