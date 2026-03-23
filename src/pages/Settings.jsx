import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Key, Database, Monitor, HardDrive, Smartphone, Zap, Save } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API & Integrations', icon: Key },
    { id: 'data', label: 'Storage & Data', icon: HardDrive },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <motion.div className="p-6 space-y-6 max-w-6xl mx-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <h1 className="text-3xl font-extrabold text-white gradient-text tracking-tight pb-1">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account, API preferences, and TestGenie AI engine parameters.</p>
      </motion.div>

      <motion.div variants={item} className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="glass-card p-3 rounded-2xl flex flex-col gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold relative overflow-hidden group ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {isActive && <div className="absolute inset-0 bg-indigo-500/20 mix-blend-screen" />}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
                  <Icon size={18} className={isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <motion.div className="glass-card p-8 rounded-2xl border border-white/10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 p-1 block relative group">
                  <div className="w-full h-full bg-app-dark rounded-full flex items-center justify-center border-[4px] border-transparent">
                    <User size={40} className="text-white/50" />
                  </div>
                  <div className="absolute bottom-0 right-0 bg-indigo-500 p-2 rounded-full cursor-pointer hover:bg-indigo-400 transition-colors shadow-lg">
                    <Zap size={14} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Magic Scholar Architect</h3>
                  <p className="text-sm text-amber-500 font-medium bg-amber-500/10 inline-block px-3 py-1 rounded-full border border-amber-500/20">Genie Plus Member</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input type="text" defaultValue="AI Engine Architect" className="w-full bg-slate-900/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                    <input type="email" defaultValue="admin@testgenie.ai" className="w-full bg-slate-900/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">University / Institution</label>
                    <input type="text" defaultValue="Tech Advanced University" className="w-full bg-slate-900/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Major</label>
                    <input type="text" defaultValue="Computer Science" className="w-full bg-slate-900/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all shadow-inner" />
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                  <button className="px-5 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-colors">Discard</button>
                  <button className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all active:scale-95">
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'api' && (
            <motion.div className="glass-card p-8 rounded-2xl border border-emerald-500/20 relative overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="mb-6 relative z-10">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Key className="text-emerald-400" size={20} /> Developer APIs
                </h3>
                <p className="text-sm text-slate-400">Connect the TestGenie AI interface directly to your custom Python/FastAPI backend components.</p>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Primary Engine Key</label>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 bg-black/50 text-emerald-300 px-4 py-3 rounded-lg text-sm font-mono border border-emerald-500/20">genie_live_9x8q2l_***</code>
                    <button className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/10">Reveal</button>
                    <button className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/10">Copy</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white">Webhook Endpoints</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="text-sm font-semibold text-white">OCR Parsing Webhook</p>
                        <p className="text-xs text-slate-500">https://api.testgenie.ai/v1/webhooks/ocr</p>
                      </div>
                      <div className="w-10 h-6 bg-emerald-500/30 rounded-full flex items-center px-1 border border-emerald-500/50 cursor-pointer">
                        <div className="w-4 h-4 bg-emerald-400 rounded-full ml-auto shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab !== 'profile' && activeTab !== 'api' && (
            <motion.div className="glass-card p-12 text-center rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[400px]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                <Monitor size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Configure {tabs.find(t => t.id === activeTab)?.label}</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">Advanced settings for this module are dynamically loaded from the engine core config files.</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
