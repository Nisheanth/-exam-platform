import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Bot, User, Sparkles, AlertCircle, RefreshCw, Server, WifiOff, Loader2 } from 'lucide-react';
import { chatMessages as initialMessages, aiResponses as mockResponses } from '../data/mockData';
import { isBackendAvailable, chatWithTutor } from '../services/api';

const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Chat() {
  const [messages, setMessages] = useState(initialMessages.slice(0, 2)); // Start with just greeting
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function checkBackend() {
      const online = await isBackendAvailable();
      if (mounted) setBackendOnline(online);
    }
    checkBackend();
    return () => { mounted = false; };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const sendMessage = async () => {
    if (!input.trim() || typing) return;
    
    const userMsg = { id: Date.now(), role: 'user', content: input.trim() };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInput('');
    setTyping(true);

    try {
      if (backendOnline) {
        // Build history payload (exclude the current message)
        const historyPayload = messages.map(m => ({
          role: m.role,
          content: m.content
        }));

        const res = await chatWithTutor(userMsg.content, historyPayload, 'Computer Science / Engineering Exam');
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: res.response }]);
      } else {
        // Fallback to mock responses if backend is offline
        await new Promise(r => setTimeout(r, 1500));
        const aiMsg = { 
          id: Date.now() + 1, 
          role: 'ai', 
          content: mockResponses?.[Math.floor(Math.random() * mockResponses?.length)] || "I'm currently in offline mode, but I can help you with basic questions!"
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: `⚠️ Error: ${err.message || 'Could not reach AI Tutor.'}` }]);
    } finally {
      setTyping(false);
    }
  };

  const suggestions = ['Explain B+ Tree insertions', 'What are the most predicted topics?', 'Generate notes on SQL JOINs', 'Compare TCP and UDP'];

  return (
    <motion.div className="p-6 h-[calc(100vh-0px)] flex flex-col max-w-5xl mx-auto w-full" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={item} className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="text-purple-400" /> AI Study Tutor
          </h1>
          <p className="text-slate-400 text-sm mt-1">Socratic AI assistant — context-aware from your papers</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium border ${
          backendOnline ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
          backendOnline === false ? 'border-red-500/20 text-red-400 bg-red-500/5' : 'border-slate-700 text-slate-500'
        }`}>
          {backendOnline === null ? <Loader2 size={10} className="animate-spin" /> : backendOnline ? <Server size={10} /> : <WifiOff size={10} />}
          <span>{backendOnline === null ? 'Checking...' : backendOnline ? 'Claude API Live' : 'Demo Mode'}</span>
        </div>
      </motion.div>

      {/* Chat area */}
      <motion.div variants={item} className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-white/5">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map(msg => (
            <motion.div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto justify-end' : ''}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-indigo-500/20">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm shadow-md' 
                  : 'bg-white/[0.03] border border-white/10 text-slate-200 rounded-tl-sm'
                }`}>
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1 border border-cyan-500/30">
                  <User size={16} className="text-cyan-400" />
                </div>
              )}
            </motion.div>
          ))}
          {typing && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white/[0.03] border border-white/10 px-4 py-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-2" />
        </div>

        {/* Suggestions */}
        <div className="px-6 pb-4 pt-2 flex gap-2 overflow-x-auto custom-scrollbar shadow-[0_-10px_20px_rgba(15,23,42,0.8)] z-10">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => setInput(s)}
              className="px-4 py-2 rounded-xl text-[12px] font-medium text-slate-300 bg-white/[0.03] border border-white/10 hover:border-purple-500/40 hover:text-purple-300 hover:bg-purple-500/5 transition-all whitespace-nowrap shadow-sm">
              <Sparkles size={12} className="inline flex-shrink-0 mr-1.5 text-purple-400" />{s}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="p-5 border-t border-white/5 bg-slate-900/50 backdrop-blur-md">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
              <textarea 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask your AI Tutor to explain complex topics, or challenge you with mock questions..."
                className="w-full px-4 py-3 bg-transparent text-sm text-white placeholder-slate-500 outline-none resize-none max-h-32 min-h-[50px] custom-scrollbar"
                rows={1}
              />
            </div>
            <motion.button 
              onClick={sendMessage} 
              disabled={!input.trim() || typing}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/40 transition-shadow">
              <Send size={18} className="translate-x-0.5" />
            </motion.button>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-3 font-medium">AI Tutor uses Claude to generate Socratic analysis. Always verify critical facts.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
