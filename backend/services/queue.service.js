const { Queue } = require('bullmq');
const { createRedisConnection } = require('./redis.service');

const TIER_PRIORITY = {
  professional: 1,
  pro: 2,
  normal: 3,
};

// Each Queue instance owns its own connection
const aiQueue = new Queue('ai-messages', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

async function enqueueAiJob(jobData, tier) {
  const priority = TIER_PRIORITY[tier] ?? TIER_PRIORITY.normal;
  return aiQueue.add('process-message', jobData, { priority });
}

module.exports = { aiQueue, enqueueAiJob };
