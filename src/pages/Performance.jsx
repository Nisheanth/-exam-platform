import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
} from 'recharts';
import { Zap, Flame, Target, TrendingUp, Award, Clock, Brain, CheckCircle2 } from 'lucide-react';
import { performanceData } from '../data/mockData';

const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const tooltipStyle = { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 };

export default function Performance() {
  const { weeklyStudy, weaknessRadar, streakDays, totalQuestionsSolved, accuracy, rank } = performanceData;

  return (
    <motion.div className="p-6 space-y-6" initial="hidden" animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="text-yellow-400" /> Performance Tracker
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track your progress and identify improvement areas</p>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Day Streak', value: streakDays, icon: Flame, color: '#f97316', suffix: ' days' },
          { label: 'Questions Solved', value: totalQuestionsSolved, icon: CheckCircle2, color: '#10b981', suffix: '' },
          { label: 'Accuracy', value: accuracy, icon: Target, color: '#6366f1', suffix: '%' },
          { label: 'Global Rank', value: `#${rank}`, icon: Award, color: '#f59e0b', suffix: '' },
        ].map((s, i) => (
          <motion.div key={i} className="glass-card p-5 rounded-2xl relative overflow-hidden" whileHover={{ scale: 1.02 }}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10" style={{ background: s.color, filter: 'blur(25px)' }} />
            <s.icon size={20} style={{ color: s.color }} className="mb-2" />
            <p className="text-2xl font-bold text-white">{s.value}{typeof s.value === 'number' ? s.suffix : ''}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Study */}
        <motion.div variants={item} className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Clock size={16} className="text-cyan-400" /> Weekly Study Hours
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyStudy}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="hours" radius={[8, 8, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Weakness Radar */}
        <motion.div variants={item} className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Brain size={16} className="text-purple-400" /> Weakness Radar
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={weaknessRadar}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
              <PolarRadiusAxis stroke="rgba(255,255,255,0.1)" fontSize={10} />
              <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Questions per day */}
      <motion.div variants={item} className="glass-card p-6 rounded-2xl">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-emerald-400" /> Questions Solved This Week
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weeklyStudy}>
            <defs>
              <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="questions" stroke="#10b981" fill="url(#qGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}
