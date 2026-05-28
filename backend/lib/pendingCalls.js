'use strict';

/**
 * lib/pendingCalls.js — Singleton pending-call token registry.
 *
 * Owns the Map that bridges two parts of the telephony pipeline:
 *
 *   routes.js           — writes a token when POST /initiate-call is accepted
 *   twilio.service.js   — reads+deletes the token when Twilio hits the TwiML callback
 *
 * Keeping the registry in a dedicated module prevents the circular-dependency
 * that would result from either service importing the other, and makes it
 * trivial to swap the backing store (e.g. Redis SETEX for multi-process deploys)
 * in one place.
 *
 * In a multi-process / multi-instance deployment:
 *   Replace the in-process Map with a Redis client:
 *     register  → SET token JSON EX <ttlSeconds>
 *     consume   → GETDEL token (Redis ≥ 6.2) or GET + DEL in a MULTI block
 */

const crypto = require('crypto');

const TTL_MS = 5 * 60 * 1000; // 5 minutes — enough for Twilio to answer a call

/**
 * @typedef {Object} PendingCallEntry
 * @property {string} customerId
 * @property {string} tenantId
 * @property {string} agentProfileId
 * @property {number} expiresAt  — Unix ms timestamp after which the token is invalid
 */

/** @type {Map<string, PendingCallEntry>} */
const registry = new Map();

/**
 * register(data)
 *
 * Stores call metadata under a cryptographically random token and schedules
 * automatic eviction after TTL_MS.
 *
 * @param {{ customerId: string, tenantId: string, agentProfileId: string }} data
 * @returns {string} opaque token
 */
function register(data) {
  const token = crypto.randomBytes(24).toString('hex');

  registry.set(token, {
    customerId:     data.customerId,
    tenantId:       data.tenantId,
    agentProfileId: data.agentProfileId,
    expiresAt:      Date.now() + TTL_MS,
  });

  // Auto-evict after TTL so the Map never grows unbounded on a long-running process.
  setTimeout(() => registry.delete(token), TTL_MS);

  return token;
}

/**
 * consume(token)
 *
 * Retrieves and atomically removes the entry for the given token.
 * Returns null if the token is absent or has expired.
 *
 * "Consume" is intentional — each token is single-use.  Replaying the same
 * token (e.g. via a retry attack) yields null after the first call.
 *
 * @param   {string} token
 * @returns {PendingCallEntry | null}
 */
function consume(token) {
  const entry = registry.get(token);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    registry.delete(token);
    return null;
  }

  registry.delete(token);
  return entry;
}

module.exports = { register, consume };
