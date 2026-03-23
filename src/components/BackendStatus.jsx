import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Server } from 'lucide-react';

/**
 * Small pill that shows backend connection status.
 * Green = connected, Red = disconnected/mock mode.
 */
export default function BackendStatus({ connected, checking, onRecheck }) {
  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer"
      style={{
        background: connected
          ? 'rgba(16, 185, 129, 0.08)'
          : 'rgba(239, 68, 68, 0.08)',
        borderColor: connected
          ? 'rgba(16, 185, 129, 0.2)'
          : 'rgba(239, 68, 68, 0.2)',
        color: connected ? '#10b981' : '#ef4444',
      }}
      onClick={onRecheck}
      whileTap={{ scale: 0.95 }}
      title={connected ? 'Backend connected — click to refresh' : 'Backend offline — using mock data. Click to retry.'}
    >
      {checking ? (
        <RefreshCw size={11} className="animate-spin" />
      ) : connected ? (
        <Server size={11} />
      ) : (
        <WifiOff size={11} />
      )}
      <span>{checking ? 'Checking...' : connected ? 'API Live' : 'Mock Mode'}</span>
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: connected ? '#10b981' : '#ef4444' }}
      />
    </motion.div>
  );
}
