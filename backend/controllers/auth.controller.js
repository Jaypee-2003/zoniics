const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const Tenant   = require('../models/Tenant');

const router = express.Router();

function signToken(tenantId) {
  return jwt.sign({ tenantId: tenantId.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function safeProfile(tenant) {
  return {
    _id:          tenant._id,
    businessName: tenant.businessName,
    email:        tenant.email,
    tier:         tenant.tier,
    isActive:     tenant.isActive,
  };
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { businessName, email, password, tier } = req.body;

    if (!businessName || !email || !password) {
      return res.status(400).json({ error: 'businessName, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const exists = await Tenant.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: 'An account with this email already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const tenant = await Tenant.create({ businessName, email, password: hashed, tier });

    const token = signToken(tenant._id);
    res.status(201).json({ token, tenant: safeProfile(tenant) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Explicitly select password (select: false on schema)
    const tenant = await Tenant.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!tenant) return res.status(401).json({ error: 'Invalid email or password' });

    if (!tenant.isActive) return res.status(403).json({ error: 'Account is deactivated' });

    const valid = await bcrypt.compare(password, tenant.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(tenant._id);
    res.json({ token, tenant: safeProfile(tenant) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me  — verify token and return current tenant profile
// ---------------------------------------------------------------------------
router.get('/me', require('../middleware/auth.middleware'), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(safeProfile(tenant));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
