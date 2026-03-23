import { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import PageLoader from './components/PageLoader';
import BackendStatus from './components/BackendStatus';
import { useBackendStatus } from './hooks/useBackend';

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

  // Pseudo-analytics tracker for professional analytics module integration
  useEffect(() => {
    console.info(`[Analytics] Page View Logged: ${location.pathname}`);
  }, [location]);

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

      <div className="relative z-10 flex w-full h-screen overflow-hidden">
        {/* Semantic Sidebar Navigation with ARIA support inside */}
        <Sidebar collapsed={sidebarWidth < 240} />
        
        {/* Main Content Area */}
        <main 
          className="ml-[240px] flex-1 h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 flex flex-col items-stretch"
          role="main"
        >
          {/* Top status bar */}
          <div className="sticky top-0 z-30 flex items-center justify-end px-6 py-2 backdrop-blur-xl bg-[#0A0710]/60 border-b border-white/5">
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
