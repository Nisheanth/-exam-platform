import { motion } from 'framer-motion';
import { Target, Clock, CheckCircle2, Circle, Coffee, AlertTriangle, Flame, Zap } from 'lucide-react';
import { studyPlan } from '../data/mockData';

const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const priorityConfig = {
  critical: { color: '#ef4444', icon: AlertTriangle, bg: 'bg-red-500/10' },
  high: { color: '#f59e0b', icon: Flame, bg: 'bg-amber-500/10' },
  medium: { color: '#6366f1', icon: Target, bg: 'bg-indigo-500/10' },
  low: { color: '#10b981', icon: Zap, bg: 'bg-emerald-500/10' },
  break: { color: '#64748b', icon: Coffee, bg: 'bg-slate-500/10' },
};

export default function StudyPlan() {
  const completed = studyPlan.filter(s => s.completed).length;
  return (
    <motion.div className="p-6 space-y-6" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Target className="text-amber-400" /> Today's Study Plan</h1>
        <p className="text-slate-400 text-sm mt-1">AI-optimized schedule based on your weak areas and predictions</p>
      </motion.div>

      <motion.div variants={item} className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center"><p className="text-2xl font-bold text-white">{completed}/{studyPlan.length}</p><p className="text-[10px] text-slate-500">Tasks Done</p></div>
          <div className="w-px h-8 bg-white/5" />
          <div className="text-center"><p className="text-2xl font-bold text-cyan-400">6.5h</p><p className="text-[10px] text-slate-500">Total Study</p></div>
          <div className="w-px h-8 bg-white/5" />
          <div className="text-center"><p className="text-2xl font-bold text-emerald-400">78%</p><p className="text-[10px] text-slate-500">Efficiency</p></div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-sm font-medium text-white">
          ⚡ Smart Cram Mode
        </motion.button>
      </motion.div>

      <motion.div variants={item} className="space-y-3">
        {studyPlan.map((s, i) => {
          const cfg = priorityConfig[s.priority];
          const Icon = cfg.icon;
          return (
            <motion.div key={i} className={`glass-card p-4 rounded-2xl flex items-center gap-4 ${s.completed ? 'opacity-60' : ''}`}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: s.completed ? 0.6 : 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="w-10 text-center flex-shrink-0">
                {s.completed ? <CheckCircle2 size={20} className="text-emerald-400 mx-auto" /> : <Circle size={20} className="text-slate-600 mx-auto" />}
              </div>
              <div className="w-20 flex-shrink-0">
                <p className="text-sm font-medium text-white">{s.time}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${s.completed ? 'line-through text-slate-500' : 'text-white'}`}>{s.task}</p>
                {s.topic && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">{s.topic}</span>}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-slate-500"><Clock size={12} />{s.duration}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
