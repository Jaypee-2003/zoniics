'use strict';

const express    = require('express');
const bcrypt     = require('bcryptjs');
const Tenant     = require('../models/Tenant');
const SuperAdmin = require('../models/SuperAdmin');
const { signToken, authenticate, requireTenantAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tenantProfile(t) {
  return {
    _id:          t._id,
    businessName: t.businessName,
    email:        t.email,
    role:         t.role,
    status:       t.status,
    plan:         t.plan,
    tier:         t.tier,
    trialEndsAt:  t.trialEndsAt,
    planExpiresAt:t.planExpiresAt,
    isActive:     t.isActive,
    staffPermissions: t.staffPermissions,
  };
}

function superAdminProfile(sa) {
  return {
    _id:   sa._id,
    name:  sa.name,
    email: sa.email,
    role:  sa.role,
  };
}

// ─── Business: Register ───────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { businessName, email, password, plan } = req.body;

    if (!businessName || !email || !password) {
      return res.status(400).json({ error: 'businessName, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const exists = await Tenant.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: 'An account with this email already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const tenant = await Tenant.create({
      businessName,
      email,
      password: hashed,
      role:   'tenant_admin',
      status: 'trial',
      plan:   plan || 'starter',
    });

    const token = signToken({
      _id:      tenant._id,
      email:    tenant.email,
      role:     'tenant_admin',
      tenantId: tenant._id,
    });

    res.status(201).json({ token, tenant: tenantProfile(tenant) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Business: Login ──────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const tenant = await Tenant.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!tenant) return res.status(401).json({ error: 'Invalid email or password' });

    if (tenant.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }
    if (!tenant.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const valid = await bcrypt.compare(password, tenant.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Staff accounts carry their parent's tenantId as the isolation boundary
    const effectiveTenantId = tenant.role === 'staff' && tenant.parentTenantId
      ? tenant.parentTenantId
      : tenant._id;

    const token = signToken({
      _id:      tenant._id,
      email:    tenant.email,
      role:     tenant.role,         // 'tenant_admin' or 'staff'
      tenantId: effectiveTenantId,
    });

    res.json({ token, tenant: tenantProfile(tenant) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Business: Me ─────────────────────────────────────────────────────────────

router.get('/me', authenticate, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.userId);
    if (!tenant) return res.status(404).json({ error: 'Account not found' });
    res.json(tenantProfile(tenant));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Super Admin: Login ───────────────────────────────────────────────────────

router.post('/superadmin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await SuperAdmin.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    if (!admin.isActive) return res.status(403).json({ error: 'Account is deactivated' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await SuperAdmin.findByIdAndUpdate(admin._id, {
      lastLoginAt: new Date(),
      lastLoginIp: req.ip,
    });

    const token = signToken({
      _id:      admin._id,
      email:    admin.email,
      role:     'super_admin',
      tenantId: null,
    });

    res.json({ token, admin: superAdminProfile(admin) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Super Admin: Me ──────────────────────────────────────────────────────────

router.get('/superadmin/me', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const admin = await SuperAdmin.findById(req.user.userId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json(superAdminProfile(admin));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
