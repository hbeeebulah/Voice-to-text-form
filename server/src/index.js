const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const formRoutes = require('./routes/formRoutes');
const transcribeRoutes = require('./routes/transcribeRoutes');
const authRoutes = require('./routes/authRoutes');
const voiceAiService = require('./services/voiceAiService');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client (Vite dev server usually runs on 5173 or 3000)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase JSON body payload size limit to accommodate base64 audio recordings
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Health & System Status check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: voiceAiService.isConfigured(),
    aiModel: 'neural-voice-engine'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/transcribe', transcribeRoutes);

// Serve static frontend assets if built
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Catch-all fallback for client-side SPA routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(clientDistPath, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` VoxForm AI Studio Backend Server`);
  console.log(` Listening on: http://localhost:${PORT}`);
  console.log(` Voice AI status: ${voiceAiService.isConfigured() ? 'Active (API Key loaded)' : 'Browser Engine Mode'}`);
  console.log(`===============================================`);
});
