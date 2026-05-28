const mongoose = require('mongoose');

const staffPermissionsSchema = new mongoose.Schema(
  {
    canManageCalls:      { type: Boolean, default: true },
    canManageWhatsApp:   { type: Boolean, default: true },
    canManageCRM:        { type: Boolean, default: true },
    canManageCampaigns:  { type: Boolean, default: false },
    canViewAnalytics:    { type: Boolean, default: true },
    canManageTeam:       { type: Boolean, default: false },
    canManageBilling:    { type: Boolean, default: false },
    canManageAutomation: { type: Boolean, default: false },
  },
  { _id: false }
);

const tenantSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },

    // Auth
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },

    // Role — tenant_admin is the business owner; staff are sub-accounts
    role: {
      type: String,
      enum: ['tenant_admin', 'staff'],
      default: 'tenant_admin',
      index: true,
    },

    // Account status — controlled by Super Admin
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending', 'trial'],
      default: 'trial',
      index: true,
    },

    // Subscription plan (matches Plan.slug)
    plan: {
      type: String,
      enum: ['starter', 'pro', 'enterprise'],
      default: 'starter',
    },
    planExpiresAt: { type: Date, default: null },
    trialEndsAt:   { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },

    // Staff hierarchy — staff accounts point to their parent tenant
    parentTenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
    staffPermissions: { type: staffPermissionsSchema, default: () => ({}) },

    // Legacy / channel config (tenant_admin only)
    tier: {
      type: String,
      enum: ['normal', 'pro', 'professional'],
      default: 'normal',
    },
    whatsappPhoneId: { type: String, trim: true },
    systemPrompt:    { type: String, default: 'You are a helpful AI assistant.' },
    openAiKey:       { type: String, trim: true, select: false },

    // Kept for backwards compat with older middleware
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtual: effective tenantId for staff is parentTenantId; for admins it's their own _id
tenantSchema.virtual('effectiveTenantId').get(function () {
  return this.role === 'staff' && this.parentTenantId
    ? this.parentTenantId
    : this._id;
});

module.exports = mongoose.model('Tenant', tenantSchema);
