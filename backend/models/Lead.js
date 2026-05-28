const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    tenantId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant',   required: true, index: true },

    name:  { type: String, default: 'Unknown' },
    phone: { type: String, required: true },

    leadOutcome: {
      type: String,
      enum: ['uncontacted', 'interested', 'not_interested', 'no_answer'],
      default: 'uncontacted',
      index: true,
    },

    // Populated from Vapi end-of-call-report
    vapiCallId: { type: String, default: null },
    callSummary: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent duplicate phone numbers within the same campaign
leadSchema.index({ campaignId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Lead', leadSchema);
