'use strict';

/**
 * superadmin.controller.js
 *
 * All routes here are protected by requireSuperAdmin middleware.
 * Business data is intentionally scoped — super admins see aggregated
 * platform metrics and tenant records, NOT individual customer messages.
 *
 * Mounted at: /api/superadmin
 */

const express    = require('express');
const bcrypt     = require('bcryptjs');
const mongoose   = require('mongoose');
const Tenant     = require('../models/Tenant');
const SuperAdmin = require('../models/SuperAdmin');
const Plan       = require('../models/Plan');
const Interaction = require('../models/Interaction');
const { requireSuperAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Every route in this controller requires super_admin role.
router.use(requireSuperAdmin);

// ─── Platform Overview ────────────────────────────────────────────────────────

router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay   = new Date(); startOfDay.setHours(0, 0, 0, 0);

    const [
      totalBusinesses,
      activeBusinesses,
      suspendedBusinesses,
      trialBusinesses,
      newThisMonth,
      totalInteractions,
      interactionsToday,
      planBreakdown,
    ] = await Promise.all([
      Tenant.countDocuments({ role: 'tenant_admin' }),
      Tenant.countDocuments({ role: 'tenant_admin', status: 'active' }),
      Tenant.countDocuments({ role: 'tenant_admin', status: 'suspended' }),
      Tenant.countDocuments({ role: 'tenant_admin', status: 'trial' }),
      Tenant.countDocuments({ role: 'tenant_admin', createdAt: { $gte: startOfMonth } }),
      Interaction.countDocuments({}),
      Interaction.countDocuments({ createdAt: { $gte: startOfDay } }),
      Tenant.aggregate([
        { $match: { role: 'tenant_admin' } },
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      businesses: { total: totalBusinesses, active: activeBusinesses, suspended: suspendedBusinesses, trial: trialBusinesses, newThisMonth },
      interactions: { total: totalInteractions, today: interactionsToday },
      planBreakdown: planBreakdown.reduce((acc, { _id, count }) => ({ ...acc, [_id || 'unknown']: count }), {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Business Management ──────────────────────────────────────────────────────

// GET /api/superadmin/businesses?page=1&limit=20&status=active&search=
router.get('/businesses', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, plan } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const filter = { role: 'tenant_admin' };
    if (status) filter.status = status;
    if (plan)   filter.plan   = plan;
    if (search) filter.$or = [
      { businessName: { $regex: search, $options: 'i' } },
      { email:        { $regex: search, $options: 'i' } },
    ];

    const [businesses, total] = await Promise.all([
      Tenant.find(filter)
        .select('-password -openAiKey')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Tenant.countDocuments(filter),
    ]);

    res.json({ businesses, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/superadmin/businesses/:id
router.get('/businesses/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ _id: req.params.id, role: 'tenant_admin' })
      .select('-password -openAiKey')
      .lean();
    if (!tenant) return res.status(404).json({ error: 'Business not found' });

    const [interactionCount, staffCount] = await Promise.all([
      Interaction.countDocuments({ tenantId: tenant._id }),
      Tenant.countDocuments({ parentTenantId: tenant._id, role: 'staff' }),
    ]);

    res.json({ ...tenant, _meta: { interactionCount, staffCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/superadmin/businesses/:id/status
router.patch('/businesses/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['active', 'suspended', 'pending', 'trial'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    const updates = { status };
    if (status === 'suspended') updates.isActive = false;
    if (status === 'active')    updates.isActive = true;

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).select('-password -openAiKey');

    if (!tenant) return res.status(404).json({ error: 'Business not found' });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/superadmin/businesses/:id/plan
router.patch('/businesses/:id/plan', async (req, res) => {
  try {
    const { plan, planExpiresAt } = req.body;
    const allowed = ['starter', 'pro', 'enterprise'];
    if (!allowed.includes(plan)) {
      return res.status(400).json({ error: `plan must be one of: ${allowed.join(', ')}` });
    }
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { $set: { plan, status: 'active', planExpiresAt: planExpiresAt || null } },
      { new: true }
    ).select('-password -openAiKey');

    if (!tenant) return res.status(404).json({ error: 'Business not found' });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/superadmin/businesses/:id  — hard delete (use with caution)
router.delete('/businesses/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findOneAndDelete({ _id: req.params.id, role: 'tenant_admin' });
    if (!tenant) return res.status(404).json({ error: 'Business not found' });
    // Cascade: delete staff accounts
    await Tenant.deleteMany({ parentTenantId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Plan Management ──────────────────────────────────────────────────────────

router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find().sort({ sortOrder: 1 }).lean();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/plans/:slug', async (req, res) => {
  try {
    const plan = await Plan.findOneAndUpdate(
      { slug: req.params.slug },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(plan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Platform Analytics ───────────────────────────────────────────────────────

// GET /api/superadmin/analytics?days=30
router.get('/analytics', async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [signupsByDay, interactionsByDay] = await Promise.all([
      Tenant.aggregate([
        { $match: { role: 'tenant_admin', createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Interaction.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({ signupsByDay, interactionsByDay, days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI & Platform Settings ───────────────────────────────────────────────────
// These are stub endpoints — in production they'd read/write a Settings collection.

router.get('/settings', async (req, res) => {
  res.json({
    defaultSystemPrompt:   'You are a helpful AI assistant.',
    maxCallDurationSeconds: 300,
    defaultVoice:          'Female — English (Natural)',
    globalRateLimit:       1000,
    maintenanceMode:       false,
    platformVersion:       '1.0.0',
  });
});

router.put('/settings', async (req, res) => {
  // In production: persist to a Settings model
  res.json({ ok: true, updated: req.body });
});

// ─── Security / Audit Log ─────────────────────────────────────────────────────

router.get('/audit', async (req, res) => {
  try {
    // Return recent super admin logins as a proxy for audit events
    const admins = await SuperAdmin.find()
      .select('name email lastLoginAt lastLoginIp')
      .lean();
    res.json({ admins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
