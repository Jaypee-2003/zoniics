const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },

    // Auth fields
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // never returned by default

    tier: {
      type: String,
      enum: ['normal', 'pro', 'professional'],
      default: 'normal',
    },
    whatsappPhoneId: { type: String, trim: true },
    systemPrompt:    { type: String, default: 'You are a helpful AI assistant.' },
    openAiKey:       { type: String, trim: true },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tenant', tenantSchema);
