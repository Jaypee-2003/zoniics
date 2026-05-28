if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
  const mongoose = require('mongoose');
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Dialer worker: MongoDB connected'))
    .catch(err => { console.error(err.message); process.exit(1); });
}

const { Worker } = require('bullmq');
const axios = require('axios');

const { createRedisConnection } = require('../services/redis.service');
const Campaign = require('../models/Campaign');
const Lead     = require('../models/Lead');
const Tenant   = require('../models/Tenant');

const VAPI_BASE = 'https://api.vapi.ai';

// Replace {{name}}, {{phone}} etc. in the template
function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

const worker = new Worker(
  'outbound-dialer',
  async (job) => {
    const { leadId, campaignId } = job.data;

    const [lead, campaign] = await Promise.all([
      Lead.findById(leadId),
      Campaign.findById(campaignId),
    ]);

    if (!lead)     throw new Error(`Lead ${leadId} not found`);
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
    if (lead.leadOutcome !== 'uncontacted') {
      console.log(`[Dialer] Lead ${leadId} already contacted — skipping`);
      return;
    }

    const tenant = await Tenant.findById(campaign.tenantId);
    if (!tenant) throw new Error(`Tenant ${campaign.tenantId} not found`);

    const systemPrompt = renderTemplate(campaign.systemPromptTemplate, {
      name:  lead.name,
      phone: lead.phone,
    });

    // Trigger outbound call via Vapi REST API
    const { data: vapiCall } = await axios.post(
      `${VAPI_BASE}/call/phone`,
      {
        phoneNumberId: campaign.vapiPhoneNumberId,
        customer: {
          number: lead.phone,
          name:   lead.name,
        },
        // Pass leadId in metadata so the end-of-call-report can resolve it
        metadata: { leadId: lead._id.toString(), campaignId: campaign._id.toString() },
        assistant: {
          name: campaign.name,
          model: {
            provider: 'openai',
            model:    'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }],
            maxTokens: 512,
            temperature: 0.7,
          },
          voice: {
            provider: 'playht',
            voiceId:  'jennifer',
          },
          transcriber: {
            provider: 'deepgram',
            model:    'nova-2',
            language: 'en-US',
          },
          firstMessage: `Hi, may I speak with ${lead.name}? This is an automated call from ${tenant.businessName}.`,
          silenceTimeoutSeconds: 20,
          maxDurationSeconds:    300,

          // ── Vapi analysisPlan ──────────────────────────────────────────────
          // Vapi runs this after the call to extract structured data, which
          // arrives in the end-of-call-report webhook under message.analysis.
          analysisPlan: {
            structuredDataPrompt:
              'Analyze the call. Determine: (1) outcome — was the person interested, not_interested, or did they not answer / hang up immediately? (2) summary — one sentence describing what was discussed.',
            structuredDataSchema: {
              type: 'object',
              properties: {
                outcome: {
                  type: 'string',
                  enum: ['interested', 'not_interested', 'no_answer'],
                  description: 'Call outcome from the lead\'s perspective',
                },
                summary: {
                  type: 'string',
                  description: 'One-sentence summary of the call',
                },
              },
              required: ['outcome', 'summary'],
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Store the Vapi call ID on the lead for tracking
    await Lead.findByIdAndUpdate(leadId, { vapiCallId: vapiCall.id });

    console.log(`[Dialer] Call initiated for lead ${leadId} → Vapi call ${vapiCall.id}`);
  },
  {
    connection: createRedisConnection(),
    concurrency: 5,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[Dialer] Job ${job?.id} failed:`, err.message);
});

module.exports = worker;
