import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity, Layers, GitBranch, Server, WifiOff, Loader2, PlayCircle } from 'lucide-react';
import { yearWiseTrends, unitWeightage, topicHeatmapData, performanceData } from '../data/mockData';
import { isBackendAvailable, runAnalysis, listPapers } from '../services/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const tooltipStyle = { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 };

const marksDistribution = [
  { range: '1-2 marks', count: 15, fill: '#6366f1' },
  { range: '3-5 marks', count: 22, fill: '#06b6d4' },
  { range: '6-8 marks', count: 18, fill: '#10b981' },
  { range: '10 marks', count: 30, fill: '#f59e0b' },
  { range: '12-15 marks', count: 15, fill: '#ef4444' },
];

const topicImportance = [
  { topic: 'Trees & Graphs', importance: 95, frequency: 42, growth: 15 },
  { topic: 'SQL Queries', importance: 92, frequency: 38, growth: 12 },
  { topic: 'Dynamic Prog.', importance: 88, frequency: 28, growth: 25 },
  { topic: 'Normalization', importance: 85, frequency: 32, growth: 8 },
  { topic: 'OS Scheduling', importance: 82, frequency: 30, growth: 10 },
  { topic: 'TCP/IP Model', importance: 78, frequency: 25, growth: 5 },
  { topic: 'Deadlocks', importance: 72, frequency: 22, growth: -3 },
  { topic: 'Sorting', importance: 65, frequency: 18, growth: -10 },
];

export default function Analytics() {
  const [backendOnline, setBackendOnline] = useState(null);
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [papers, setPapers] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    let mounted = true;
    async function init() {
      const online = await isBackendAvailable();
      if (!mounted) return;
      setBackendOnline(online);
      if (online) {
        try {
          const res = await listPapers();
          if (!mounted) return;
          setPapers(res.papers || []);
          // Auto-select first exam/subject combo
          if (res.papers?.length > 0) {
            setSelectedExam(res.papers[0].exam_name);
            setSelectedSubject(res.papers[0].subject);
          }
        } catch {}
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  const handleRunAnalysis = async () => {
    if (!selectedExam || !selectedSubject) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const result = await runAnalysis(selectedExam, selectedSubject);
      setLiveAnalysis(result);
    } catch (err) {
      setAnalysisError(err.message || 'Analysis failed');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Get unique exams and subjects from papers
  const uniqueExams = [...new Set(papers.map(p => p.exam_name))];
  const uniqueSubjects = [...new Set(papers.filter(p => !selectedExam || p.exam_name === selectedExam).map(p => p.subject))];

  // Use live topic importance if available
  const liveTopicImportance = liveAnalysis?.important_questions?.map((q, i) => ({
    topic: q.topic,
    importance: Math.round(q.score * 100),
    frequency: q.years_seen?.length || 1,
    growth: 0,
  })) || null;

  return (
    <motion.div className="p-6 space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-400" /> Analytics Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Deep pattern analysis across all exam papers</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium border ${
          backendOnline ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
          backendOnline === false ? 'border-red-500/20 text-red-400 bg-red-500/5' : 'border-slate-700 text-slate-500'
        }`}>
          {backendOnline === null ? <Loader2 size={10} className="animate-spin" /> : backendOnline ? <Server size={10} /> : <WifiOff size={10} />}
          <span>{backendOnline === null ? 'Checking...' : backendOnline ? 'API Live' : 'Demo Mode'}</span>
        </div>
      </motion.div>

      {/* Backend Analysis Controls */}
      {backendOnline && papers.length > 0 && (
        <motion.div variants={item} className="glass-card p-5 rounded-2xl border border-indigo-500/20">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <PlayCircle size={16} className="text-indigo-400" />
            Run Live Analysis
          </h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Exam</label>
              <select value={selectedExam} onChange={e => { setSelectedExam(e.target.value); setSelectedSubject(''); }}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white outline-none appearance-none cursor-pointer">
                {uniqueExams.map(e => <option key={e} value={e} className="bg-slate-800">{e}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Subject</label>
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white outline-none appearance-none cursor-pointer">
                {uniqueSubjects.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
              </select>
            </div>
            <motion.button onClick={handleRunAnalysis} disabled={analysisLoading || !selectedExam || !selectedSubject}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              whileTap={{ scale: 0.95 }}>
              {analysisLoading ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</> : <><PlayCircle size={14} /> Run Analysis</>}
            </motion.button>
          </div>
          {analysisError && <p className="text-xs text-red-400 mt-2">⚠️ {analysisError}</p>}
          {liveAnalysis && (
            <div className="mt-3 flex gap-3">
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                ✓ {liveAnalysis.repeated_questions?.length || 0} repeated patterns
              </span>
              <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400">
                {liveAnalysis.topic_heatmap?.length || 0} topics mapped
              </span>
              <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">
                {liveAnalysis.important_questions?.length || 0} important questions
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Live Repeated Questions from Analysis */}
      {liveAnalysis?.repeated_questions?.length > 0 && (
        <motion.div variants={item} className="glass-card p-6 rounded-2xl border border-emerald-500/20">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Activity size={16} className="text-emerald-400" />
            Repeated Questions (Live Analysis)
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {liveAnalysis.repeated_questions.map((rq, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/20 transition-all">
                <p className="text-sm text-white">{rq.question_text}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{rq.topic}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{rq.frequency}x repeated</span>
                  <span className="text-[10px] text-slate-500">Years: {rq.years?.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Row 1: Trends + Marks Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-indigo-400" />
            Exam Pattern Evolution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearWiseTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="theory" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
              <Line type="monotone" dataKey="programming" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} />
              <Line type="monotone" dataKey="numerical" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
              <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {[
              { label: 'Theory', color: '#6366f1' }, { label: 'Programming', color: '#06b6d4' },
              { label: 'Numerical', color: '#10b981' }, { label: 'Total', color: '#f59e0b' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-0.5 rounded" style={{ background: l.color }} />{l.label}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Layers size={16} className="text-cyan-400" />
            Marks Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marksDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {marksDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 2: Weakness Radar + Topic Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Activity size={16} className="text-emerald-400" /> Weakness Radar
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={performanceData.weaknessRadar}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
              <PolarRadiusAxis stroke="rgba(255,255,255,0.1)" fontSize={10} />
              <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <GitBranch size={16} className="text-purple-400" />
            {liveTopicImportance ? 'Topic Importance (Live)' : 'Topic Importance Score'}
          </h3>
          <div className="space-y-3">
            {(liveTopicImportance || topicImportance).slice(0, 8).map((t, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300 font-medium">{t.topic}</span>
                  <div className="flex items-center gap-3">
                    {t.growth !== undefined && t.growth !== 0 && (
                      <span className={`text-[10px] ${t.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.growth >= 0 ? '↑' : '↓'} {Math.abs(t.growth)}%
                      </span>
                    )}
                    <span className="text-xs font-bold text-white">{t.importance}</span>
                  </div>
                </div>
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{
                    width: `${t.importance}%`,
                    background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})`
                  }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Row 3: Unit Weightage Pie */}
      <motion.div variants={item} className="glass-card p-6 rounded-2xl">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <PieIcon size={16} className="text-amber-400" /> Unit Weightage Distribution
        </h3>
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={unitWeightage} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="weight"
                label={({ name, weight }) => `${weight}%`}>
                {unitWeightage.map((entry, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3 w-full lg:w-auto">
            {unitWeightage.map((u, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                <div>
                  <p className="text-sm font-medium text-white">{u.unit}: {u.name}</p>
                  <p className="text-[10px] text-slate-500">{u.questions} questions • {u.weight}% weightage</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
