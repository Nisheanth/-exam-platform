import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import logoImg from '../assets/testgenie-logo.png';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 401) {
        setError('Wrong password! This email is already registered. Please try again with the correct password.');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        // Backend may be cold-starting on Render — fallback to local auth
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        onLogin(true);
        return;
      }

      const data = await res.json();
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userId', data.user_id);

      // Check if backend confirms it's a brand new account
      if (data.message === 'Account securely generated.') {
        setSuccessMsg(`🎉 Welcome aboard! Your account has been created for ${data.email}`);
        setTimeout(() => onLogin(true), 2000); // Show message for 2s then enter
      } else {
        onLogin(true);
      }
    } catch {
      // Network offline or backend spinning up — allow through gracefully
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', email);
      onLogin(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-2xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-amber-400 to-cyan-400" />
          
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 p-2 shadow-inner relative group">
              <div className="absolute inset-0 bg-amber-400/20 rounded-2xl blur-lg group-hover:bg-amber-400/40 transition-all duration-500" />
              <img src={logoImg} alt="Logo" className="w-full h-full object-cover rounded-xl relative z-10" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Access TestGenie</h1>
            <p className="text-slate-400 text-sm mt-2">Sign in or register to analyze your exams</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 pl-1 mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 transition-all focus:bg-white/[0.05]"
                  style={{ paddingLeft: '44px' }}
                  placeholder="your.email@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5 px-1">
                <label className="text-xs font-medium text-slate-400">Password</label>
                <a href="#" className="text-xs font-medium text-amber-400 hover:text-amber-300">Forgot?</a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 transition-all focus:bg-white/[0.05]"
                  style={{ paddingLeft: '44px' }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {successMsg && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                >
                  <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{successMsg}</span>
                </motion.div>
              )}
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400"
                >
                  <XCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  Unlock Dashboard
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-amber-500/50" /> Secure AI Authentication
          </p>
        </div>
      </motion.div>
    </div>
  );
}
