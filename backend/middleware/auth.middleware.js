'use strict';

/**
 * auth.middleware.js — JWT verification and Role-Based Access Control (RBAC).
 *
 * Architecture contract:
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │  authenticate        — verifies JWT; attaches req.user to request   │
 *  │  requireSuperAdmin   — authenticate + asserts role === 'super_admin' │
 *  │  requireTenantAdmin  — authenticate + asserts role === 'tenant_admin'│
 *  │                        + attaches req.tenantId (from signed token)   │
 *  │  signToken           — creates a signed JWT (used by auth controller)│
 *  └─────────────────────────────────────────────────────────────────────┘
 *
 * Security invariant — tenantId isolation:
 *   req.tenantId is ALWAYS read from the signed JWT payload, never from
 *   query parameters or the request body.  This makes it cryptographically
 *   impossible for a tenant_admin to access another tenant's data by
 *   supplying a different ID in the URL or body.
 */

const jwt = require('jsonwebtoken');

// Fail loudly at startup if the secret is absent; a missing secret means every
// forged token would be accepted, which is a critical security hole.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    '[auth.middleware] JWT_SECRET environment variable is not set. ' +
    'The server cannot start safely without a signing secret.'
  );
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * extractBearerToken(req)
 * Reads the raw token string from "Authorization: Bearer <token>".
 * Returns null for any malformed or absent header so callers can branch cleanly.
 *
 * @param   {import('express').Request} req
 * @returns {string|null}
 */
function extractBearerToken(req) {
  const header = req.headers['authorization'];
  if (typeof header !== 'string') return null;
  if (!header.startsWith('Bearer '))  return null;

  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * verifyToken(token)
 * Wraps jwt.verify in a synchronous try/catch and returns a discriminated union
 * so callers never need to catch exceptions.
 *
 * @param   {string} token
 * @returns {{ ok: true, payload: object } | { ok: false, expired: boolean }}
 */
function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { ok: true, payload };
  } catch (err) {
    return { ok: false, expired: err.name === 'TokenExpiredError' };
  }
}

// ─── Middleware: authenticate ─────────────────────────────────────────────────

/**
 * authenticate(req, res, next)
 *
 * Base layer — decodes and validates the JWT, then attaches the decoded payload
 * to `req.user`.  Does NOT enforce any role; compose with requireSuperAdmin or
 * requireTenantAdmin for role-gated routes.
 *
 * Attached payload shape:
 *   req.user = { userId, email, role, tenantId }
 *
 * @type {import('express').RequestHandler}
 */
function authenticate(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'No authentication token provided. Supply a Bearer token in the Authorization header.',
    });
  }

  const result = verifyToken(token);

  if (!result.ok) {
    if (result.expired) {
      return res.status(401).json({
        error: 'Authentication token has expired. Please sign in again to obtain a fresh token.',
      });
    }
    return res.status(401).json({
      error: 'Authentication token is invalid or has been tampered with.',
    });
  }

  req.user = result.payload; // { userId, email, role, tenantId }
  return next();
}

// ─── Middleware: requireSuperAdmin ────────────────────────────────────────────

/**
 * requireSuperAdmin(req, res, next)
 *
 * Composes authenticate → role assertion.
 * Blocks every request whose token role is NOT 'super_admin'.
 *
 * Protects routes that:
 *  - Read or write AgentProfile documents (system prompts)
 *  - Manage Tenant records (create, deactivate, adjust call limits)
 *  - Access cross-tenant analytics
 *
 * Usage:
 *   router.get('/admin/agent-profiles', requireSuperAdmin, listAgentProfilesHandler);
 *
 * @type {import('express').RequestHandler}
 */
function requireSuperAdmin(req, res, next) {
  authenticate(req, res, () => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Access denied. This endpoint requires Super Admin privileges.',
      });
    }
    return next();
  });
}

// ─── Middleware: requireTenantAdmin ───────────────────────────────────────────

/**
 * requireTenantAdmin(req, res, next)
 *
 * Composes authenticate → role assertion → tenantId extraction.
 * After this middleware runs, every downstream handler can safely read
 * `req.tenantId` and use it as the mandatory filter on every DB query.
 *
 * Why tenantId comes from the token (not the request):
 *   If tenantId were read from req.params or req.body a malicious tenant_admin
 *   could supply any ObjectId and access another tenant's data.  Reading it
 *   exclusively from the signed token removes that attack surface entirely.
 *
 * Usage:
 *   router.get('/customers', requireTenantAdmin, listCustomersHandler);
 *
 * @type {import('express').RequestHandler}
 */
function requireTenantAdmin(req, res, next) {
  authenticate(req, res, () => {
    if (req.user.role !== 'tenant_admin') {
      return res.status(403).json({
        error: 'Access denied. This endpoint requires Tenant Admin privileges.',
      });
    }

    // Guard against a structurally-valid but semantically-incomplete token.
    // A tenant_admin token must always carry a tenantId; if it does not, the
    // token was minted incorrectly and we refuse the request rather than
    // propagating an undefined tenantId into the database query layer.
    if (!req.user.tenantId) {
      return res.status(403).json({
        error: 'Token payload is missing tenantId. Please sign out and sign in again.',
      });
    }

    // Expose as a top-level property so downstream handlers don't need to
    // drill into req.user.
    req.tenantId = req.user.tenantId;

    return next();
  });
}

// ─── Helper: signToken ────────────────────────────────────────────────────────

/**
 * signToken(user)
 *
 * Creates a signed JWT from a User document (or plain object with the same
 * shape).  Kept in this module so all JWT logic — minting and verification —
 * lives in one place.
 *
 * Called by the auth controller immediately after a successful login or
 * registration.
 *
 * Token payload is intentionally minimal:
 *  - userId   — primary key for database lookups when needed.
 *  - email    — human-readable identity for logging.
 *  - role     — used by RBAC middleware; never derived server-side at request time.
 *  - tenantId — the isolation boundary for all tenant_admin DB queries.
 *
 * Sensitive fields (password hash, openAiKey, systemPrompt) are NEVER included.
 *
 * @param   {{ _id: any, email: string, role: string, tenantId?: any }} user
 * @returns {string} Signed JWT string.
 */
function signToken(user) {
  const payload = {
    userId:   user._id.toString(),
    email:    user.email,
    role:     user.role,
    tenantId: user.tenantId ? user.tenantId.toString() : null,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  authenticate,
  requireSuperAdmin,
  requireTenantAdmin,
  signToken,
};
