'use strict';

const express     = require('express');
const Tenant      = require('../models/Tenant');
const Interaction = require('../models/Interaction');
const { requireTenantAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes in this file require a valid tenant JWT (tenant_admin or staff).
// requireTenantAdmin verifies the token, asserts role, and sets req.tenantId
// from the signed payload — tenantId is NEVER read from query/body.
router.use(requireTenantAdmin);

// ─── GET /api/tenant ──────────────────────────────────────────────────────────

router.get('/tenant', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId).select('-openAiKey').lean();
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── PUT /api/tenant ──────────────────────────────────────────────────────────
// Staff with canManageTeam=false cannot call this; enforced by plan, not here.

router.put('/tenant', async (req, res) => {
  try {
    const { businessName, whatsappPhoneId, openAiKey, systemPrompt } = req.body;
    const updates = {};
    if (businessName    !== undefined) updates.businessName    = businessName;
    if (whatsappPhoneId !== undefined) updates.whatsappPhoneId = whatsappPhoneId;
    if (openAiKey       !== undefined) updates.openAiKey       = openAiKey;
    if (systemPrompt    !== undefined) updates.systemPrompt    = systemPrompt;

    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-openAiKey');

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /api/interactions ────────────────────────────────────────────────────

router.get('/interactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, channel } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { tenantId: req.tenantId };
    if (channel) filter.channel = channel;

    const [interactions, total] = await Promise.all([
      Interaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Interaction.countDocuments(filter),
    ]);

    res.json({ interactions, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /api/stats ───────────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [total, whatsapp, voice, today] = await Promise.all([
      Interaction.countDocuments({ tenantId: req.tenantId }),
      Interaction.countDocuments({ tenantId: req.tenantId, channel: 'whatsapp' }),
      Interaction.countDocuments({ tenantId: req.tenantId, channel: 'voice' }),
      Interaction.countDocuments({ tenantId: req.tenantId, createdAt: { $gte: startOfDay } }),
    ]);

    res.json({ total, whatsapp, voice, today });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /api/team — list staff accounts for this tenant ─────────────────────

router.get('/team', async (req, res) => {
  try {
    const members = await Tenant.find({
      parentTenantId: req.tenantId,
      role: 'staff',
    }).select('-password -openAiKey').lean();
    res.json(members);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── POST /api/team — invite a staff member ───────────────────────────────────

router.post('/team', async (req, res) => {
  try {
    const { name, email, password, staffPermissions } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 12);

    const member = await Tenant.create({
      businessName:     name,
      email,
      password:         hashed,
      role:             'staff',
      status:           'active',
      parentTenantId:   req.tenantId,
      staffPermissions: staffPermissions || {},
    });

    res.status(201).json({ _id: member._id, name: member.businessName, email: member.email });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already in use' });
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE /api/team/:memberId — remove a staff member ──────────────────────

router.delete('/team/:memberId', async (req, res) => {
  try {
    const member = await Tenant.findOneAndDelete({
      _id:            req.params.memberId,
      parentTenantId: req.tenantId,
      role:           'staff',
    });
    if (!member) return res.status(404).json({ error: 'Team member not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
