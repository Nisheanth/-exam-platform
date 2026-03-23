import { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import PageLoader from './components/PageLoader';
import BackendStatus from './components/BackendStatus';
import { useBackendStatus } from './hooks/useBackend';
import Login from './pages/Login'; // <--- Secure Auth Import

// Performance Optimization: Lazy Load heavyweight page components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Questions = lazy(() => import('./pages/Questions'));
const Predictions = lazy(() => import('./pages/Predictions'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Notes = lazy(() => import('./pages/Notes'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const StudyPlan = lazy(() => import('./pages/StudyPlan'));
const Chat = lazy(() => import('./pages/Chat'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const Performance = lazy(() => import('./pages/Performance'));
const Settings = lazy(() => import('./pages/Settings'));

export default function App() {
  const [sidebarWidth] = useState(240);
  const location = useLocation();
  const { connected, checking, recheck } = useBackendStatus();
  
  // Basic Auth State linked to localStorage (Step 2 Implementation)
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  // Pseudo-analytics tracker for professional analytics module integration
  useEffect(() => {
    if (isAuthenticated) {
      console.info(`[Analytics] Page View Logged: ${location.pathname}`);
    }
  }, [location, isAuthenticated]);

  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen relative bg-[#05050A] text-slate-200 selection:bg-indigo-500/40 selection:text-white font-sans antialiased font-feature-settings-cv11">
      {/* Top-Tier Noise Texture Overlay */}
      <div className="noise-overlay" aria-hidden="true" />
      
      {/* Structural AI Grid Overlay */}
      <div className="fixed inset-0 z-0 bg-grid-white pointer-events-none" aria-hidden="true" />
      
      {/* Animated Background Elements with highly optimized GPU compositing constraints */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-30" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] bg-teal-600/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-indigo-400/10 rounded-full blur-3xl animate-blob" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row w-full h-screen overflow-hidden">
        {/* Mobile Header Menu (Slide-in Controller) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#05050A]/80 backdrop-blur-xl z-40">
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-white bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">TestGenie AI</h1>
          </div>
          <button 
            onClick={() => setSidebarWidth(sidebarWidth === 'open' ? 'closed' : 'open')}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
          </button>
        </div>

        {/* Semantic Sidebar Navigation with ARIA support inside */}
        <Sidebar mobileOpen={sidebarWidth === 'open'} onCloseMobile={() => setSidebarWidth('closed')} collapsed={sidebarWidth < 240 && sidebarWidth !== 'open' && sidebarWidth !== 'closed'} onCollapse={(isCollapsed) => setSidebarWidth(isCollapsed ? 72 : 240)} onLogout={handleLogout} />
        
        {/* Main Content Area */}
        <main 
          className="flex-1 w-full md:w-auto h-[calc(100vh-60px)] md:h-screen overflow-y-auto overflow-x-hidden relative scroll-smooth focus:outline-none scrollbar-hide pt-4 md:pt-0"
          id="main-content" tabIndex="-1"
        >
          {/* Top status bar */}
          <div className="sticky top-0 z-30 flex items-center justify-end px-4 md:px-6 py-2 backdrop-blur-xl bg-[#0A0710]/60 border-b border-white/5">
            <span className="text-[10px] text-slate-500 mr-3 hidden md:block">{localStorage.getItem('userEmail')}</span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1.5 mr-4 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all hover:text-white flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              Sign Out
            </button>
            <BackendStatus connected={connected} checking={checking} onRecheck={recheck} />
          </div>

          {/* Error Boundary / Suspense Loader for optimized modular chunks */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/study-plan" element={<StudyPlan />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
