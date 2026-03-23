import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Check, X, ChevronLeft, ChevronRight, Shuffle, Brain } from 'lucide-react';
import { flashcards as flashcardsData } from '../data/mockData';

const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Flashcards() {
  const [cards, setCards] = useState(flashcardsData);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const cur = cards[idx];
  const mastered = cards.filter(c => c.mastered).length;

  const next = () => { setFlipped(false); setTimeout(() => setIdx((idx + 1) % cards.length), 150); };
  const prev = () => { setFlipped(false); setTimeout(() => setIdx((idx - 1 + cards.length) % cards.length), 150); };
  const toggleMaster = () => setCards(cards.map((c, i) => i === idx ? { ...c, mastered: !c.mastered } : c));
  const shuffle = () => { setCards([...cards].sort(() => Math.random() - 0.5)); setIdx(0); setFlipped(false); };

  return (
    <motion.div className="p-6 space-y-6" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BookOpen className="text-cyan-400" /> Flashcards</h1>
          <p className="text-slate-400 text-sm mt-1">Smart spaced repetition for exam mastery</p>
        </div>
        <button onClick={shuffle} className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl text-sm text-slate-400 hover:text-white"><Shuffle size={14} /> Shuffle</button>
      </motion.div>

      <motion.div variants={item} className="glass-card p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Progress: {mastered}/{cards.length} mastered</span>
          <span className="text-xs font-medium text-indigo-400">{Math.round((mastered / cards.length) * 100)}%</span>
        </div>
        <div className="confidence-bar"><div className="confidence-fill" style={{ width: `${(mastered / cards.length) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }} /></div>
      </motion.div>

      <motion.div variants={item} className="flex justify-center">
        <div className="w-full max-w-xl" style={{ perspective: 1000 }}>
          <motion.div className="relative cursor-pointer" onClick={() => setFlipped(!flipped)}
            style={{ transformStyle: 'preserve-3d', minHeight: 320 }}
            animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}>
            <div className="absolute inset-0 glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: 'hidden' }}>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6"><Brain size={28} className="text-indigo-400" /></div>
              <p className="text-lg font-semibold text-white">{cur?.front}</p>
              <span className="text-[10px] px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 mt-4">{cur?.topic}</span>
              <p className="text-xs text-slate-500 mt-3">Click to reveal</p>
            </div>
            <div className="absolute inset-0 glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6"><Check size={28} className="text-emerald-400" /></div>
              <p className="text-base text-slate-200 leading-relaxed">{cur?.back}</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex items-center justify-center gap-4">
        <button onClick={prev} className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-slate-400 hover:text-white"><ChevronLeft size={20} /></button>
        <button onClick={toggleMaster} className={`px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-medium ${cur?.mastered ? 'bg-emerald-500/20 text-emerald-400' : 'glass-card text-slate-400'}`}>
          {cur?.mastered ? <><Check size={16} /> Mastered</> : <><X size={16} /> Mark Mastered</>}
        </button>
        <button onClick={next} className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-slate-400 hover:text-white"><ChevronRight size={20} /></button>
      </motion.div>

      <motion.div variants={item} className="flex justify-center gap-2">
        {cards.map((c, i) => (
          <button key={c.id} onClick={() => { setIdx(i); setFlipped(false); }}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i === idx ? 'bg-indigo-500 scale-125' : c.mastered ? 'bg-emerald-500/50' : 'bg-slate-600'}`} />
        ))}
      </motion.div>
    </motion.div>
  );
}
