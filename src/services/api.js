/**
 * API Service Layer — connects the React frontend to the FastAPI backend.
 * Base URL defaults to localhost:8000 (the backend dev server).
 * Falls back gracefully to mock data when backend is unreachable.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Helper ──────────────────────────────────────────────────────────────────

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  // Remove Content-Type for FormData (browser sets it automatically with boundary)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const res = await fetch(url, config);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || body.detail || res.statusText, body);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
    this.name = 'ApiError';
  }
}

// ─── Health ──────────────────────────────────────────────────────────────────

export async function healthCheck() {
  return request('/health');
}

/**
 * Check if backend is reachable. Returns true/false.
 */
export async function isBackendAvailable() {
  try {
    await healthCheck();
    return true;
  } catch {
    return false;
  }
}

// ─── Papers ──────────────────────────────────────────────────────────────────

/**
 * Upload an exam paper for processing.
 * @param {File} file - The file to upload
 * @param {string} subject - Subject name
 * @param {number} year - Exam year
 * @param {string} examName - Exam name
 * @returns {Promise<{paper_id, status, task_id}>}
 */
export async function uploadPaper(file, subject, year, examName) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subject', subject);
  formData.append('year', String(year));
  formData.append('exam_name', examName);

  return request('/api/papers/upload', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Get the processing status of a paper.
 * @param {string} paperId - UUID of the paper
 * @returns {Promise<{paper_id, status, questions_extracted, error}>}
 */
export async function getPaperStatus(paperId) {
  return request(`/api/papers/${paperId}/status`);
}

/**
 * List papers with optional filters.
 * @param {{ examName?: string, subject?: string, year?: number }} filters
 * @returns {Promise<{papers: Array}>}
 */
export async function listPapers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.examName) params.append('exam_name', filters.examName);
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.year) params.append('year', String(filters.year));
  const qs = params.toString();
  return request(`/api/papers${qs ? '?' + qs : ''}`);
}

/**
 * Delete a paper and its questions.
 * @param {string} paperId
 */
export async function deletePaper(paperId) {
  return request(`/api/papers/${paperId}`, { method: 'DELETE' });
}

// ─── Analysis ────────────────────────────────────────────────────────────────

/**
 * Run pattern analysis for an exam/subject.
 * @param {string} examName
 * @param {string} subject
 * @returns {Promise<{analysis_id, repeated_questions, topic_heatmap, important_questions}>}
 */
export async function runAnalysis(examName, subject) {
  return request('/api/analysis/run', {
    method: 'POST',
    body: JSON.stringify({ exam_name: examName, subject }),
  });
}

/**
 * Fetch a previously computed analysis by ID.
 * @param {string} analysisId
 */
export async function getAnalysis(analysisId) {
  return request(`/api/analysis/${analysisId}`);
}

// ─── Predictions ─────────────────────────────────────────────────────────────

/**
 * Generate AI-powered exam predictions.
 * @param {string} examName
 * @param {string} subject
 * @param {string} analysisId - UUID of a completed analysis
 * @returns {Promise<{predictions, overdue_topics, strategy_tip}>}
 */
export async function generatePredictions(examName, subject, analysisId) {
  return request('/api/predict', {
    method: 'POST',
    body: JSON.stringify({
      exam_name: examName,
      subject,
      analysis_id: analysisId,
    }),
  });
}

// ─── Chat ────────────────────────────────────────────────────────────────────

/**
 * Send a message to the AI Study Tutor.
 * @param {string} message - User message
 * @param {Array} history - Array of {role: 'user'|'ai', content: ''}
 * @param {string} examContext - Optional exam and subject context
 * @returns {Promise<{response: string}>}
 */
export async function chatWithTutor(message, history = [], examContext = null) {
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      history,
      exam_context: examContext
    })
  });
}

// ─── Export all ───────────────────────────────────────────────────────────────
const api = {
  healthCheck,
  isBackendAvailable,
  uploadPaper,
  getPaperStatus,
  listPapers,
  deletePaper,
  runAnalysis,
  getAnalysis,
  generatePredictions,
  chatWithTutor,
};

export default api;
