'use strict';

const mongoose = require('mongoose');

/**
 * SuperAdmin — platform owner accounts.
 *
 * Completely separate from Tenant. Super admins cannot see business data
 * by default; they only access platform-level management APIs.
 *
 * Initial seeding: run `node backend/seed.js` which reads
 * SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD from .env.
 */
const superAdminSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },

    role: { type: String, default: 'super_admin', immutable: true },

    isActive: { type: Boolean, default: true },

    // Audit: last platform access
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SuperAdmin', superAdminSchema);
