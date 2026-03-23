/**
 * Custom hooks for backend integration.
 * Provides connection status + data fetching with graceful fallback.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { isBackendAvailable } from '../services/api';

/**
 * Tracks whether the backend is reachable.
 * Polls every 30 seconds.
 */
export function useBackendStatus() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    try {
      const ok = await isBackendAvailable();
      setConnected(ok);
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [check]);

  return { connected, checking, recheck: check };
}

/**
 * Generic data-fetching hook with loading/error state.
 * @param {Function} fetchFn - Async function that returns data
 * @param {Array} deps - Dependencies to trigger refetch
 * @param {*} fallback - Fallback data if fetch fails
 */
export function useApiData(fetchFn, deps = [], fallback = null) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (mountedRef.current) {
        setData(result);
        setIsLive(true);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setIsLive(false);
        if (fallback !== null) {
          setData(fallback);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, fallback]);

  useEffect(() => {
    mountedRef.current = true;
    refetch();
    return () => { mountedRef.current = false; };
  }, [...deps, refetch]);

  return { data, loading, error, isLive, refetch };
}
