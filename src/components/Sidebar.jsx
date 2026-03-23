import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Brain, Sparkles, FileText, BarChart3,
  MessageCircle, Upload, Target, BookOpen, Zap, Settings, ChevronLeft, ChevronRight, Sun, Moon,
  Wand2, Library
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import logoImg from '../assets/testgenie-logo.png';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/questions', icon: Brain, label: 'Questions' },
  { path: '/predictions', icon: Sparkles, label: 'Predictions' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/notes', icon: FileText, label: 'Smart Notes' },
  { path: '/flashcards', icon: BookOpen, label: 'Flashcards' },
  { path: '/study-plan', icon: Target, label: 'Study Plan' },
  { path: '/chat', icon: MessageCircle, label: 'AI Tutor' },
  { path: '/upload', icon: Upload, label: 'Upload Papers' },
  { path: '/performance', icon: Zap, label: 'Performance' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 1 }}
      className="fixed left-0 top-0 h-screen bg-[#05050A]/80 backdrop-blur-3xl border-r border-[#ffffff0a] z-50 flex flex-col"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5 overflow-hidden">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative group">
          <div className="absolute inset-0 bg-amber-400/20 rounded-2xl blur-lg group-hover:bg-amber-400/40 transition-all duration-500" />
          <img 
            src={logoImg} 
            alt="TestGenie AI Logo" 
            className="w-full h-full object-cover rounded-2xl border border-amber-400/30 relative z-10 shadow-[0_0_15px_rgba(251,191,36,0.3)] group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <h1 className="text-[16px] font-black text-white tracking-tight leading-none bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent truncate">TestGenie AI</h1>
            <p className="text-[9px] text-amber-500/80 font-bold uppercase tracking-[0.2em] mt-1 truncate">Magic Scholar Engine</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" aria-label="Main Navigation">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-3' : ''}`
            }
            title={collapsed ? label : undefined}
            aria-label={label}
            aria-current={({ isActive }) => isActive ? 'page' : undefined}
          >
            <Icon size={18} aria-hidden="true" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all text-sm"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> <span>Collapse</span></>}
        </button>
      </div>

      {/* Settings & Theme */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <NavLink to="/settings" className={`sidebar-link ${collapsed ? 'justify-center px-3' : ''}`} aria-label="Settings">
          <Settings size={18} aria-hidden="true" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        
        <button 
          onClick={() => alert("Theme changing module will be activated upon backend persistence completion.")}
          className={`w-full sidebar-link ${collapsed ? 'justify-center px-3' : ''}`}
          aria-label="Toggle dark mode"
        >
          <Sun size={18} aria-hidden="true" />
          {!collapsed && <span>Light Mode</span>}
        </button>
      </div>
    </motion.aside>
  );
}
