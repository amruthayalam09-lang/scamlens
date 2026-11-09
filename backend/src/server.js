const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/analyze');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check root
app.get('/', (req, res) => {
  res.json({
    name: 'ScamLens API Server',
    status: 'Running',
    endpoints: {
      status: 'GET /api/status',
      analyze: 'POST /api/analyze',
      analyzeUrl: 'POST /api/analyze-url',
      analyzeEmail: 'POST /api/analyze-email'
    }
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`[ScamLens] Backend server running on http://localhost:${PORT}`);
  console.log(`[ScamLens] Gemini AI Status: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing API Key (Rule-based only)'}`);
});
