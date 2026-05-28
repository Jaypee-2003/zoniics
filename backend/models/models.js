'use strict';

/**
 * models.js — Canonical Mongoose schema definitions for Zoniics AI.
 *
 * Separation-of-concerns rules enforced here:
 *  • Tenant    — pure business entity.  No auth credentials, no API keys.
 *  • User      — authentication entity.  Role drives RBAC; tenantId links to Tenant.
 *  • Customer  — per-tenant lead/contact record managed by the platform.
 *  • Interaction — immutable log of every message exchanged (WhatsApp or Voice).
 *  • DailyUsage  — rate-limiting counters, one document per tenant per calendar day.
 *  • AgentProfile — AI persona/prompt config.  ONLY the Super Admin may write to this
 *                   collection; tenant admins never see raw prompts or OpenAI keys.
 */

const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');

const { Schema, model } = mongoose;

// ─── 1. Tenant ────────────────────────────────────────────────────────────────
//
// Represents a paying business (B2B customer).  Contains only business metadata
// and platform limits — deliberately no API keys, no system prompts.

const TenantSchema = new Schema(
  {
    businessName: {
      type:     String,
      required: [true, 'Business name is required'],
      trim:     true,
    },

    tier: {
      type:    String,
      enum:    ['normal', 'pro', 'professional'],
      default: 'normal',
    },

    isActive: {
      type:    Boolean,
      default: true,
      index:   true,
    },

    // The Super Admin sets this ceiling; tenant admins cannot change it.
    currentDailyCallLimit: {
      type:    Number,
      default: 50,
      min:     [0, 'Daily call limit cannot be negative'],
    },
  },
  { timestamps: true }
);

const Tenant = model('Tenant', TenantSchema);

// ─── 2. User ──────────────────────────────────────────────────────────────────
//
// Authentication identity.  A 'super_admin' user has tenantId = null and can
// administer the entire platform.  A 'tenant_admin' user is bound to exactly
// one Tenant document.

const UserSchema = new Schema(
  {
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },

    // Stored as a bcrypt hash; `select: false` ensures it is never returned in
    // ordinary queries — callers must explicitly add `.select('+password')`.
    password: {
      type:     String,
      required: [true, 'Password is required'],
      select:   false,
    },

    role: {
      type:    String,
      enum:    ['super_admin', 'tenant_admin'],
      default: 'tenant_admin',
    },

    // Null for super_admin; required for tenant_admin (enforced at application layer).
    tenantId: {
      type:    Schema.Types.ObjectId,
      ref:     'Tenant',
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for fast auth lookups and tenant-scoped user queries.
UserSchema.index({ email: 1 });
UserSchema.index({ tenantId: 1 });

// Pre-save hook: hash the password only when it has been modified.
UserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt   = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

/**
 * comparePassword(candidate)
 * Safe timing-resistant comparison used by the login controller.
 * @param   {string}  candidate — plaintext password from the request body.
 * @returns {Promise<boolean>}
 */
UserSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = model('User', UserSchema);

// ─── 3. Customer ─────────────────────────────────────────────────────────────
//
// A contact record owned by a specific Tenant.  Drives the outbound calling
// pipeline: records are queued as 'pending', transition to 'calling' while a
// Twilio call is live, and settle as 'completed' with a leadOutcome set.

const CustomerSchema = new Schema(
  {
    tenantId: {
      type:     Schema.Types.ObjectId,
      ref:      'Tenant',
      required: [true, 'tenantId is required on every Customer document'],
    },

    name: {
      type:    String,
      trim:    true,
      default: '',
    },

    // E.164 recommended; enforced at the application layer.
    phone: {
      type:     String,
      required: [true, 'Phone number is required'],
      trim:     true,
    },

    // Tenant admins can flag a contact as do_not_call; the dialer respects this.
    status: {
      type:    String,
      enum:    ['active', 'do_not_call'],
      default: 'active',
    },

    // Lifecycle state driven by the Twilio calling worker.
    callStatus: {
      type:    String,
      enum:    ['pending', 'calling', 'completed'],
      default: 'pending',
    },

    // Outcome written at the end of every AI-conducted call.
    leadOutcome: {
      type:    String,
      enum:    ['uncontacted', 'interested', 'not_interested', 'no_answer'],
      default: 'uncontacted',
    },
  },
  { timestamps: true }
);

// All dashboard filters are tenant-scoped — these compound indexes cover the
// most common query predicates without a full-collection scan.
CustomerSchema.index({ tenantId: 1, leadOutcome: 1 });
CustomerSchema.index({ tenantId: 1, callStatus:  1 });
CustomerSchema.index({ tenantId: 1, status:      1 });

// A phone number must be unique within a tenant (not globally unique).
CustomerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

const Customer = model('Customer', CustomerSchema);

// ─── 4. Interaction ───────────────────────────────────────────────────────────
//
// Append-only log of every message in a conversation.  Never deleted; used for
// analytics, audit trails, and AI context windows.

const InteractionSchema = new Schema(
  {
    tenantId: {
      type:     Schema.Types.ObjectId,
      ref:      'Tenant',
      required: true,
    },

    customerId: {
      type:     Schema.Types.ObjectId,
      ref:      'Customer',
      required: true,
    },

    channel: {
      type:     String,
      enum:     ['whatsapp', 'voice'],
      required: true,
    },

    // 'user' = message originated from the customer; 'ai' = platform response.
    role: {
      type:     String,
      enum:     ['user', 'ai'],
      required: true,
    },

    message: {
      type:     String,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt is the canonical sort key for chat log pagination.
  }
);

InteractionSchema.index({ tenantId: 1, createdAt:  -1 }); // Log page — DESC sort
InteractionSchema.index({ tenantId: 1, customerId:  1 }); // Per-contact history
InteractionSchema.index({ tenantId: 1, channel:     1 }); // Channel-split analytics

const Interaction = model('Interaction', InteractionSchema);

// ─── 5. DailyUsage ────────────────────────────────────────────────────────────
//
// One document per tenant per calendar day.  Used by the pre-flight call-limit
// middleware to enforce `currentDailyCallLimit` without a full Interaction scan.
// Both counters are incremented atomically via `$inc` in the calling/messaging
// workers to avoid read-modify-write races.

const DailyUsageSchema = new Schema(
  {
    tenantId: {
      type:     Schema.Types.ObjectId,
      ref:      'Tenant',
      required: true,
    },

    // Stored as "YYYY-MM-DD" string to sidestep timezone drift that can occur
    // when comparing Date objects across server restarts or DST changes.
    date: {
      type:     String,
      required: true,
      match:    [/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'],
    },

    callsMade: {
      type:    Number,
      default: 0,
      min:     0,
    },

    whatsappSent: {
      type:    Number,
      default: 0,
      min:     0,
    },
  },
  { timestamps: true }
);

// The unique compound index both prevents duplicate documents and doubles as
// the look-up key used by the rate-limit middleware (no extra index needed).
DailyUsageSchema.index({ tenantId: 1, date: 1 }, { unique: true });

const DailyUsage = model('DailyUsage', DailyUsageSchema);

// ─── 6. AgentProfile ─────────────────────────────────────────────────────────
//
// AI persona definitions — managed EXCLUSIVELY by the Super Admin.
// Tenant admins are never permitted to read raw system prompts; they only
// reference a profile by its _id when launching a campaign.

const AgentProfileSchema = new Schema(
  {
    // Human-readable label shown to the Super Admin in the admin panel.
    profileName: {
      type:     String,
      required: [true, 'Profile name is required'],
      unique:   true,
      trim:     true,
    },

    // The OpenAI system prompt that defines the AI's voice, tone, and behaviour.
    // This field MUST NEVER be exposed via any tenant-admin-accessible API route.
    systemPrompt: {
      type:     String,
      required: [true, 'System prompt is required'],
    },
  },
  { timestamps: true }
);

AgentProfileSchema.index({ profileName: 1 });

const AgentProfile = model('AgentProfile', AgentProfileSchema);

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  Tenant,
  User,
  Customer,
  Interaction,
  DailyUsage,
  AgentProfile,
};
