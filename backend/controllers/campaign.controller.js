const express  = require('express');
const multer   = require('multer');
const csv      = require('csv-parser');
const { Readable } = require('stream');

const Campaign = require('../models/Campaign');
const Lead     = require('../models/Lead');
const auth     = require('../middleware/auth.middleware');
const { enqueueDialerJob } = require('../services/dialerQueue.service');

const router = express.Router();

// All campaign routes require a valid JWT
router.use(auth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = file.mimetype === 'text/csv'
      || file.mimetype === 'application/vnd.ms-excel'
      || file.originalname.toLowerCase().endsWith('.csv');
    cb(ok ? null : new Error('Only CSV files are accepted'), ok);
  },
});

function parseCSVBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream
      .pipe(csv())
      .on('data', row => {
        const phone = (row.phone || row.Phone || row['Phone Number'] || row['phone_number'] || '').trim();
        const name  = (row.name  || row.Name  || row['Full Name']   || row['full_name']   || 'Unknown').trim();
        if (phone) rows.push({ phone, name });
      })
      .on('end',   () => resolve(rows))
      .on('error', reject);
  });
}

// Guard: ensure a campaign exists AND belongs to the authenticated tenant
async function ownedCampaign(campaignId, tenantId) {
  const campaign = await Campaign.findOne({ _id: campaignId, tenantId });
  return campaign; // null if not found or not owned
}

// ---------------------------------------------------------------------------
// POST /api/campaigns
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { name, description, vapiPhoneNumberId, systemPromptTemplate } = req.body;
    if (!name || !vapiPhoneNumberId || !systemPromptTemplate) {
      return res.status(400).json({ error: 'name, vapiPhoneNumberId, and systemPromptTemplate are required' });
    }
    const campaign = await Campaign.create({
      tenantId: req.tenantId, name, description, vapiPhoneNumberId, systemPromptTemplate,
    });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/campaigns  — own campaigns with lead stats
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }).lean();

    const withStats = await Promise.all(
      campaigns.map(async c => {
        const [total, interested, not_interested, no_answer, uncontacted] = await Promise.all([
          Lead.countDocuments({ campaignId: c._id }),
          Lead.countDocuments({ campaignId: c._id, leadOutcome: 'interested' }),
          Lead.countDocuments({ campaignId: c._id, leadOutcome: 'not_interested' }),
          Lead.countDocuments({ campaignId: c._id, leadOutcome: 'no_answer' }),
          Lead.countDocuments({ campaignId: c._id, leadOutcome: 'uncontacted' }),
        ]);
        return { ...c, stats: { total, interested, not_interested, no_answer, uncontacted } };
      })
    );

    res.json(withStats);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/campaigns/:id/leads
// ---------------------------------------------------------------------------
router.get('/:id/leads', async (req, res) => {
  try {
    const campaign = await ownedCampaign(req.params.id, req.tenantId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const { outcome } = req.query;
    const filter = { campaignId: campaign._id };
    if (outcome) filter.leadOutcome = outcome;

    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();
    res.json(leads);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/campaigns/:id/upload  — CSV upload
// ---------------------------------------------------------------------------
router.post('/:id/upload', upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });

    const campaign = await ownedCampaign(req.params.id, req.tenantId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const rows = await parseCSVBuffer(req.file.buffer);
    if (!rows.length) return res.status(400).json({ error: 'CSV has no valid rows (expected columns: name, phone)' });

    const docs = rows.map(r => ({
      campaignId:  campaign._id,
      tenantId:    req.tenantId,
      name:        r.name,
      phone:       r.phone,
      leadOutcome: 'uncontacted',
    }));

    const result = await Lead.insertMany(docs, { ordered: false }).catch(err => {
      if (err.code === 11000 && err.insertedDocs) return { insertedCount: err.insertedDocs.length };
      throw err;
    });

    res.json({ message: 'CSV processed', total: rows.length, inserted: result.insertedCount ?? docs.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/campaigns/:id/launch
// ---------------------------------------------------------------------------
router.post('/:id/launch', async (req, res) => {
  try {
    const campaign = await ownedCampaign(req.params.id, req.tenantId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const leads = await Lead.find({ campaignId: campaign._id, leadOutcome: 'uncontacted' }).lean();
    if (!leads.length) return res.status(400).json({ error: 'No uncontacted leads to dial' });

    await Promise.all(leads.map(l => enqueueDialerJob({ leadId: l._id.toString(), campaignId: campaign._id.toString() })));
    await Campaign.findByIdAndUpdate(campaign._id, { status: 'active' });

    res.json({ message: 'Campaign launched', queued: leads.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
