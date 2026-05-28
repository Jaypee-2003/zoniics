const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name:     { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    // Vapi phone number ID used to make outbound calls for this campaign
    vapiPhoneNumberId: { type: String, required: true },

    // Template for the AI system prompt. Use {{name}} and {{phone}} as placeholders.
    systemPromptTemplate: {
      type: String,
      required: true,
      default: 'You are a friendly sales agent calling {{name}}. Be concise and professional.',
    },

    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campaign', campaignSchema);
