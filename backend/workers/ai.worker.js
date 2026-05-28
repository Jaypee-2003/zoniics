// Run as part of the main server process, or as a standalone process:
//   node workers/ai.worker.js
if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
  const mongoose = require('mongoose');
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Worker: MongoDB connected'))
    .catch((err) => { console.error(err.message); process.exit(1); });
}

const { Worker } = require('bullmq');
const axios = require('axios');
const OpenAI = require('openai');

const { createRedisConnection } = require('../services/redis.service');
const Tenant = require('../models/Tenant');
const Interaction = require('../models/Interaction');

const META_BASE = 'https://graph.facebook.com/v19.0';

const worker = new Worker(
  'ai-messages',
  async (job) => {
    const { tenantId, customerPhone, phoneNumberId, incomingText } = job.data;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const openai = new OpenAI({ apiKey: tenant.openAiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: tenant.systemPrompt },
        { role: 'user',   content: incomingText },
      ],
      max_tokens: 1024,
    });

    const aiReply = completion.choices[0]?.message?.content?.trim();
    if (!aiReply) throw new Error('OpenAI returned an empty response');

    await Interaction.create({
      tenantId,
      customerPhone,
      channel: 'whatsapp',
      role: 'ai',
      message: aiReply,
    });

    await axios.post(
      `${META_BASE}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: customerPhone,
        type: 'text',
        text: { body: aiReply },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[Job ${job.id}] Replied to ${customerPhone} (tenant: ${tenantId})`);
  },
  {
    connection: createRedisConnection(),
    concurrency: 10,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[Job ${job?.id}] Failed (attempt ${job?.attemptsMade}):`, err.message);
});

module.exports = worker;
