import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Search, Filter, ChevronDown, Tag, Calendar, BarChart2, Hash, ArrowUpDown, Server, WifiOff, Loader2 } from 'lucide-react';
import { recentQuestions as mockQuestions, subjects as mockSubjects } from '../data/mockData';
import { isBackendAvailable, listPapers } from '../services/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const difficultyColor = {
  Easy: 'bg-emerald-500/10 text-emerald-400',
  Medium: 'bg-amber-500/10 text-amber-400',
  Hard: 'bg-red-500/10 text-red-400',
};

export default function Questions() {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [sortBy, setSortBy] = useState('year');
  const [backendOnline, setBackendOnline] = useState(null);
  const [livePapers, setLivePapers] = useState([]);

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
          setLivePapers(res.papers || []);
        } catch {}
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  const questions = mockQuestions;
  const subjects = backendOnline && livePapers.length > 0
    ? [...new Set(livePapers.map(p => p.subject))]
    : mockSubjects;

  const filtered = questions
    .filter(q => {
      const matchSearch = q.text.toLowerCase().includes(search.toLowerCase());
      const matchSubject = selectedSubject === 'All' || q.subject === selectedSubject;
      return matchSearch && matchSubject;
    })
    .sort((a, b) => {
      if (sortBy === 'year') return b.year - a.year;
      if (sortBy === 'marks') return b.marks - a.marks;
      if (sortBy === 'repeats') return b.repeats - a.repeats;
      return 0;
    });

  return (
    <motion.div className="p-6 space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Question Bank</h1>
          <p className="text-slate-400 text-sm mt-1">Analyzed questions from past papers with AI-powered insights</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium border ${
          backendOnline ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
          backendOnline === false ? 'border-red-500/20 text-red-400 bg-red-500/5' : 'border-slate-700 text-slate-500'
        }`}>
          {backendOnline === null ? <Loader2 size={10} className="animate-spin" /> : backendOnline ? <Server size={10} /> : <WifiOff size={10} />}
          <span>{backendOnline === null ? 'Checking...' : backendOnline ? 'API Live' : 'Demo Mode'}</span>
        </div>
      </motion.div>

      {/* Live Papers Info */}
      {backendOnline && livePapers.length > 0 && (
        <motion.div variants={item} className="glass-card p-4 rounded-2xl border border-emerald-500/20">
          <p className="text-xs text-emerald-400 font-medium mb-2">📡 {livePapers.length} papers found in backend</p>
          <div className="flex gap-2 flex-wrap">
            {livePapers.map((p, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-white/[0.03] border border-white/5 text-slate-400">
                {p.exam_name} • {p.subject} ({p.year}) — {p.questions_extracted} Qs
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[250px] flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl">
          <Search size={16} className="text-slate-500" />
          <input type="text" placeholder="Search questions semantically..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm text-white placeholder-slate-500 w-full" />
        </div>
        <div className="relative">
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
            className="appearance-none px-4 py-2.5 pr-9 glass-card rounded-xl text-sm text-white bg-transparent outline-none cursor-pointer">
            <option value="All" className="bg-slate-800">All Subjects</option>
            {subjects.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
        <div className="flex items-center gap-1 glass-card rounded-xl p-1">
          {['year', 'marks', 'repeats'].map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${sortBy === s ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div variants={item} className="flex gap-4">
        {[
          { label: 'Total Questions', value: questions.length, icon: Hash },
          { label: 'Subjects', value: new Set(questions.map(q => q.subject)).size, icon: Tag },
          { label: 'Years Covered', value: new Set(questions.map(q => q.year)).size, icon: Calendar },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl">
            <s.icon size={14} className="text-indigo-400" />
            <span className="text-xs text-slate-400">{s.label}:</span>
            <span className="text-sm font-semibold text-white">{s.value}</span>
          </div>
        ))}
      </motion.div>

      {/* Questions List */}
      <motion.div variants={item} className="space-y-3">
        {filtered.map((q, i) => (
          <motion.div key={q.id} className="glass-card p-5 rounded-2xl hover:border-indigo-500/30 transition-all cursor-pointer group"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-indigo-400">
                Q{q.id}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white group-hover:text-indigo-300 transition-colors leading-relaxed">{q.text}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{q.subject}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${difficultyColor[q.difficulty]}`}>{q.difficulty}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400">Unit {q.unit}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">{q.marks} marks</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{q.year}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-orange-400">
                  <BarChart2 size={14} />
                  <span className="text-sm font-bold">{q.repeats}x</span>
                </div>
                <span className="text-[10px] text-slate-500">repeated</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
