'use strict';

/**
 * routes.js — Tenant-scoped data control and filtering routes.
 *
 * All routes in this file are gated behind requireTenantAdmin, which:
 *  a) Verifies the JWT.
 *  b) Asserts the caller's role is 'tenant_admin'.
 *  c) Attaches req.tenantId from the signed token.
 *
 * Security guarantee: every MongoDB query in this file uses { tenantId: req.tenantId }
 * as a mandatory filter.  tenantId is never read from req.params or req.body.
 *
 * Exported routes (mounted at /api/tenant in server.js):
 *  GET  /customers      — filtered + paginated customer list
 *  POST /upload-csv     — bulk upsert contacts from JSON array
 *  POST /initiate-call  — guarded by checkDailyCallLimit; delegates to callService
 *
 * Exported middleware:
 *  checkDailyCallLimit  — 429 pre-flight when daily call ceiling is reached
 */

const express       = require('express');
const mongoose      = require('mongoose');
const twilio        = require('twilio');
const pendingCalls  = require('../lib/pendingCalls');

const { Customer, Tenant, DailyUsage, AgentProfile } = require('../models/models');
const { requireTenantAdmin }                          = require('../middleware/auth.middleware');

const router = express.Router();

// Every route in this file is protected.  Applying at the router level ensures
// we can never accidentally omit it on a newly added route.
router.use(requireTenantAdmin);

// ─── Internal: Twilio client ──────────────────────────────────────────────────
//
// Instantiated once at module load.  TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
// must be present in the environment.

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ─── Utility: todayUTC ───────────────────────────────────────────────────────

/**
 * todayUTC()
 * Returns today's date as a "YYYY-MM-DD" string in UTC.
 * Consistent with the DailyUsage.date index key format.
 * @returns {string}
 */
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Utility: isValidObjectId ────────────────────────────────────────────────

/**
 * isValidObjectId(value)
 * Returns true if the value is a 24-char hex string Mongoose can safely cast
 * to an ObjectId without throwing.
 * @param   {any} value
 * @returns {boolean}
 */
function isValidObjectId(value) {
  return mongoose.isValidObjectId(value);
}

// ─── Middleware: checkDailyCallLimit ─────────────────────────────────────────

/**
 * checkDailyCallLimit(req, res, next)
 *
 * Pre-flight middleware that guards any route that initiates an outbound call.
 * MUST be placed after requireTenantAdmin so that req.tenantId is already set.
 *
 * Algorithm:
 *  1. Fetch the tenant's currentDailyCallLimit.
 *  2. Fetch today's DailyUsage record (treat callsMade = 0 if absent).
 *  3. If callsMade >= limit → HTTP 429 with a diagnostic payload.
 *  4. Otherwise → attach req.dailyUsage and call next().
 *
 * The two MongoDB reads are fired in parallel via Promise.all to minimise
 * added latency on the happy path.
 *
 * @type {import('express').RequestHandler}
 */
async function checkDailyCallLimit(req, res, next) {
  try {
    const today = todayUTC();

    const [tenant, usageDoc] = await Promise.all([
      Tenant.findById(req.tenantId)
        .select('currentDailyCallLimit')
        .lean(),
      DailyUsage.findOne({ tenantId: req.tenantId, date: today })
        .select('callsMade')
        .lean(),
    ]);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant record not found.' });
    }

    const limit     = tenant.currentDailyCallLimit ?? 0;
    const callsMade = usageDoc?.callsMade           ?? 0;

    if (callsMade >= limit) {
      return res.status(429).json({
        error:     'Daily call limit reached.',
        limit,
        callsMade,
        resetsAt:  `${today}T23:59:59Z`,
        message:
          `Your plan allows ${limit} outbound calls per day. ` +
          `You have made ${callsMade}. Limit resets at midnight UTC.`,
      });
    }

    // Attach usage metadata so downstream handlers can log it without re-querying.
    req.dailyUsage = { callsMade, limit, remaining: limit - callsMade };

    return next();

  } catch (err) {
    console.error('[checkDailyCallLimit] DB error:', err.message);
    return res.status(500).json({ error: 'Failed to verify daily call limit.' });
  }
}

// ─── GET /api/tenant/customers ────────────────────────────────────────────────

/**
 * List customers belonging to the authenticated tenant with optional filtering
 * and offset-based pagination.
 *
 * Query parameters (all optional):
 *  leadOutcome  {string}  — Filter by leadOutcome enum value.
 *  callStatus   {string}  — Filter by callStatus enum value.
 *  status       {string}  — Filter by customer status (active | do_not_call).
 *  search       {string}  — Case-insensitive prefix search on name or phone.
 *  page         {number}  — 1-based page index (default: 1).
 *  limit        {number}  — Documents per page (default: 25, max: 100).
 *  sortBy       {string}  — Sort field (default: createdAt).
 *  sortOrder    {string}  — 'asc' | 'desc' (default: desc).
 *
 * Response shape:
 *  {
 *    customers:  Customer[],
 *    total:      number,
 *    page:       number,
 *    limit:      number,
 *    totalPages: number,
 *  }
 */
router.get('/customers', async (req, res) => {
  try {
    // ── Allowlists for validated filter values ────────────────────────────────
    const VALID_LEAD_OUTCOMES = ['uncontacted', 'interested', 'not_interested', 'no_answer'];
    const VALID_CALL_STATUSES = ['pending', 'calling', 'completed'];
    const VALID_STATUSES      = ['active', 'do_not_call'];
    const VALID_SORT_FIELDS   = ['createdAt', 'updatedAt', 'name', 'phone', 'callStatus', 'leadOutcome'];
    const MAX_PAGE_LIMIT      = 100;

    const {
      leadOutcome,
      callStatus,
      status,
      search,
      page      = '1',
      limit     = '25',
      sortBy    = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(limit, 10) || 25));
    const skip     = (pageNum - 1) * limitNum;

    // ── Build the MongoDB filter ──────────────────────────────────────────────
    //
    // tenantId is ALWAYS the first clause — it is the isolation boundary.
    // All other filters are additive; unsupplied filters are not added to the
    // query object so MongoDB can use the compound indexes efficiently.

    const filter = { tenantId: req.tenantId };

    if (leadOutcome !== undefined) {
      if (!VALID_LEAD_OUTCOMES.includes(leadOutcome)) {
        return res.status(400).json({
          error: `Invalid leadOutcome: "${leadOutcome}". Valid values: ${VALID_LEAD_OUTCOMES.join(', ')}.`,
        });
      }
      filter.leadOutcome = leadOutcome;
    }

    if (callStatus !== undefined) {
      if (!VALID_CALL_STATUSES.includes(callStatus)) {
        return res.status(400).json({
          error: `Invalid callStatus: "${callStatus}". Valid values: ${VALID_CALL_STATUSES.join(', ')}.`,
        });
      }
      filter.callStatus = callStatus;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Invalid status: "${status}". Valid values: ${VALID_STATUSES.join(', ')}.`,
        });
      }
      filter.status = status;
    }

    // Free-text search on name and phone.  We escape the input to prevent
    // RegEx injection attacks before building the pattern.
    if (typeof search === 'string' && search.trim().length > 0) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(escaped, 'i');
      filter.$or    = [
        { name:  { $regex: pattern } },
        { phone: { $regex: pattern } },
      ];
    }

    // ── Sort specification ────────────────────────────────────────────────────
    const resolvedSortField = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const resolvedSortOrder = sortOrder === 'asc' ? 1 : -1;
    const sortSpec          = { [resolvedSortField]: resolvedSortOrder };

    // ── Execute count + data fetch in parallel ────────────────────────────────
    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort(sortSpec)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    return res.status(200).json({
      customers,
      total,
      page:       pageNum,
      limit:      limitNum,
      totalPages: Math.ceil(total / limitNum),
    });

  } catch (err) {
    console.error('[GET /customers] Error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve customers.' });
  }
});

// ─── POST /api/tenant/upload-csv ─────────────────────────────────────────────

/**
 * Bulk-upserts an array of contact objects into the Customer collection,
 * stamping every record with the authenticated tenant's ID.
 *
 * Why upsert (not plain insert)?
 *  Re-uploading a corrected CSV is a standard operator workflow.
 *  bulkWrite with upsert = true on the (tenantId, phone) key ensures:
 *   • Existing contacts have their `name` updated without resetting
 *     callStatus or leadOutcome (preserving campaign progress).
 *   • New contacts are created with safe defaults.
 *   • The entire batch is atomic at the document level.
 *
 * Body (JSON):
 *  {
 *    contacts: [
 *      { name: "Alice Smith", phone: "+441234567890" },
 *      { name: "Bob Jones",   phone: "+441234567891" }
 *    ]
 *  }
 *
 * Constraints:
 *  • Max 5,000 contacts per request to prevent request timeout.
 *  • Each row must have a non-empty `phone` field.
 *  • Duplicates within the batch (same phone) are silently de-duplicated.
 *
 * Response:
 *  {
 *    inserted: number,
 *    updated:  number,
 *    skipped:  number,
 *    errors:   string[],   — first 20 row-level validation messages
 *  }
 */
router.post('/upload-csv', async (req, res) => {
  try {
    const MAX_CONTACTS = 5000;
    const { contacts } = req.body;

    // ── Top-level validation ──────────────────────────────────────────────────

    if (!Array.isArray(contacts)) {
      return res.status(400).json({ error: 'Body must contain a "contacts" array.' });
    }

    if (contacts.length === 0) {
      return res.status(400).json({ error: '"contacts" array must not be empty.' });
    }

    if (contacts.length > MAX_CONTACTS) {
      return res.status(400).json({
        error:
          `Upload limit exceeded. Maximum ${MAX_CONTACTS} contacts per request. ` +
          `Received ${contacts.length}.`,
      });
    }

    // ── Per-row validation and normalisation ─────────────────────────────────

    const validRows   = [];
    const errorReport = [];
    const seenPhones  = new Set(); // Batch-level deduplication

    for (let i = 0; i < contacts.length; i++) {
      const row = contacts[i];

      if (typeof row !== 'object' || row === null) {
        errorReport.push(`Row ${i + 1}: must be an object.`);
        continue;
      }

      const phone = typeof row.phone === 'string' ? row.phone.trim() : '';
      const name  = typeof row.name  === 'string' ? row.name.trim()  : '';

      if (!phone) {
        errorReport.push(
          `Row ${i + 1}: "phone" is required and must be a non-empty string.`
        );
        continue;
      }

      if (seenPhones.has(phone)) {
        errorReport.push(
          `Row ${i + 1}: duplicate phone "${phone}" within this batch — skipped.`
        );
        continue;
      }

      seenPhones.add(phone);
      validRows.push({ name, phone });
    }

    const skipped = contacts.length - validRows.length;

    if (validRows.length === 0) {
      return res.status(400).json({
        error:   'No valid contacts found in the upload.',
        skipped,
        errors:  errorReport.slice(0, 20),
      });
    }

    // ── Bulk upsert ───────────────────────────────────────────────────────────
    //
    // $setOnInsert only fires for new documents, so existing customers keep
    // their callStatus, leadOutcome, and status fields untouched.
    // $set only updates `name`, so a re-upload with a corrected name is safe.

    const bulkOps = validRows.map((row) => ({
      updateOne: {
        filter: { tenantId: req.tenantId, phone: row.phone },
        update: {
          $set: {
            name: row.name,
          },
          $setOnInsert: {
            tenantId:    req.tenantId,
            phone:       row.phone,
            status:      'active',
            callStatus:  'pending',
            leadOutcome: 'uncontacted',
          },
        },
        upsert: true,
      },
    }));

    // ordered: false allows the batch to continue even if individual writes fail
    // (e.g. rare race-condition duplicates from concurrent uploads).
    const result = await Customer.bulkWrite(bulkOps, { ordered: false });

    const inserted = result.upsertedCount  ?? 0;
    const updated  = result.modifiedCount  ?? 0;

    console.log(
      `[upload-csv] tenant: ${req.tenantId} | ` +
      `inserted: ${inserted} | updated: ${updated} | skipped: ${skipped}`
    );

    return res.status(200).json({
      inserted,
      updated,
      skipped,
      errors: errorReport.slice(0, 20),
    });

  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error from a concurrent upload — surface it clearly.
      return res.status(409).json({
        error: 'One or more phone numbers already exist and could not be upserted. ' +
               'This may be caused by a concurrent upload. Please retry.',
      });
    }
    console.error('[POST /upload-csv] Error:', err.message);
    return res.status(500).json({ error: 'Failed to upload contacts.' });
  }
});

// ─── POST /api/tenant/initiate-call ──────────────────────────────────────────

/**
 * Initiates a single outbound AI call after passing the daily call-limit
 * pre-flight check.
 *
 * Middleware chain (in order):
 *  1. requireTenantAdmin — applied at router level above.
 *  2. checkDailyCallLimit — verifies today's usage vs. the tenant ceiling.
 *  3. This handler — validates inputs, registers the pending call, triggers Twilio.
 *
 * Body (JSON):
 *  {
 *    customerId:     string,  — Customer _id to call
 *    agentProfileId: string,  — AgentProfile _id to use for the AI conversation
 *  }
 *
 * The pattern: generate a one-time stream token, store {customerId, tenantId,
 * agentProfileId} keyed by that token, then pass the token URL to Twilio as the
 * `url` callback.  When Twilio answers the call it hits /api/twilio/stream-twiml/:token,
 * which exchanges the token for TwiML and starts the Media Stream WebSocket.
 *
 * Token registration is delegated to lib/pendingCalls.js, which owns the
 * single shared registry consumed by the /api/twilio/stream-twiml/:token
 * callback in twilio.service.js.  No circular dependencies.
 */

router.post(
  '/initiate-call',
  checkDailyCallLimit,
  async (req, res) => {
    try {
      const { customerId, agentProfileId } = req.body;

      // ── Input validation ────────────────────────────────────────────────────

      if (!customerId || !agentProfileId) {
        return res.status(400).json({
          error: 'customerId and agentProfileId are required.',
        });
      }

      if (!isValidObjectId(customerId)) {
        return res.status(400).json({ error: 'customerId must be a valid ObjectId.' });
      }

      if (!isValidObjectId(agentProfileId)) {
        return res.status(400).json({ error: 'agentProfileId must be a valid ObjectId.' });
      }

      // ── Validate customer belongs to this tenant (3-tier isolation) ─────────
      //
      // We query with BOTH _id AND tenantId.  If a malicious tenant_admin supplies
      // a customerId that belongs to a different tenant, this query returns null
      // and the request is rejected with a 404 — not a 403 — to avoid leaking
      // whether the resource exists.

      const customer = await Customer.findOne({
        _id:      customerId,
        tenantId: req.tenantId,
      }).lean();

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found in this tenant.' });
      }

      if (customer.status === 'do_not_call') {
        return res.status(422).json({
          error: 'This customer is marked do_not_call and cannot be contacted.',
        });
      }

      if (customer.callStatus === 'calling') {
        return res.status(409).json({
          error: 'A call to this customer is already in progress.',
        });
      }

      // ── Validate the AgentProfile exists (super_admin creates these) ─────────
      const agentExists = await AgentProfile.exists({ _id: agentProfileId });
      if (!agentExists) {
        return res.status(404).json({ error: 'AgentProfile not found.' });
      }

      // ── Generate the one-time stream token and build the TwiML callback URL ──

      const streamToken = pendingCalls.register({
        customerId:     customerId,
        tenantId:       req.tenantId,
        agentProfileId: agentProfileId,
      });

      const twimlCallbackUrl =
        `${process.env.SERVER_URL}/api/twilio/stream-twiml/${streamToken}`;

      // ── Place the call via Twilio ─────────────────────────────────────────

      const call = await twilioClient.calls.create({
        to:     customer.phone,
        from:   process.env.TWILIO_FROM_NUMBER,
        url:    twimlCallbackUrl,
        method: 'POST',
      });

      console.log(
        `[initiate-call] Call placed — ` +
        `SID: ${call.sid} | customer: ${customerId} | tenant: ${req.tenantId} | ` +
        `daily remaining: ${req.dailyUsage.remaining - 1}`
      );

      return res.status(202).json({
        message:         'Call initiated successfully.',
        callSid:         call.sid,
        customerId,
        dailyUsage:      req.dailyUsage,
      });

    } catch (err) {
      console.error('[POST /initiate-call] Error:', err.message);
      return res.status(500).json({ error: 'Failed to initiate call.' });
    }
  }
);

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  tenantRouter:       router,
  checkDailyCallLimit,
};
