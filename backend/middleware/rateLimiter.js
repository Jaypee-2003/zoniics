const Tenant = require('../models/Tenant');
const { redisClient } = require('../services/redis.service');

const TIER_LIMITS = {
  professional: 1000,
  pro: 200,
  normal: 50,
};

// Atomic token-bucket via Lua — reads, refills, and consumes in one round-trip.
// Returns 1 (allowed) or 0 (rate-limited).
const TOKEN_BUCKET_LUA = `
local key      = KEYS[1]
local capacity = tonumber(ARGV[1])
local rate     = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])

local data   = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts     = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  ts     = now
end

local elapsed = math.max(0, now - ts)
tokens = math.min(capacity, tokens + elapsed * rate)

if tokens >= 1 then
  tokens = tokens - 1
  redis.call('HMSET', key, 'tokens', tokens, 'ts', now)
  redis.call('EXPIRE', key, 120)
  return 1
end

redis.call('HMSET', key, 'tokens', tokens, 'ts', now)
redis.call('EXPIRE', key, 120)
return 0
`;

// Resolves the tenant from the WhatsApp webhook payload and performs rate
// limiting before the job is queued.  We attach the resolved tenant to
// req.tenant so the controller can reuse it without a second DB round-trip.
async function webhookRateLimiter(req, res, next) {
  try {
    const phoneNumberId =
      req.body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

    if (!phoneNumberId) return next();

    const tenant = await Tenant.findOne(
      { whatsappPhoneId: phoneNumberId, isActive: true },
      '_id tier businessName'
    ).lean();

    if (!tenant) return next();

    req.tenant = tenant;

    const capacity   = TIER_LIMITS[tenant.tier] ?? TIER_LIMITS.normal;
    const refillRate = capacity / 60;            // tokens replenished per second
    const now        = Date.now() / 1000;         // seconds (float)
    const key        = `ratelimit:${tenant._id}`;

    const allowed = await redisClient.eval(
      TOKEN_BUCKET_LUA,
      1,
      key,
      capacity,
      refillRate,
      now
    );

    if (allowed !== 1) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        tier: tenant.tier,
        limit: `${capacity} requests/min`,
      });
    }

    next();
  } catch (err) {
    // Fail open — a Redis blip should never block a webhook
    console.error('Rate limiter error:', err.message);
    next();
  }
}

module.exports = { webhookRateLimiter, TIER_LIMITS };
