import { useState, useEffect, useCallback, useRef } from 'react';
import { scheduleService } from '../services/scheduleService';
import { Schedule } from '../types/schedule';
import { useToast } from '../context/ToastContext';

interface UseScheduleReturn {
  schedule: Schedule | null;
  loading: boolean;
  error: string | null;
  refreshSchedule: () => Promise<void>;
}

export const useSchedule = (id: string | number): UseScheduleReturn => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { showToast } = useToast();
  const mountedRef = useRef(true);
  const lastIdRef = useRef<string | number>('');

  const fetchSchedule = useCallback(async () => {
    if (!id) {
      setSchedule(null);
      setLoading(false);
      return;
    }

    // Skip if same ID and we already have data
    if (lastIdRef.current === id && schedule) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await scheduleService.getSchedule(id);

      // Check if component is still mounted
      if (!mountedRef.current) return;

      if (response.errors) {
        setError(response.errors.join(', '));
        showToast('Failed to fetch schedule', 'error');
        return;
      }

      if (response.data) {
        setSchedule(response.data);
        lastIdRef.current = id;
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError('Failed to fetch schedule');
      showToast('Failed to fetch schedule', 'error');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [id, showToast, schedule]);

  const refreshSchedule = useCallback(async () => {
    lastIdRef.current = ''; // Reset to force refresh
    await fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    fetchSchedule();
  }, [id]); // Only depend on id

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    schedule,
    loading,
    error,
    refreshSchedule,
  };
};