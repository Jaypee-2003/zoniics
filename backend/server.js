require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const whatsappRouter  = require('./controllers/whatsapp.controller');
const voiceRouter     = require('./controllers/voice.controller');
const apiRouter       = require('./routes/api.routes');
const campaignRouter  = require('./controllers/campaign.controller');
const authRouter      = require('./controllers/auth.controller');
// Workers — run in same process in dev; separate processes in production
require('./workers/ai.worker');
require('./workers/dialer.worker');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Zoniics AI' });
});

// Auth (public — no JWT required)
app.use('/api/auth', authRouter);

// Protected dashboard API (JWT required — enforced inside each router)
app.use('/api', apiRouter);
app.use('/api/campaigns', campaignRouter);

// Vapi voice webhook (must be before /webhook to avoid prefix collision)
app.use('/webhook/vapi', voiceRouter);

// WhatsApp webhook
app.use('/webhook', whatsappRouter);

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }
}

start();
