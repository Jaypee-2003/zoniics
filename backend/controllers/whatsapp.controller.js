const express = require('express');

const Tenant = require('../models/Tenant');
const Interaction = require('../models/Interaction');
const { enqueueAiJob } = require('../services/queue.service');
const { webhookRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /webhook  — Meta verification handshake
// ---------------------------------------------------------------------------
router.get('/', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// ---------------------------------------------------------------------------
// POST /webhook  — Incoming messages from Meta
// webhookRateLimiter runs first:
//   - resolves req.tenant from whatsappPhoneId
//   - returns 429 if tenant exceeds their tier's token bucket
// ---------------------------------------------------------------------------
router.post('/', webhookRateLimiter, async (req, res) => {
  // Always ACK Meta before any async work — they retry if they don't get 200
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    const changes = body.entry?.[0]?.changes?.[0]?.value;
    if (!changes) return;

    const message = changes.messages?.[0];
    if (!message || message.type !== 'text') return;

    const phoneNumberId = changes.metadata?.phone_number_id;
    const customerPhone = message.from;
    const incomingText  = message.text?.body?.trim();
    if (!phoneNumberId || !customerPhone || !incomingText) return;

    // Reuse tenant resolved by the rate limiter (avoids a second DB hit)
    const tenant =
      req.tenant ??
      (await Tenant.findOne({ whatsappPhoneId: phoneNumberId, isActive: true }).lean());

    if (!tenant) {
      console.warn(`No active tenant for phoneNumberId: ${phoneNumberId}`);
      return;
    }

    // 1. Save the user's message immediately
    await Interaction.create({
      tenantId: tenant._id,
      customerPhone,
      channel: 'whatsapp',
      role: 'user',
      message: incomingText,
    });

    // 2. Push AI processing to the priority queue
    await enqueueAiJob(
      { tenantId: tenant._id.toString(), customerPhone, phoneNumberId, incomingText },
      tenant.tier
    );

    console.log(
      `[${tenant.businessName}] Job queued for ${customerPhone} (tier: ${tenant.tier})`
    );
  } catch (err) {
    console.error('Webhook handler error:', err.message);
  }
});

module.exports = router;
