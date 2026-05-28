'use strict';

require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');

const whatsappRouter    = require('./controllers/whatsapp.controller');
const voiceRouter       = require('./controllers/voice.controller');
const apiRouter         = require('./routes/api.routes');
const campaignRouter    = require('./controllers/campaign.controller');
const authRouter        = require('./controllers/auth.controller');
const superAdminRouter  = require('./controllers/superadmin.controller');

// Workers — inline in dev, separate processes in production
require('./workers/ai.worker');
require('./workers/dialer.worker');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'Zoniics AI' }));

// ─── Public auth routes ───────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Protected business dashboard API ─────────────────────────────────────────
app.use('/api', apiRouter);
app.use('/api/campaigns', campaignRouter);

// ─── Super Admin API (requires super_admin JWT) ───────────────────────────────
app.use('/api/superadmin', superAdminRouter);

// ─── Webhooks ─────────────────────────────────────────────────────────────────
app.use('/webhook/vapi', voiceRouter);
app.use('/webhook', whatsappRouter);

// ─── Startup ──────────────────────────────────────────────────────────────────
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    await seedSuperAdmin();
    await seedPlans();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
    );
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }
}

// ─── Seed: Super Admin ────────────────────────────────────────────────────────
async function seedSuperAdmin() {
  const SuperAdmin = require('./models/SuperAdmin');
  const email      = process.env.SUPER_ADMIN_EMAIL    || 'admin@zoniics.ai';
  const password   = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2025!';
  const name       = process.env.SUPER_ADMIN_NAME     || 'Platform Admin';

  const exists = await SuperAdmin.findOne({ email });
  if (!exists) {
    const hashed = await bcrypt.hash(password, 12);
    await SuperAdmin.create({ name, email, password: hashed });
    console.log(`[seed] Super admin created → ${email}`);
  }
}

// ─── Seed: Plans ──────────────────────────────────────────────────────────────
async function seedPlans() {
  const Plan    = require('./models/Plan');
  const PLANS = [
    {
      slug: 'starter', name: 'Starter', sortOrder: 1,
      description: 'Perfect for small businesses just getting started.',
      priceMonthly: 2900, priceYearly: 27900,
      requestsPerMinute: 50, messagesPerMonth: 2000,
      features: {
        inboundWhatsApp: true, outboundWhatsApp: false,
        inboundVoice: false, outboundVoice: false,
        csvColdCalling: false, priorityQueue: false,
        dedicatedWorker: false, campaignDashboard: false,
        crmIntegration: false, analyticsAdvanced: false,
        teamMembers: false, customAiPersona: false,
        voiceCloning: false, whitelabel: false,
      },
    },
    {
      slug: 'pro', name: 'Pro', sortOrder: 2,
      description: 'For growing teams that need full omnichannel power.',
      priceMonthly: 7900, priceYearly: 75900,
      requestsPerMinute: 200, messagesPerMonth: 20000,
      features: {
        inboundWhatsApp: true, outboundWhatsApp: true,
        inboundVoice: true, outboundVoice: false,
        csvColdCalling: false, priorityQueue: true,
        dedicatedWorker: false, campaignDashboard: true,
        crmIntegration: true, analyticsAdvanced: true,
        teamMembers: true, customAiPersona: false,
        voiceCloning: false, whitelabel: false,
      },
    },
    {
      slug: 'enterprise', name: 'Enterprise', sortOrder: 3,
      description: 'Full power for high-volume, mission-critical teams.',
      priceMonthly: 19900, priceYearly: 191900,
      requestsPerMinute: 1000, messagesPerMonth: -1,
      features: {
        inboundWhatsApp: true, outboundWhatsApp: true,
        inboundVoice: true, outboundVoice: true,
        csvColdCalling: true, priorityQueue: true,
        dedicatedWorker: true, campaignDashboard: true,
        crmIntegration: true, analyticsAdvanced: true,
        teamMembers: true, customAiPersona: true,
        voiceCloning: true, whitelabel: true,
      },
    },
  ];

  for (const p of PLANS) {
    await Plan.findOneAndUpdate({ slug: p.slug }, p, { upsert: true });
  }
  console.log('[seed] Plans seeded');
}

start();
