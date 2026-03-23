import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="flex h-full min-h-[500px] w-full items-center justify-center" role="status" aria-label="Loading page">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3"
      >
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium text-slate-400">Loading module...</p>
      </motion.div>
    </div>
  );
}
