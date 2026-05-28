const express  = require('express');
const Tenant      = require('../models/Tenant');
const Interaction = require('../models/Interaction');
const auth        = require('../middleware/auth.middleware');

const router = express.Router();

// Every route in this file requires a valid JWT.
router.use(auth);

// ---------------------------------------------------------------------------
// GET /api/tenant  — own profile (no openAiKey returned)
// ---------------------------------------------------------------------------
router.get('/tenant', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId).select('-openAiKey').lean();
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/tenant  — update own editable fields
// ---------------------------------------------------------------------------
router.put('/tenant', async (req, res) => {
  try {
    const { businessName, whatsappPhoneId, openAiKey, systemPrompt } = req.body;
    const updates = {};
    if (businessName !== undefined)    updates.businessName    = businessName;
    if (whatsappPhoneId !== undefined) updates.whatsappPhoneId = whatsappPhoneId;
    if (openAiKey !== undefined)       updates.openAiKey       = openAiKey;
    if (systemPrompt !== undefined)    updates.systemPrompt    = systemPrompt;

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

// ---------------------------------------------------------------------------
// GET /api/interactions?page=1&limit=20
// ---------------------------------------------------------------------------
router.get('/interactions', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [interactions, total] = await Promise.all([
      Interaction.find({ tenantId: req.tenantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Interaction.countDocuments({ tenantId: req.tenantId }),
    ]);

    res.json({ interactions, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/stats
// ---------------------------------------------------------------------------
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

module.exports = router;
