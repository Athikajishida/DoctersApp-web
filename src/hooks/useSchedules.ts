import { useState, useEffect, useCallback, useRef } from 'react';
import { scheduleService } from '../services/scheduleService';
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '../types/schedule';
import { useToast } from '../context/ToastContext';

interface UseSchedulesParams {
  page?: number;
  per_page?: number;
  status?: string;
  day?: string;
  includeGeneral?: boolean; // Include general recurring schedules
  includeCustom?: boolean;  // Include custom dated schedules
  includeAll?: boolean;     // Include all schedules (fallback to general endpoint)
}

interface UseSchedulesReturn {
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
  refreshSchedules: () => Promise<void>;
  createSchedule: (schedule: CreateScheduleRequest) => Promise<boolean>;
  updateSchedule: (id: string | number, schedule: UpdateScheduleRequest) => Promise<boolean>;
  updateScheduleByDay: (day: string, schedule: UpdateScheduleRequest) => Promise<boolean>;
  updateScheduleByDate: (scheduledDate: string, schedule: UpdateScheduleRequest) => Promise<boolean>;
  deleteSchedule: (id: string | number) => Promise<boolean>;
  toggleScheduleStatus: (id: string | number, scheduledDate?: string) => Promise<boolean>;
}

export const useSchedules = (params?: UseSchedulesParams): UseSchedulesReturn => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(params?.page || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(params?.per_page || 10);
  
  const { showToast } = useToast();
  
  const mountedRef = useRef(true);
  const lastParamsRef = useRef<string>('');

  const fetchSchedules = useCallback(async () => {
    const fetchParams = {
      page: currentPage,
      per_page: perPage,
      status: params?.status,
      day: params?.day,
    };
    
    const currentParamsString = JSON.stringify({ ...fetchParams, ...params });
    if (lastParamsRef.current === currentParamsString && schedules.length > 0) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      let responses: any[] = [];
      
      // Determine which endpoints to call based on params
      if (params?.includeAll) {
        // Use the general endpoint that gets all schedules
        responses = [await scheduleService.getAllSchedules(fetchParams)];
      } else {
        // Call specific endpoints based on flags
        const promises = [];
        
        if (params?.includeGeneral !== false) {
          promises.push(scheduleService.getSchedules(fetchParams));
        }
        
        if (params?.includeCustom) {
          promises.push(scheduleService.getCustomSchedules(fetchParams));
        }
        
        // Default to general schedules if no specific flags are set
        if (promises.length === 0) {
          promises.push(scheduleService.getSchedules(fetchParams));
        }
        
        responses = await Promise.all(promises);
      }

      if (!mountedRef.current) return;

      // Check for errors
      const hasErrors = responses.some(response => response.errors);
      if (hasErrors) {
        const allErrors = responses.flatMap(response => response.errors || []);
        setError(allErrors.join(', '));
        showToast('Failed to fetch schedules', 'error');
        return;
      }

      // Combine data from all responses
      const allSchedules: Schedule[] = [];
      let maxTotalPages = 0;
      let totalScheduleCount = 0;
      let responsePerPage = perPage;

      responses.forEach(response => {
        if (response.data) {
          allSchedules.push(...response.data.schedules);
          maxTotalPages = Math.max(maxTotalPages, response.data.total_pages);
          totalScheduleCount += response.data.total_count;
          responsePerPage = response.data.per_page;
        }
      });

      // Remove duplicates based on ID (in case of overlapping data)
      const uniqueSchedules = allSchedules.filter(
        (schedule, index, self) => 
          index === self.findIndex(s => s.id === schedule.id)
      );

      setSchedules(uniqueSchedules);
      setCurrentPage(responses[0]?.data?.current_page || currentPage);
      setTotalPages(maxTotalPages);
      setTotalCount(totalScheduleCount);
      setPerPage(responsePerPage);
      lastParamsRef.current = currentParamsString;
      
    } catch (err) {
      if (!mountedRef.current) return;
      setError('Failed to fetch schedules');
      showToast('Failed to fetch schedules', 'error');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentPage, perPage, params?.status, params?.day, params?.includeGeneral, params?.includeCustom, params?.includeAll, showToast]);

  const createSchedule = useCallback(async (schedule: CreateScheduleRequest): Promise<boolean> => {
    try {
      const response = await scheduleService.createSchedule(schedule);
      
      if (response.errors) {
        showToast(response.errors.join(', '), 'error');
        return false;
      }

      showToast('Schedule created successfully', 'success');
      await fetchSchedules();
      return true;
    } catch (err) {
      showToast('Failed to create schedule', 'error');
      return false;
    }
  }, [fetchSchedules, showToast]);

  const updateSchedule = useCallback(async (id: string | number, schedule: UpdateScheduleRequest): Promise<boolean> => {
    try {
      const response = await scheduleService.updateSchedule(id, schedule);
      
      if (response.errors) {
        showToast(response.errors.join(', '), 'error');
        return false;
      }

      showToast('Schedule updated successfully', 'success');
      await fetchSchedules();
      return true;
    } catch (err) {
      showToast('Failed to update schedule', 'error');
      return false;
    }
  }, [fetchSchedules, showToast]);

  const updateScheduleByDay = useCallback(async (day: string, schedule: UpdateScheduleRequest): Promise<boolean> => {
    try {
      const response = await scheduleService.updateScheduleByDay(day, schedule);
      
      if (response.errors) {
        showToast(response.errors.join(', '), 'error');
        return false;
      }

      showToast('Schedule updated successfully', 'success');
      await fetchSchedules();
      return true;
    } catch (err) {
      showToast('Failed to update schedule', 'error');
      return false;
    }
  }, [fetchSchedules, showToast]);

  const updateScheduleByDate = useCallback(async (scheduledDate: string, schedule: UpdateScheduleRequest): Promise<boolean> => {
    try {
      const response = await scheduleService.updateScheduleByDate(scheduledDate, schedule);
      
      if (response.errors) {
        showToast(response.errors.join(', '), 'error');
        return false;
      }

      showToast('Schedule updated successfully', 'success');
      await fetchSchedules();
      return true;
    } catch (err) {
      showToast('Failed to update schedule', 'error');
      return false;
    }
  }, [fetchSchedules, showToast]);

  const deleteSchedule = useCallback(async (id: string | number): Promise<boolean> => {
    const originalSchedule = schedules.find(s => s.id == id);
    
    // Optimistic update
    setSchedules(prev => prev.filter(s => s.id != id));
    setTotalCount(prev => prev - 1);
    
    try {
      const response = await scheduleService.deleteSchedule(id);
      
      if (response.errors) {
        // Revert on error
        if (originalSchedule) {
          setSchedules(prev => [...prev, originalSchedule]);
          setTotalCount(prev => prev + 1);
        }
        showToast(response.errors.join(', '), 'error');
        return false;
      }

      showToast('Schedule deleted successfully', 'success');
      
      // Adjust page if needed
      const remainingItems = schedules.length - 1;
      if (remainingItems === 0 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
      
      return true;
    } catch (err) {
      // Revert on error
      if (originalSchedule) {
        setSchedules(prev => [...prev, originalSchedule]);
        setTotalCount(prev => prev + 1);
      }
      showToast('Failed to delete schedule', 'error');
      return false;
    }
  }, [schedules, currentPage, showToast]);

  const toggleScheduleStatus = useCallback(async (id: string | number, scheduledDate?: string): Promise<boolean> => {
    const originalSchedule = schedules.find(s => s.id == id);
    
    // Optimistic update
    setSchedules(prev => prev.map(s => 
      s.id == id ? { ...s, status: !s.status } : s
    ));
    
    try {
      const response = await scheduleService.toggleScheduleStatus(id, scheduledDate);
      
      if (response.errors) {
        // Revert on error
        if (originalSchedule) {
          setSchedules(prev => prev.map(s => 
            s.id == id ? originalSchedule : s
          ));
        }
        showToast(response.errors.join(', '), 'error');
        return false;
      }

      showToast('Schedule status updated successfully', 'success');
      return true;
    } catch (err) {
      // Revert on error
      if (originalSchedule) {
        setSchedules(prev => prev.map(s => 
          s.id == id ? originalSchedule : s
        ));
      }
      showToast('Failed to update schedule status', 'error');
      return false;
    }
  }, [schedules, showToast]);

  const refreshSchedules = useCallback(async () => {
    lastParamsRef.current = ''; // Reset to force refresh
    await fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    fetchSchedules();
  }, [currentPage, perPage, params?.status, params?.day, params?.includeGeneral, params?.includeCustom, params?.includeAll]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    schedules,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    perPage,
    refreshSchedules,
    createSchedule,
    updateSchedule,
    updateScheduleByDay,
    updateScheduleByDate,
    deleteSchedule,
    toggleScheduleStatus,
  };
};