const express = require('express');

const Tenant      = require('../models/Tenant');
const Interaction = require('../models/Interaction');
const Lead        = require('../models/Lead');

const router = express.Router();

// ---------------------------------------------------------------------------
// POST /webhook/vapi
//
// Handles three Vapi event types:
//   • assistant-request     — inbound call starting; return assistant config
//   • end-of-call-report    — call ended:
//       - outbound campaign call → update Lead outcome from analysisPlan data
//       - inbound call           → save transcript to Interaction collection
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const messageType = req.body?.message?.type;

  if (messageType === 'assistant-request')  return handleAssistantRequest(req, res);
  if (messageType === 'end-of-call-report') return handleEndOfCallReport(req, res);

  res.sendStatus(200);
});

// ---------------------------------------------------------------------------
// assistant-request — inbound call config
// ---------------------------------------------------------------------------
async function handleAssistantRequest(req, res) {
  const { tenantId } = req.query;
  if (!tenantId) return res.status(400).json({ error: 'tenantId query param is required' });

  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant || !tenant.isActive) return res.status(404).json({ error: 'Tenant not found or inactive' });

  return res.json({
    assistant: {
      name: tenant.businessName,
      model: {
        provider: 'openai',
        model:    'gpt-4o-mini',
        messages: [{ role: 'system', content: tenant.systemPrompt }],
        maxTokens: 1024,
        temperature: 0.7,
      },
      voice:       { provider: 'playht', voiceId: 'jennifer' },
      transcriber: { provider: 'deepgram', model: 'nova-2', language: 'en-US' },
      firstMessage: `Hello! Thank you for calling ${tenant.businessName}. How can I help you today?`,
      endCallMessage: 'Thank you for calling. Have a great day!',
      silenceTimeoutSeconds: 30,
      maxDurationSeconds:    1800,
    },
  });
}

// ---------------------------------------------------------------------------
// end-of-call-report — diverges on whether it's outbound (has leadId in
// call.metadata) or inbound (save transcript to Interaction)
// ---------------------------------------------------------------------------
async function handleEndOfCallReport(req, res) {
  res.sendStatus(200); // ACK Vapi immediately

  try {
    const payload  = req.body.message;
    const metadata = payload?.call?.metadata || {};

    if (metadata.leadId) {
      await handleOutboundCallReport(payload, metadata);
    } else {
      await handleInboundCallReport(req, payload);
    }
  } catch (err) {
    console.error('end-of-call-report error:', err.message);
  }
}

// Outbound: extract structured outcome from analysisPlan and update the Lead
async function handleOutboundCallReport(payload, metadata) {
  const { leadId } = metadata;
  const endedReason = payload?.endedReason || '';

  // Vapi's endedReason covers unanswered calls before the assistant even speaks
  const noAnswerReasons = ['customer-did-not-pick-up', 'voicemail', 'no-answer'];
  const callSummary = payload?.analysis?.structuredData?.summary || '';

  let outcome = payload?.analysis?.structuredData?.outcome || null;

  if (!outcome || noAnswerReasons.includes(endedReason)) {
    outcome = 'no_answer';
  }

  // Map any unexpected values to 'no_answer' for safety
  const validOutcomes = ['interested', 'not_interested', 'no_answer'];
  if (!validOutcomes.includes(outcome)) outcome = 'no_answer';

  await Lead.findByIdAndUpdate(leadId, {
    leadOutcome: outcome,
    callSummary,
  });

  console.log(`[Voice] Outbound lead ${leadId} → ${outcome}`);
}

// Inbound: save each transcript turn as an Interaction record
async function handleInboundCallReport(req, payload) {
  const { tenantId } = req.query;
  const customerPhone = payload?.call?.customer?.number || 'unknown';
  const messages      = payload?.messages || [];

  if (!tenantId || !messages.length) return;

  const interactions = messages
    .filter(m => m.role === 'user' || m.role === 'bot' || m.role === 'assistant')
    .map(m => ({
      tenantId,
      customerPhone,
      channel:   'voice',
      role:      m.role === 'user' ? 'user' : 'ai',
      message:   (m.message || m.content || '').trim(),
      createdAt: m.time ? new Date(m.time * 1000) : new Date(),
    }))
    .filter(i => i.message.length > 0);

  if (interactions.length) {
    await Interaction.insertMany(interactions, { ordered: false });
    console.log(`[Voice] Inbound: saved ${interactions.length} turns for tenant ${tenantId}`);
  }
}

module.exports = router;
