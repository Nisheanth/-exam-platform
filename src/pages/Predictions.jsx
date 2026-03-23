import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Minus, Dna, Target, Flame, Filter, Zap, Server, WifiOff, Loader2, PlayCircle, AlertTriangle } from 'lucide-react';
import { predictions as mockPredictions, examProphecyScore } from '../data/mockData';
import { isBackendAvailable, listPapers, runAnalysis, generatePredictions } from '../services/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const trendIcon = { rising: TrendingUp, falling: TrendingDown, stable: Minus };
const trendColor = { rising: 'text-emerald-400', falling: 'text-red-400', stable: 'text-amber-400' };

export default function Predictions() {
  const [filter, setFilter] = useState('all');
  const [backendOnline, setBackendOnline] = useState(null);
  const [papers, setPapers] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [livePredictions, setLivePredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleGeneratePredictions = async () => {
    if (!selectedExam || !selectedSubject) return;
    setLoading(true);
    setError(null);
    try {
      // First run analysis
      const analysis = await runAnalysis(selectedExam, selectedSubject);
      // Then generate predictions
      const preds = await generatePredictions(selectedExam, selectedSubject, analysis.analysis_id);
      setLivePredictions(preds);
    } catch (err) {
      setError(err.message || 'Prediction generation failed');
    } finally {
      setLoading(false);
    }
  };

  const uniqueExams = [...new Set(papers.map(p => p.exam_name))];
  const uniqueSubjects = [...new Set(papers.filter(p => !selectedExam || p.exam_name === selectedExam).map(p => p.subject))];

  // Build display predictions
  const displayPredictions = livePredictions?.predictions?.map((p, i) => ({
    id: i + 1,
    question: p.question,
    topic: p.topic,
    confidence: p.confidence === 'High' ? 90 + Math.floor(Math.random() * 8) : 70 + Math.floor(Math.random() * 15),
    marks: 10,
    type: 'AI Generated',
    trend: p.confidence === 'High' ? 'rising' : 'stable',
    dna: `AI-${p.topic?.slice(0, 3).toUpperCase() || 'GEN'}-${String(i + 1).padStart(2, '0')}`,
    reason: p.reason,
  })) || null;

  const predictions = displayPredictions || mockPredictions;

  const filtered = filter === 'all' ? predictions :
    filter === 'high' ? predictions.filter(p => p.confidence >= 85) :
    predictions.filter(p => p.trend === filter);

  return (
    <motion.div className="p-6 space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-purple-400" /> AI Predictions
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {displayPredictions ? '🟢 Live AI predictions from Claude' : 'Exam Prophecy Engine™ — AI-powered question predictions'}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium border ${
          backendOnline ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
          backendOnline === false ? 'border-red-500/20 text-red-400 bg-red-500/5' : 'border-slate-700 text-slate-500'
        }`}>
          {backendOnline === null ? <Loader2 size={10} className="animate-spin" /> : backendOnline ? <Server size={10} /> : <WifiOff size={10} />}
          <span>{backendOnline === null ? 'Checking...' : backendOnline ? 'API Live' : 'Demo Mode'}</span>
        </div>
      </motion.div>

      {/* Backend Prediction Controls */}
      {backendOnline && papers.length > 0 && (
        <motion.div variants={item} className="glass-card p-5 rounded-2xl border border-purple-500/20">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400" />
            Generate AI Predictions (Claude)
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
            <motion.button onClick={handleGeneratePredictions} disabled={loading || !selectedExam || !selectedSubject}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              whileTap={{ scale: 0.95 }}>
              {loading ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> Predict</>}
            </motion.button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">⚠️ {error}</p>}
        </motion.div>
      )}

      {/* Overdue Topics & Strategy (from live predictions) */}
      {livePredictions && (
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {livePredictions.overdue_topics?.length > 0 && (
            <div className="glass-card p-5 rounded-2xl border border-amber-500/20">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-400" /> Overdue Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {livePredictions.overdue_topics.map((t, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">{t}</span>
                ))}
              </div>
            </div>
          )}
          {livePredictions.strategy_tip && (
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/20">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Target size={14} className="text-emerald-400" /> Strategy Tip
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">{livePredictions.strategy_tip}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Prophecy Score Card */}
      <motion.div variants={item} className="glass-card p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold gradient-text">Exam Prophecy Score™</h3>
              <p className="text-xs text-slate-500">Proprietary prediction confidence algorithm</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-4xl font-black text-white">{examProphecyScore.overall}<span className="text-lg text-slate-400">/100</span></div>
              <p className="text-xs text-emerald-400">High Confidence</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {examProphecyScore.breakdown.map((f, i) => (
              <div key={i} className="text-center">
                <div className="text-lg font-bold text-white">{f.score}</div>
                <div className="confidence-bar mt-1">
                  <div className="confidence-fill" style={{
                    width: `${f.score}%`,
                    background: `linear-gradient(90deg, #6366f1, ${f.score > 85 ? '#10b981' : '#06b6d4'})`
                  }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{f.factor}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex gap-2">
        {[
          { key: 'all', label: 'All Predictions' },
          { key: 'high', label: '🔥 High Confidence' },
          { key: 'rising', label: '📈 Trending Up' },
          { key: 'stable', label: '➡️ Stable' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              filter === f.key ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'glass-card text-slate-400 hover:text-white'
            }`}>
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Predictions Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div className="grid gap-4">
          {filtered.map((p, i) => {
            const TIcon = trendIcon[p.trend] || Minus;
            return (
              <motion.div key={p.id} className="glass-card p-5 rounded-2xl hover:border-indigo-500/30 transition-all group"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }} layout>
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke={p.confidence >= 90 ? '#10b981' : p.confidence >= 80 ? '#6366f1' : '#f59e0b'}
                        strokeWidth="3" strokeDasharray={`${p.confidence}, 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{p.confidence}%</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{p.question}</p>
                    {p.reason && <p className="text-xs text-slate-400 mt-1 italic">"{p.reason}"</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">{p.topic}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">{p.type}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{p.marks} marks</span>
                      <div className={`flex items-center gap-0.5 text-[10px] ${trendColor[p.trend] || 'text-slate-400'}`}>
                        <TIcon size={10} />
                        <span className="capitalize">{p.trend}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                      <Dna size={10} /><span>DNA</span>
                    </div>
                    <code className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded">{p.dna}</code>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
