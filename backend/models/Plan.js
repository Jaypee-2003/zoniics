'use strict';

const mongoose = require('mongoose');

/**
 * Plan — subscription plan definitions managed exclusively by Super Admin.
 *
 * Business Admins see read-only plan details on their billing page.
 * Actual plan assignment on a Tenant happens via the superadmin API.
 */
const planSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ['starter', 'pro', 'enterprise'],
    },
    name:        { type: String, required: true },
    description: { type: String, default: '' },

    // Pricing
    priceMonthly: { type: Number, required: true }, // USD cents
    priceYearly:  { type: Number, required: true },

    // Rate limits
    requestsPerMinute:  { type: Number, default: 50 },
    messagesPerMonth:   { type: Number, default: 2000 },  // -1 = unlimited

    // Feature flags
    features: {
      inboundWhatsApp:    { type: Boolean, default: true },
      outboundWhatsApp:   { type: Boolean, default: false },
      inboundVoice:       { type: Boolean, default: false },
      outboundVoice:      { type: Boolean, default: false },
      csvColdCalling:     { type: Boolean, default: false },
      priorityQueue:      { type: Boolean, default: false },
      dedicatedWorker:    { type: Boolean, default: false },
      campaignDashboard:  { type: Boolean, default: false },
      crmIntegration:     { type: Boolean, default: false },
      analyticsAdvanced:  { type: Boolean, default: false },
      teamMembers:        { type: Boolean, default: false },
      customAiPersona:    { type: Boolean, default: false },
      voiceCloning:       { type: Boolean, default: false },
      whitelabel:         { type: Boolean, default: false },
    },

    isActive:   { type: Boolean, default: true },
    sortOrder:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
