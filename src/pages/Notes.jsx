import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Search, BookOpen, Zap, Calculator, FileCheck, Clock, Tag } from 'lucide-react';
import { notes } from '../data/mockData';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const typeConfig = {
  detailed: { icon: BookOpen, color: '#6366f1', label: 'Detailed Notes' },
  quick: { icon: Zap, color: '#06b6d4', label: 'Quick Reference' },
  formula: { icon: Calculator, color: '#10b981', label: 'Formula Sheet' },
  summary: { icon: FileCheck, color: '#f59e0b', label: 'Summary' },
  cheatsheet: { icon: FileText, color: '#ef4444', label: 'Cheat Sheet' },
};

export default function Notes() {
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = notes.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || n.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <motion.div className="p-6 space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-indigo-400" /> Smart Notes
          </h1>
          <p className="text-slate-400 text-sm mt-1">AI-generated notes, summaries, and formula sheets</p>
        </div>
        <motion.button
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={16} /> Generate New Notes
        </motion.button>
      </motion.div>

      {/* Search + Filters */}
      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[250px] flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl">
          <Search size={16} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm text-white placeholder-slate-500 w-full"
          />
        </div>
        <div className="flex gap-1 glass-card rounded-xl p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === 'all' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500'}`}
          >
            All
          </button>
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === key ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500'}`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((note, i) => {
          const cfg = typeConfig[note.type];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={note.id}
              className="glass-card p-5 rounded-2xl cursor-pointer group hover:border-indigo-500/30"
              onClick={() => setSelectedNote(selectedNote?.id === note.id ? null : note)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.color}15` }}>
                  <Icon size={18} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{note.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}15`, color: cfg.color }}>{cfg.label}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{note.content}</p>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Tag size={10} />
                  <span>{note.topic}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock size={10} />
                  <span>{note.createdAt}</span>
                </div>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {selectedNote?.id === note.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-white/5"
                  >
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
