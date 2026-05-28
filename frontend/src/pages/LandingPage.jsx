import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Phone, UploadCloud, Zap, CheckCircle,
  ArrowRight, Bot, BarChart2, Globe, Menu, X,
} from 'lucide-react';
import logo from '../assets/zoniics-logo.png';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Globe,
    title: 'Omnichannel AI',
    description:
      'Handle WhatsApp messages and voice calls simultaneously. One AI brain, every customer channel, zero missed conversations.',
    tags: ['WhatsApp', 'Voice', 'Multi-tenant'],
    iconBg: 'bg-blue-50',
    iconColor: 'text-z-blue',
    border: 'hover:border-blue-300',
    shadow: 'hover:shadow-blue-100',
  },
  {
    icon: UploadCloud,
    title: 'Smart Cold Calling',
    description:
      'Upload a CSV of leads and watch Zoniics AI call every contact, qualify intent, and categorise outcomes — while you sleep.',
    tags: ['CSV Upload', 'Auto-dial', 'Outcome Tracking'],
    iconBg: 'bg-purple-50',
    iconColor: 'text-z-purple',
    border: 'hover:border-purple-300',
    shadow: 'hover:shadow-purple-100',
  },
  {
    icon: Zap,
    title: 'Instant Lead Processing',
    description:
      'Priority queues ensure your top-tier clients are served first. Real-time BullMQ workers, zero latency for what matters.',
    tags: ['Priority Queue', 'BullMQ', 'Real-time'],
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    border: 'hover:border-emerald-300',
    shadow: 'hover:shadow-emerald-100',
  },
];

const PLANS = [
  {
    name:     'Normal',
    price:    '$29',
    per:      '/month',
    badge:    null,
    highlight: false,
    features: [
      '50 requests / minute',
      'Inbound WhatsApp only',
      'Standard queue priority',
      'Up to 2,000 messages / mo',
      'Single AI worker',
      'Community support',
    ],
    missing: ['Outbound Voice Calls', 'Priority Queue', 'Dedicated Worker'],
  },
  {
    name:     'Pro',
    price:    '$79',
    per:      '/month',
    badge:    'Most Popular',
    highlight: true,
    features: [
      '200 requests / minute',
      'WhatsApp + Inbound Voice',
      'Priority queue (level 2)',
      'Up to 20,000 messages / mo',
      'Multi-worker processing',
      'Email support',
      'Campaign Dashboard',
    ],
    missing: ['Dedicated Worker', 'Outbound Cold Calling'],
  },
  {
    name:    'Professional',
    price:   '$199',
    per:     '/month',
    badge:   null,
    highlight: false,
    features: [
      '1,000 requests / minute',
      'Omnichannel + Outbound Calls',
      'Instant priority (level 1)',
      'Unlimited messages',
      'Dedicated AI worker',
      'Priority support',
      'CSV Upload & Auto-dial',
      'Full outcome analysis',
    ],
    missing: [],
  },
];

const STEPS = [
  { n: '01', title: 'Register & configure',  body: 'Create an account, paste your OpenAI key and WhatsApp Phone ID, and write your AI system prompt in minutes.' },
  { n: '02', title: 'Connect your channels', body: 'Point your Meta webhook and Vapi phone number at Zoniics AI. No code changes needed on your end.' },
  { n: '03', title: 'Watch it run',           body: 'Customers message you, Zoniics replies intelligently. Upload a CSV and it cold-calls your leads overnight.' },
];

// ─── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-z-border bg-white/90 backdrop-blur-xl shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Zoniics AI" className="h-9 object-contain" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-3">
          <Link to="/login"
            className="px-4 py-2 text-sm text-z-muted hover:text-z-text transition-colors font-medium">
            Sign In
          </Link>
          <Link to="/register"
            className="px-4 py-2 text-sm font-semibold bg-brand-gradient text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm">
            Get Started Free
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button className="sm:hidden p-2 rounded-lg text-z-muted hover:text-z-text hover:bg-z-surface" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-z-border bg-white px-4 py-4 space-y-2 shadow-lg">
          <Link to="/login" onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-z-muted hover:text-z-text rounded-lg hover:bg-z-surface">
            Sign In
          </Link>
          <Link to="/register" onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm font-semibold bg-brand-gradient text-white rounded-lg text-center hover:opacity-90">
            Get Started Free
          </Link>
        </div>
      )}
    </header>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-gradient-to-b from-white via-z-bg to-z-surface">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-z-blue/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-z-purple/20 rounded-full blur-3xl pointer-events-none" />
      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,126,247,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(79,126,247,0.06)_1px,transparent_1px)] bg-[size:48px_48px] sm:bg-[size:64px_64px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-z-blue/30 bg-z-blue/10 text-z-blue text-xs font-semibold mb-8 shadow-sm">
          <Bot size={13} /> Powered by GPT-4o Mini &amp; Vapi.ai
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-z-text leading-tight tracking-tight mb-6">
          Automate Inbound Support{' '}
          <span className="gradient-text">&amp; Outbound Sales</span>{' '}
          with Zoniics AI
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-z-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          One platform. WhatsApp support, AI voice calls, and automated cold-calling campaigns —
          all running 24/7 without a single human agent.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link to="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-brand-gradient text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-z-blue/25 text-sm sm:text-base">
            Start for Free <ArrowRight size={18} />
          </Link>
          <Link to="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-white border-2 border-z-border text-z-muted rounded-xl hover:text-z-text hover:border-z-blue transition-colors text-sm sm:text-base font-medium shadow-sm">
            Sign In to Dashboard
          </Link>
        </div>

        {/* Mini stats */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-16">
          {[
            { stat: '< 2s',    label: 'Avg. AI response time' },
            { stat: '3 tiers', label: 'Plans for every scale' },
            { stat: '24 / 7',  label: 'Always-on automation'  },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold gradient-text">{stat}</p>
              <p className="text-z-muted text-xs sm:text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ──────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-z-text mb-4">
            Everything your business needs to scale with AI
          </h2>
          <p className="text-z-muted text-base sm:text-lg max-w-xl mx-auto">
            No code. No agents. Just configure once and let Zoniics handle the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description, tags, iconBg, iconColor, border, shadow }) => (
            <div key={title}
              className={`group relative bg-white border border-z-border rounded-2xl p-6 sm:p-7 hover:shadow-xl ${shadow} ${border} transition-all duration-300`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} mb-5`}>
                <Icon size={24} className={iconColor} />
              </div>
              <h3 className="text-lg font-bold text-z-text mb-3">{title}</h3>
              <p className="text-z-muted text-sm leading-relaxed mb-5">{description}</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                  <span key={t} className="px-2.5 py-1 bg-z-surface rounded-full text-xs text-z-muted border border-z-border font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 bg-z-bg">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-z-text mb-4">Up and running in minutes</h2>
          <p className="text-z-muted text-base sm:text-lg max-w-xl mx-auto">Three steps to fully automated AI communication.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {STEPS.map(({ n, title, body }) => (
            <div key={n} className="relative bg-white rounded-2xl p-6 sm:p-8 border border-z-border shadow-sm hover:shadow-md transition-shadow">
              <div className="text-5xl sm:text-6xl font-extrabold gradient-text mb-4 leading-none opacity-40">{n}</div>
              <h3 className="text-lg font-bold text-z-text mb-2">{title}</h3>
              <p className="text-z-muted text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ───────────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-z-text mb-4">Simple, transparent pricing</h2>
          <p className="text-z-muted text-base sm:text-lg max-w-xl mx-auto">
            Every plan includes the full AI engine. You only pay for scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map(({ name, price, per, badge, highlight, features, missing }) => (
            <div key={name}
              className={`relative rounded-2xl p-6 sm:p-7 flex flex-col transition-all duration-300 ${
                highlight
                  ? 'bg-gradient-to-b from-z-blue/5 to-z-purple/5 border-2 border-z-blue shadow-xl shadow-z-blue/10 scale-105'
                  : 'bg-white border border-z-border shadow-sm hover:shadow-md'
              }`}>
              {badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-brand-gradient text-white text-xs font-bold rounded-full shadow-lg shadow-z-blue/30">
                    {badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-z-text mb-2">{name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl sm:text-5xl font-extrabold ${highlight ? 'gradient-text' : 'text-z-text'}`}>{price}</span>
                  <span className="text-z-muted text-sm">{per}</span>
                </div>
              </div>

              <Link to="/register"
                className={`block text-center py-3 rounded-xl font-semibold text-sm mb-7 transition-opacity ${
                  highlight
                    ? 'bg-brand-gradient text-white hover:opacity-90 shadow-md shadow-z-blue/20'
                    : 'bg-z-surface text-z-text border border-z-border hover:bg-z-bg hover:border-z-blue'
                }`}>
                Get Started
              </Link>

              <ul className="space-y-3 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-z-text">
                    <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-emerald-500" />
                    {f}
                  </li>
                ))}
                {missing.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-z-muted/60 line-through">
                    <CheckCircle size={16} className="flex-shrink-0 mt-0.5 opacity-25" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-z-muted text-sm mt-10">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}

// ─── CTA ───────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-br from-z-blue to-z-purple">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none" />
      <div className="relative max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center mx-auto mb-6">
          <img src={logo} alt="Zoniics AI" className="h-12 object-contain brightness-0 invert opacity-90" />
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
          Ready to automate your business?
        </h2>
        <p className="text-white/80 text-base sm:text-lg mb-10 leading-relaxed">
          Join hundreds of businesses running on Zoniics AI — no agents, no missed messages.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-z-blue font-bold rounded-xl hover:bg-white/90 transition-colors shadow-xl text-sm sm:text-base">
            Create Free Account <ArrowRight size={20} />
          </Link>
          <Link to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm text-sm sm:text-base">
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-z-border py-8 sm:py-10 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <img src={logo} alt="Zoniics AI" className="h-7 object-contain" />
        </div>
        <p className="text-z-muted text-xs sm:text-sm order-last sm:order-none">
          © {new Date().getFullYear()} Zoniics AI. All rights reserved.
        </p>
        <div className="flex gap-5 text-sm text-z-muted">
          <Link to="/login"    className="hover:text-z-blue transition-colors font-medium">Sign In</Link>
          <Link to="/register" className="hover:text-z-blue transition-colors font-medium">Register</Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-white text-z-text min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
