import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import client from '../api/client';
import logo from '../assets/zoniics-logo.png';

const inputCls = 'w-full bg-z-bg border border-z-border text-z-text placeholder-z-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-z-blue focus:ring-2 focus:ring-z-blue/10 transition-all disabled:opacity-50';

const TIERS = [
  { value: 'normal',       label: 'Normal',       desc: '50 req/min',    price: '$29/mo' },
  { value: 'pro',          label: 'Pro',           desc: '200 req/min',   price: '$79/mo' },
  { value: 'professional', label: 'Professional',  desc: '1000 req/min',  price: '$199/mo' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ businessName: '', email: '', password: '', confirm: '', tier: 'normal' });
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError(''); }

  const pwMatch    = form.password && form.confirm && form.password === form.confirm;
  const pwMismatch = form.confirm && form.password !== form.confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters'); return; }

    setLoading(true); setError('');
    try {
      const { data } = await client.post('/api/auth/register', {
        businessName: form.businessName,
        email:        form.email,
        password:     form.password,
        tier:         form.tier,
      });
      localStorage.setItem('zoniics_token', data.token);
      localStorage.setItem('zoniics_tenant_id', data.tenant._id);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (!err.response) setError('Cannot reach the server. Is the backend running?');
      else setError(err.response.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-z-bg to-z-surface flex flex-col items-center justify-center p-4 sm:p-6 py-10">
      {/* Background orbs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-z-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-z-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <Link to="/" className="flex items-center justify-center mb-8">
          <img src={logo} alt="Zoniics AI" className="h-12 object-contain" />
        </Link>

        <div className="bg-white border border-z-border rounded-2xl p-6 sm:p-8 shadow-xl shadow-z-blue/5">
          <h1 className="text-xl sm:text-2xl font-bold text-z-text mb-1">Create your account</h1>
          <p className="text-z-muted text-sm mb-7">Set up your Zoniics AI workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-z-muted uppercase tracking-widest mb-2 block">Business Name</label>
              <input value={form.businessName} onChange={e => set('businessName', e.target.value)}
                placeholder="Acme Corp" required disabled={loading} className={inputCls} />
            </div>

            <div>
              <label className="text-xs font-semibold text-z-muted uppercase tracking-widest mb-2 block">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="you@business.com" required disabled={loading} className={inputCls} />
            </div>

            <div>
              <label className="text-xs font-semibold text-z-muted uppercase tracking-widest mb-2 block">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Min. 8 characters" required disabled={loading}
                  className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-z-muted hover:text-z-text rounded transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-z-muted uppercase tracking-widest mb-2 block">Confirm Password</label>
              <div className="relative">
                <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                  placeholder="Repeat password" required disabled={loading}
                  className={`${inputCls} pr-10 ${pwMismatch ? 'border-red-300 ring-2 ring-red-100' : pwMatch ? 'border-emerald-400 ring-2 ring-emerald-50' : ''}`} />
                {pwMatch    && <CheckCircle size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                {pwMismatch && <AlertCircle size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />}
              </div>
            </div>

            {/* Plan selector */}
            <div>
              <label className="text-xs font-semibold text-z-muted uppercase tracking-widest mb-2 block">Plan</label>
              <div className="grid grid-cols-3 gap-2">
                {TIERS.map(t => (
                  <button key={t.value} type="button" onClick={() => set('tier', t.value)}
                    className={`py-3 px-2 rounded-xl border text-center transition-all
                      ${form.tier === t.value
                        ? 'border-z-blue bg-gradient-to-b from-z-blue/10 to-z-purple/5 text-z-blue shadow-sm'
                        : 'border-z-border text-z-muted hover:border-z-blue/40 hover:text-z-text bg-z-bg'}`}>
                    <div className="text-xs font-bold">{t.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{t.desc}</div>
                    <div className={`text-xs font-semibold mt-1 ${form.tier === t.value ? 'gradient-text' : 'text-z-muted'}`}>{t.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-gradient text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity shadow-lg shadow-z-blue/25 mt-2">
              {loading
                ? <><Loader size={16} className="animate-spin" />Creating account…</>
                : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-z-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-z-blue hover:underline font-semibold">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-z-muted mt-6">
          <Link to="/" className="hover:text-z-blue transition-colors">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}
