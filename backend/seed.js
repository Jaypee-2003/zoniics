require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Tenant      = require('./models/Tenant');
const Interaction = require('./models/Interaction');
const Campaign    = require('./models/Campaign');
const Lead        = require('./models/Lead');

const CONVO_PAIRS = [
  { user: 'Hi, are you open on Sundays?',     ai: 'Yes, open every day 11am–10pm. Anything else I can help with?' },
  { user: 'Can I make a reservation for 4?',  ai: 'Absolutely! What date and time works best for you?' },
  { user: 'Do you have vegan options?',        ai: 'Yes, over 10 vegan dishes. Our jackfruit biryani is a crowd favourite!' },
  { user: 'What are your membership prices?',  ai: 'Memberships from £29/month basic, £49 premium, £79 all-inclusive with PT.' },
  { user: 'How do I book a personal trainer?', ai: 'Reply here or use our app. PT slots available Mon–Sat 6am–8pm.' },
  { user: 'How much is an oil change?',        ai: 'From £35 including a free 10-point inspection. Want to book?' },
  { user: 'My brakes are squeaking',           ai: 'Likely worn brake pads. Free inspection available — can you come in this week?' },
  { user: 'Thank you!',                        ai: "You're welcome! Have a great day." },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected\n');

  // Wipe all collections
  await Promise.all([
    Tenant.deleteMany({}),
    Interaction.deleteMany({}),
    Campaign.deleteMany({}),
    Lead.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  const password = await bcrypt.hash('demo1234', 12);

  const TENANTS = [
    {
      businessName:    'Spice Garden Restaurant',
      email:           'spicegarden@demo.com',
      password,
      tier:            'professional',
      whatsappPhoneId: '111222333444555',
      systemPrompt:    'You are a friendly AI assistant for Spice Garden Restaurant. Help customers with reservations, menu inquiries, and special dietary requirements.',
      openAiKey:       'sk-proj-dummy-spice',
      isActive:        true,
    },
    {
      businessName:    'FitLife Gym & Wellness',
      email:           'fitlife@demo.com',
      password,
      tier:            'pro',
      whatsappPhoneId: '222333444555666',
      systemPrompt:    'You are a motivating AI assistant for FitLife Gym. Help with membership plans, class schedules, and personal training bookings.',
      openAiKey:       'sk-proj-dummy-fitlife',
      isActive:        true,
    },
    {
      businessName:    'QuickFix Auto Repairs',
      email:           'quickfix@demo.com',
      password,
      tier:            'normal',
      whatsappPhoneId: '333444555666777',
      systemPrompt:    'You are a helpful AI assistant for QuickFix Auto Repairs. Help with service bookings, repair estimates, and service questions.',
      openAiKey:       'sk-proj-dummy-quickfix',
      isActive:        true,
    },
  ];

  const createdTenants = await Tenant.insertMany(TENANTS);
  console.log(`Created ${createdTenants.length} tenants`);

  // Seed interactions
  const interactions = [];
  const phones   = ['+447700900001', '+447700900002', '+447700900003'];
  const channels = ['whatsapp', 'whatsapp', 'voice'];

  for (const tenant of createdTenants) {
    for (let c = 0; c < 3; c++) {
      const phone   = phones[c % phones.length];
      const channel = channels[c % channels.length];
      const pairs   = CONVO_PAIRS.slice(c * 2, c * 2 + 3);
      let t = Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000;

      for (const pair of pairs) {
        interactions.push({ tenantId: tenant._id, customerPhone: phone, channel, role: 'user', message: pair.user, createdAt: new Date(t) });
        t += 8000;
        interactions.push({ tenantId: tenant._id, customerPhone: phone, channel, role: 'ai',   message: pair.ai,   createdAt: new Date(t) });
        t += 15000;
      }
    }
  }

  await Interaction.insertMany(interactions);
  console.log(`Created ${interactions.length} interactions`);

  // Seed a demo campaign with leads for the first tenant
  const firstTenant = createdTenants[0];
  const campaign = await Campaign.create({
    tenantId:             firstTenant._id,
    name:                 'Summer Promo Campaign',
    description:          'Outbound demo campaign with sample leads',
    vapiPhoneNumberId:    'vapi-ph-demo-id',
    systemPromptTemplate: "Hi {{name}}, this is an AI call from Spice Garden. We're running a summer special — 20% off for 2+ people. Are you interested?",
    status:               'completed',
  });

  const demoLeads = [
    { name: 'Arjun Mehta',    phone: '+447700900010', leadOutcome: 'interested',     callSummary: 'Very interested, asked about weekend availability.' },
    { name: 'Priya Sharma',   phone: '+447700900011', leadOutcome: 'interested',     callSummary: 'Wants to book for Saturday evening for 3 people.' },
    { name: 'David Okafor',   phone: '+447700900012', leadOutcome: 'not_interested', callSummary: 'Currently abroad and not interested at this time.' },
    { name: 'Fatima Al-Sayed',phone: '+447700900013', leadOutcome: 'not_interested', callSummary: 'Prefers vegetarian-only restaurants.' },
    { name: 'James Wu',       phone: '+447700900014', leadOutcome: 'no_answer',      callSummary: '' },
    { name: 'Aisha Patel',    phone: '+447700900015', leadOutcome: 'no_answer',      callSummary: '' },
    { name: 'Tom Reynolds',   phone: '+447700900016', leadOutcome: 'interested',     callSummary: 'Interested in the group dining package.' },
    { name: 'Sofia Rossi',    phone: '+447700900017', leadOutcome: 'uncontacted',    callSummary: '' },
  ];

  await Lead.insertMany(
    demoLeads.map(l => ({ ...l, campaignId: campaign._id, tenantId: firstTenant._id }))
  );
  console.log(`Created demo campaign with ${demoLeads.length} leads`);

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║             DEMO LOGIN CREDENTIALS                  ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  for (const t of createdTenants) {
    const email = TENANTS.find(x => x.businessName === t.businessName).email;
    console.log(`║  ${t.businessName.padEnd(28)} [${t.tier.padEnd(12)}]  ║`);
    console.log(`║  Email: ${email.padEnd(44)}║`);
    console.log(`║  Password: demo1234${' '.repeat(34)}║`);
    console.log('╠══════════════════════════════════════════════════════╣');
  }
  console.log('╚══════════════════════════════════════════════════════╝\n');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
