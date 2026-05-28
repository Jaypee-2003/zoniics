const Redis = require('ioredis');

// BullMQ requires maxRetriesPerRequest: null on every connection it touches.
// We create a factory so Queue, Worker, and the app each get their own
// connection — BullMQ uses blocking commands (BLPOP) that would stall a
// shared connection for other callers.
function createRedisConnection() {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  client.on('error', (err) => console.error('Redis error:', err.message));
  return client;
}

// Dedicated client for non-BullMQ work (rate limiting, caching, etc.)
const redisClient = createRedisConnection();

module.exports = { createRedisConnection, redisClient };
