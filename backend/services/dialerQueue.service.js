const { Queue } = require('bullmq');
const { createRedisConnection } = require('./redis.service');

const dialerQueue = new Queue('outbound-dialer', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
});

async function enqueueDialerJob(data) {
  return dialerQueue.add('dial-lead', data);
}

module.exports = { dialerQueue, enqueueDialerJob };
