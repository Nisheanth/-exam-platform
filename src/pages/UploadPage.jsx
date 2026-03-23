import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Image, FileSpreadsheet, CheckCircle2, AlertCircle, X, Loader2, Server, WifiOff } from 'lucide-react';
import { uploadPaper, getPaperStatus, isBackendAvailable } from '../services/api';

const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Data Structures', 'Operating Systems', 'DBMS', 'Computer Networks', 'Machine Learning'];
const EXAM_NAMES = ['NEET', 'JEE Main', 'JEE Advanced', 'GATE', 'University Exam', 'Board Exam', 'Other'];

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null);

  // Form state for metadata
  const [subject, setSubject] = useState('Physics');
  const [year, setYear] = useState(new Date().getFullYear());
  const [examName, setExamName] = useState('NEET');

  // Check backend on first interaction
  const checkBackend = useCallback(async () => {
    if (backendOnline === null) {
      const ok = await isBackendAvailable();
      setBackendOnline(ok);
      return ok;
    }
    return backendOnline;
  }, [backendOnline]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer?.files || []);
    addFiles(dropped);
  }, [subject, year, examName, backendOnline]);

  const updateFileState = (fileId, updates) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, ...updates } : f));
  };

  // Poll backend for processing status
  const pollStatus = async (fileId, paperId) => {
    let attempts = 0;
    const maxAttempts = 60; // poll for up to 5 minutes (5s intervals)
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        updateFileState(fileId, { status: 'failed', errorMsg: 'Processing timed out' });
        return;
      }
      attempts++;

      try {
        const statusRes = await getPaperStatus(paperId);
        
        if (statusRes.status === 'complete') {
          updateFileState(fileId, {
            status: 'complete',
            progress: 100,
            questions: statusRes.questions_extracted,
          });
        } else if (statusRes.status === 'failed') {
          updateFileState(fileId, {
            status: 'failed',
            errorMsg: statusRes.error || 'Processing failed',
          });
        } else {
          // Still processing — update progress estimate
          const estimatedProgress = Math.min(15 + attempts * 3, 95);
          updateFileState(fileId, { progress: estimatedProgress });
          setTimeout(poll, 5000);
        }
      } catch (err) {
        updateFileState(fileId, { status: 'failed', errorMsg: 'Lost connection to server' });
      }
    };

    setTimeout(poll, 3000); // first check after 3s
  };

  const addFiles = async (newFiles) => {
    const online = await checkBackend();

    const mapped = newFiles.map(f => ({
      id: Date.now() + Math.random(),
      file: f, // keep raw File reference
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type || 'application/pdf',
      status: 'uploading',
      progress: 0,
      subject: subject,
      year: year,
      examName: examName,
      questions: 0,
      paperId: null,
      taskId: null,
      errorMsg: null,
    }));

    setFiles(prev => [...prev, ...mapped]);

    for (const fileEntry of mapped) {
      if (online) {
        // ── Real backend upload ───────────────────────────────────────
        try {
          updateFileState(fileEntry.id, { status: 'uploading', progress: 10 });
          
          const response = await uploadPaper(
            fileEntry.file,
            fileEntry.subject,
            fileEntry.year,
            fileEntry.examName,
          );

          updateFileState(fileEntry.id, {
            status: 'processing',
            progress: 15,
            paperId: response.paper_id,
            taskId: response.task_id,
          });

          // Start polling for processing status
          pollStatus(fileEntry.id, response.paper_id);

        } catch (err) {
          updateFileState(fileEntry.id, {
            status: 'failed',
            errorMsg: err.message || 'Upload failed',
          });
        }
      } else {
        // ── Mock upload (offline mode) ────────────────────────────────
        let prog = 0;
        const interval = setInterval(() => {
          prog += Math.random() * 20;
          if (prog >= 100) {
            prog = 100;
            clearInterval(interval);
            updateFileState(fileEntry.id, {
              status: 'complete',
              progress: 100,
              questions: 15 + Math.floor(Math.random() * 25),
            });
          } else {
            updateFileState(fileEntry.id, { progress: Math.min(prog, 99) });
          }
        }, 400);
      }
    }
  };

  const iconFor = (type) => {
    if (type.includes('image')) return <Image size={18} className="text-purple-400" />;
    if (type.includes('spreadsheet') || type.includes('csv')) return <FileSpreadsheet size={18} className="text-emerald-400" />;
    return <FileText size={18} className="text-indigo-400" />;
  };

  return (
    <motion.div className="p-6 space-y-6" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Upload className="text-emerald-400" /> Upload Papers</h1>
          <p className="text-slate-400 text-sm mt-1">Upload past question papers for AI analysis — PDF, images, scanned docs supported</p>
        </div>
        {/* Backend Status Pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium border ${
          backendOnline === null ? 'border-slate-700 text-slate-500' :
          backendOnline ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
          'border-amber-500/20 text-amber-400 bg-amber-500/5'
        }`}>
          {backendOnline === null ? (
            <><Loader2 size={11} className="animate-spin" /> Checking backend...</>
          ) : backendOnline ? (
            <><Server size={11} /> Backend Connected</>
          ) : (
            <><WifiOff size={11} /> Mock Mode (Backend Offline)</>
          )}
        </div>
      </motion.div>

      {/* Upload Metadata Form */}
      <motion.div variants={item} className="glass-card p-5 rounded-2xl">
        <h3 className="text-sm font-semibold text-white mb-3">Paper Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Exam Name</label>
            <select
              value={examName}
              onChange={e => setExamName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white outline-none focus:border-indigo-500/30 appearance-none cursor-pointer"
            >
              {EXAM_NAMES.map(e => <option key={e} value={e} className="bg-slate-800">{e}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white outline-none focus:border-indigo-500/30 appearance-none cursor-pointer"
            >
              {SUBJECTS.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())}
              min={1900}
              max={2100}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white outline-none focus:border-indigo-500/30"
            />
          </div>
        </div>
      </motion.div>

      {/* Drop Zone */}
      <motion.div variants={item}
        onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${dragOver ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 hover:border-indigo-500/30'}`}
        onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.multiple = true; input.accept = '.pdf,.png,.jpg,.jpeg,.tiff,.tif,.bmp,.webp'; input.onchange = (e) => addFiles(Array.from(e.target.files)); input.click(); }}
      >
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
          <Upload size={28} className="text-indigo-400" />
        </div>
        <p className="text-white font-medium">Drop files here or click to browse</p>
        <p className="text-slate-500 text-sm mt-2">Supports PDF, Images (JPG, PNG, TIFF, BMP, WebP)</p>
        <div className="flex justify-center gap-4 mt-4">
          {['OCR Processing', 'Auto-detect Subject', 'Question Extraction'].map(f => (
            <span key={f} className="text-[10px] px-3 py-1 rounded-full bg-white/[0.03] text-slate-400 border border-white/5">{f}</span>
          ))}
        </div>
      </motion.div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <motion.div variants={item} className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Processing Queue</h3>
          {files.map(file => (
            <motion.div key={file.id} className="glass-card p-4 rounded-2xl" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center">{iconFor(file.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                    <span className="text-[10px] text-slate-500">{file.size}</span>
                  </div>
                  {file.status === 'uploading' ? (
                    <div className="mt-2">
                      <div className="confidence-bar"><div className="confidence-fill" style={{ width: `${file.progress}%`, background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} /></div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-400"><Loader2 size={10} className="animate-spin" /> Uploading... {Math.round(file.progress)}%</div>
                    </div>
                  ) : file.status === 'processing' ? (
                    <div className="mt-2">
                      <div className="confidence-bar"><div className="confidence-fill" style={{ width: `${file.progress}%`, background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }} /></div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-400"><Loader2 size={10} className="animate-spin" /> Processing (OCR + AI)... {Math.round(file.progress)}%</div>
                    </div>
                  ) : file.status === 'failed' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Failed</span>
                      <span className="text-[10px] text-red-400/70">{file.errorMsg}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">✓ Complete</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{file.subject}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{file.year}</span>
                      <span className="text-[10px] text-slate-500">{file.questions} questions extracted</span>
                      {file.paperId && <span className="text-[10px] text-slate-600 font-mono">ID: {String(file.paperId).slice(0,8)}…</span>}
                    </div>
                  )}
                </div>
                <button onClick={() => setFiles(files.filter(f => f.id !== file.id))} className="text-slate-600 hover:text-red-400"><X size={16} /></button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
