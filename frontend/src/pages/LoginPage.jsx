import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader, AlertCircle, ArrowRight } from 'lucide-react';
import client from '../api/client';
import logo from '../assets/zoniics-logo.png';

const inputCls = 'w-full bg-z-bg border border-z-border text-z-text placeholder-z-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-z-blue focus:ring-2 focus:ring-z-blue/10 transition-all';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/api/auth/login', form);
      localStorage.setItem('zoniics_token', data.token);
      localStorage.setItem('zoniics_tenant_id', data.tenant._id);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (!err.response) setError('Cannot reach the server. Is the backend running?');
      else setError(err.response.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-z-bg to-z-surface flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Background orbs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-z-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-z-purple/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <Link to="/" className="flex items-center justify-center mb-8">
          <img src={logo} alt="Zoniics AI" className="h-12 object-contain" />
        </Link>

        <div className="bg-white border border-z-border rounded-2xl p-6 sm:p-8 shadow-xl shadow-z-blue/5">
          <h1 className="text-xl sm:text-2xl font-bold text-z-text mb-1">Welcome back</h1>
          <p className="text-z-muted text-sm mb-7">Sign in to your Zoniics AI dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••••" required disabled={loading}
                  className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-z-muted hover:text-z-text rounded transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-gradient text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity shadow-lg shadow-z-blue/25 mt-2">
              {loading
                ? <><Loader size={16} className="animate-spin" />Signing in…</>
                : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-z-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-z-blue hover:underline font-semibold">Create one free</Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 px-4 py-3.5 bg-white border border-z-border rounded-2xl text-xs text-z-muted text-center shadow-sm">
          <span className="font-semibold text-z-text">Try the demo:</span>{' '}
          <span className="font-mono text-z-blue">spicegarden@demo.com</span> /{' '}
          <span className="font-mono text-z-blue">demo1234</span>
        </div>

        <p className="text-center text-xs text-z-muted mt-6">
          <Link to="/" className="hover:text-z-blue transition-colors">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}
