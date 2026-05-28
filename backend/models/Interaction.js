const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'voice'],
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'ai'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

interactionSchema.index({ tenantId: 1, customerPhone: 1, createdAt: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);
