import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  Brain, Sparkles, Target, Clock, TrendingUp, ArrowUpRight,
  Flame, Zap, BookOpen, FileText, Repeat, AlertCircle, Server, WifiOff, Loader2
} from 'lucide-react';
import { dashboardStats, yearWiseTrends, unitWeightage, predictions, topicHeatmapData, performanceData, recentQuestions } from '../data/mockData';
import { listPapers, runAnalysis, isBackendAvailable } from '../services/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const iconMap = { brain: Brain, sparkles: Sparkles, target: Target, clock: Clock };
const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function HeatmapGrid({ data }) {
  const heatmapSource = data || topicHeatmapData;
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const getColor = (val) => {
    if (val <= 2) return 'rgba(99,102,241,0.15)';
    if (val <= 4) return 'rgba(99,102,241,0.3)';
    if (val <= 6) return 'rgba(99,102,241,0.5)';
    if (val <= 8) return 'rgba(99,102,241,0.75)';
    return 'rgba(99,102,241,1)';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex gap-1 mb-2 pl-32">
          {years.map(y => <div key={y} className="w-12 text-center text-xs text-slate-500">{y}</div>)}
        </div>
        {heatmapSource.map((row, i) => (
          <div key={i} className="flex items-center gap-1 mb-1">
            <div className="w-32 text-xs text-slate-400 truncate pr-2">{row.topic}</div>
            {years.map(y => (
              <div
                key={y}
                className="heatmap-cell w-12 h-8 flex items-center justify-center text-xs font-medium text-white/80"
                style={{ background: getColor(row[y] || 0) }}
                title={`${row.topic} (${y}): ${row[y] || 0} questions`}
              >
                {row[y] || 0}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [backendOnline, setBackendOnline] = useState(null);
  const [liveStats, setLiveStats] = useState(null);
  const [livePapers, setLivePapers] = useState(null);
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Try to load live data from backend
  useEffect(() => {
    let mounted = true;
    async function fetchLiveData() {
      try {
        const online = await isBackendAvailable();
        if (!mounted) return;
        setBackendOnline(online);

        if (online) {
          // Fetch papers list
          const papersRes = await listPapers();
          if (!mounted) return;
          setLivePapers(papersRes.papers || []);

          // Compute live stats from papers
          const totalQuestions = papersRes.papers.reduce((sum, p) => sum + (p.questions_extracted || 0), 0);
          const totalPapers = papersRes.papers.length;
          
          if (totalPapers > 0) {
            setLiveStats([
              { label: 'Questions Analyzed', value: totalQuestions.toLocaleString(), change: `${totalPapers} papers`, icon: 'brain', color: '#6366f1' },
              { label: 'Papers Uploaded', value: String(totalPapers), change: 'processed', icon: 'sparkles', color: '#06b6d4' },
              { label: 'Subjects', value: String(new Set(papersRes.papers.map(p => p.subject)).size), change: 'active', icon: 'target', color: '#10b981' },
              { label: 'Latest Year', value: String(Math.max(...papersRes.papers.map(p => p.year))), change: 'most recent', icon: 'clock', color: '#f59e0b' },
            ]);

            // Try to hit the endpoint for Analysis if we have uploaded papers
            // We'll just run analysis for the latest subject as a demo or use the first returned paper's subject
            try {
              if (papersRes.papers.length > 0) {
                const targetSubject = papersRes.papers[0].subject;
                const targetExam = papersRes.papers[0].exam_name;
                const analysisRes = await runAnalysis(targetExam, targetSubject);
                if (mounted) setLiveAnalysis(analysisRes);
              }
            } catch (aErr) {
              console.warn("Analysis not generated yet for this exam/subject", aErr);
            }
          }
        }
      } catch (err) {
        if (mounted) setBackendOnline(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchLiveData();
    return () => { mounted = false; };
  }, []);

  const statsToShow = liveStats || dashboardStats;

  return (
    <motion.div
      className="p-6 space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* 1. Header Area */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white gradient-text tracking-tight pb-1">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            {backendOnline ? '🟢 Connected to backend — showing live data' : backendOnline === false ? '🔴 Backend offline — showing demo data' : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Backend indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium border ${
            backendOnline ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
            backendOnline === false ? 'border-red-500/20 text-red-400 bg-red-500/5' :
            'border-slate-700 text-slate-500'
          }`}>
            {backendOnline === null ? <Loader2 size={10} className="animate-spin" /> :
              backendOnline ? <Server size={10} /> : <WifiOff size={10} />}
            <span>{backendOnline === null ? 'Connecting...' : backendOnline ? 'API Live' : 'Demo Mode'}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl animate-pulse-glow">
            <Flame size={18} className="text-orange-400 animate-float" />
            <span className="text-sm font-semibold text-orange-400">{performanceData.streakDays} Day Streak</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl">
            <Zap size={16} className="text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">Rank #{performanceData.rank}</span>
          </div>
        </div>
      </motion.div>

      {/* 2. Top Level Overviews (Stat Cards) */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsToShow.map((stat, i) => {
          const Icon = iconMap[stat.icon];
          return (
            <motion.div
              key={i}
              className="glass-card stat-card p-5 rounded-2xl relative overflow-hidden group shimmer-bg"
              whileHover={{ scale: 1.03 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"
                style={{ background: stat.color, filter: 'blur(35px)' }} />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className="text-4xl font-black text-white">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 shadow-lg"
                  style={{ background: `${stat.color}25`, boxShadow: `0 0 20px ${stat.color}40` }}>
                  <Icon size={20} style={{ color: stat.color }} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <ArrowUpRight size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">{stat.change}</span>
                {!liveStats && <span className="text-xs text-slate-500 ml-1">vs last month</span>}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 3. Live Papers List (if backend connected) */}
      {livePapers && livePapers.length > 0 && (
        <motion.div variants={item} className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Server size={16} className="text-emerald-400" />
            Uploaded Papers (Live from Backend)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {livePapers.slice(0, 6).map((p, i) => (
              <div key={p.paper_id || i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{p.exam_name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{p.questions_extracted} Qs</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-cyan-400">{p.subject}</span>
                  <span className="text-[10px] text-amber-400">{p.year}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 4. High-Priority Action Intelligence (Predictions & Repeated) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Important Repeated Questions */}
        <motion.div variants={item} className="xl:col-span-2 glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-rose-500/10 rounded-full blur-[60px] pointer-events-none" />
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mb-4 relative z-10">
            <Repeat size={20} className="text-rose-400 animate-spin-slow" style={{ animation: 'spin 8s linear infinite' }} />
            Critical Repeated Questions
          </h3>
          
          <div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-2 px-2 custom-scrollbar snap-x relative z-10 flex-1">
            {(liveAnalysis ? liveAnalysis.repeated_questions : recentQuestions)
              .sort((a, b) => (b.frequency || b.repeats) - (a.frequency || a.repeats))
              .map((q, i) => (
              <motion.div 
                key={q.id || i} 
                className="flex-shrink-0 w-[300px] glass-card p-5 rounded-2xl snap-start border border-rose-500/20 hover:border-rose-400/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] transition-all cursor-pointer group flex flex-col"
                whileHover={{ y: -5 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-500/20 text-rose-400 flex items-center gap-1 border border-rose-500/30">
                    <AlertCircle size={10} /> MUST DO
                  </span>
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg border border-white/5">
                    <Flame size={12} className="text-orange-500" />
                    <span className="text-xs font-black text-white">{q.frequency || q.repeats}x</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-white leading-relaxed mb-4 group-hover:text-rose-200 transition-colors flex-1">{q.question_text || q.text}</p>
                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 truncate max-w-[120px]">{q.topic || q.subject}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">10 Marks</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rapid Deployment Applets */}
        <motion.div variants={item} className="flex flex-col gap-4">
          {[
            { icon: BookOpen, label: 'Smart Cram Mode', desc: 'Auto-pilot learning', color: '#8b5cf6' },
            { icon: FileText, label: 'Notes Generator', desc: 'AI instant synthesis', color: '#3b82f6' },
            { icon: Target, label: 'Weakness Drill', desc: 'Targeted refinement', color: '#f59e0b' },
          ].map((action, i) => (
            <motion.button
              key={i}
              className="glass-card p-5 rounded-2xl text-left hover:scale-[1.02] transition-transform group flex-1 flex items-center gap-4 relative overflow-hidden"
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500" style={{ background: action.color, filter: 'blur(20px)' }} />
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10" style={{ background: `${action.color}15` }}>
                <action.icon size={20} style={{ color: action.color }} />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-white">{action.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* 5. Deep Analytics Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Year-wise Trends */}
        <motion.div variants={item} className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-400 animate-pulse" />
                Evolution of Question Types
              </h3>
              <p className="text-xs text-slate-400 mt-1">Deep analysis of changing exam paradigms across the decade.</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={yearWiseTrends}>
              <defs>
                <linearGradient id="colorTheory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
              <XAxis dataKey="year" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}
                labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="theory" stroke="#8b5cf6" fill="url(#colorTheory)" strokeWidth={3} />
              <Area type="monotone" dataKey="programming" stroke="#3b82f6" fill="url(#colorProg)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Predictions */}
        <motion.div variants={item} className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none" />
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 relative z-10">
            <Sparkles size={18} className="text-purple-400 animate-float" />
            AI Predictions
          </h3>
          <div className="space-y-3 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[350px]">
            {(liveAnalysis ? liveAnalysis.important_questions : predictions).slice(0, 5).map((p, i) => {
              const confidence = p.score !== undefined ? Math.round(p.score * 100) : p.confidence;
              const question = p.question_text || p.question;
              return (
              <div key={p.id || i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-transparent hover:border-purple-500/30 transition-all duration-300 group cursor-pointer hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:-translate-y-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={{
                    background: confidence >= 90 ? 'rgba(16,185,129,0.15)' : confidence >= 80 ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)',
                    color: confidence >= 90 ? '#10b981' : confidence >= 80 ? '#818cf8' : '#f59e0b'
                  }}>
                  {confidence}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white font-medium truncate group-hover:text-indigo-300 transition-colors leading-tight">{question}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 truncate max-w-[120px]">{p.topic}</span>
                    <span className="text-[9px] text-slate-500 font-semibold">{p.marks || 10} marks</span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </motion.div>
      </div>

      {/* 6. Heatmap */}
      <motion.div variants={item} className="glass-card p-6 rounded-2xl border border-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Flame size={16} className="text-orange-400" />
          Sub-Topic Frequency Matrix
        </h3>
        <p className="text-xs text-slate-400 mb-6">Historical aggregation of specific question sub-topics across 8 examination cycles.</p>
        <HeatmapGrid data={liveAnalysis ? liveAnalysis.topic_heatmap.map(t => ({ topic: t.topic, ...t.year_counts })) : undefined} />
      </motion.div>

      {/* Developer Credit */}
      <motion.div
        variants={item}
        className="flex justify-center pt-4 pb-2"
      >
        <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm">
          <span className="text-[11px] text-slate-500">✦</span>
          <span className="text-[12px] font-semibold tracking-wide bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Developed by R.Nisheanth
          </span>
          <span className="text-[11px] text-slate-500">✦</span>
        </div>
      </motion.div>

    </motion.div>
  );
}
