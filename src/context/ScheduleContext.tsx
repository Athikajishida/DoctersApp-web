// context/ScheduleContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '../types/schedule';
import { scheduleService } from '../services/scheduleService';
import { useToast } from './ToastContext';

interface ScheduleContextType {
  // Separate arrays for different schedule types
  generalSchedules: Schedule[];
  customSchedules: Schedule[];
  allSchedules: Schedule[]; // Combined array for backward compatibility
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
  filters: {
    status?: string;
    day?: string;
  };
  setFilters: (filters: { status?: string; day?: string }) => void;
  setCurrentPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  refreshSchedules: () => Promise<void>;
  createSchedule: (schedule: CreateScheduleRequest) => Promise<boolean>;
  updateSchedule: (id: string | number, schedule: UpdateScheduleRequest) => Promise<boolean>;
  updateScheduleByDay: (day: string, schedule: UpdateScheduleRequest) => Promise<boolean>;
  updateScheduleByDate: (scheduledDate: string, schedule: UpdateScheduleRequest) => Promise<boolean>;
  deleteSchedule: (id: string | number) => Promise<boolean>;
  toggleScheduleStatus: (id: string | number, scheduledDate?: string) => Promise<boolean>;
  getScheduleById: (id: string | number) => Schedule | undefined;
  
  // Custom schedule pagination
  customCurrentPage: number;
  customTotalPages: number;
  customTotalCount: number;
  customPerPage: number;
  setCustomCurrentPage: (page: number) => void;
  setCustomPerPage: (perPage: number) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const useScheduleContext = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useScheduleContext must be used within a ScheduleProvider');
  }
  return context;
};

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const [generalSchedules, setGeneralSchedules] = useState<Schedule[]>([]);
  const [customSchedules, setCustomSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [filters, setFilters] = useState<{ status?: string; day?: string }>({});  
  const [customCurrentPage, setCustomCurrentPage] = useState(1);
  const [customTotalPages, setCustomTotalPages] = useState(0);
  const [customTotalCount, setCustomTotalCount] = useState(0);
  const [customPerPage, setCustomPerPage] = useState(10);

  const { showToast } = useToast();

  const refreshSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const generalFetchParams = {
        page: currentPage,
        per_page: perPage,
        ...filters,
      };

      const customFetchParams = {
        page: customCurrentPage,
        per_page: customPerPage,
        ...filters,
      };

      // Fetch both general and custom schedules in parallel
      const [generalResponse, customResponse] = await Promise.all([
        scheduleService.getSchedules(generalFetchParams),
        scheduleService.getCustomSchedules(customFetchParams)
      ]);

      if (generalResponse.error || customResponse.error) {
        const errors = [
          generalResponse.error,
          customResponse.error
        ].filter(Boolean);
        setError(errors.join(', '));
        showToast('Failed to fetch schedules', 'error');
        return;
      }

      if (generalResponse.errors || customResponse.errors) {
        const errors = [...(generalResponse.errors || []), ...(customResponse.errors || [])];
        setError(errors.join(', '));
        showToast('Failed to fetch schedules', 'error');
        return;
      }

      if (generalResponse.data) {
        setGeneralSchedules(generalResponse.data.schedules || []);
        setTotalPages(generalResponse.data.total_pages || 0);
        setTotalCount(generalResponse.data.total_count || 0);
        setPerPage(generalResponse.data.per_page || 10);
      }

      if (customResponse.data) {
        setCustomSchedules(customResponse.data.schedules || []);
        setCustomTotalPages(customResponse.data.total_pages || 0);
        setCustomTotalCount(customResponse.data.total_count || 0);
        setCustomPerPage(customResponse.data.per_page || 10);
      }

    } catch (err) {
      setError('Failed to fetch schedules');
      showToast('Failed to fetch schedules', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, customCurrentPage, customPerPage, filters, showToast]);

  const createSchedule = useCallback(async (schedule: CreateScheduleRequest): Promise<boolean> => {
    try {
      const response = await scheduleService.createSchedule(schedule);
      
      if (response.error) {
        showToast(response.error, 'error');
        return false;
      }
      if (response.errors) {
        showToast(response.errors.join(', '), 'error');
        return false;
      }

      showToast('Schedule created successfully', 'success');
      await refreshSchedules();
      return true;
    } catch (err) {
      showToast('Failed to create schedule', 'error');
      return false;
    }
  }, [refreshSchedules, showToast]);

  const updateSchedule = useCallback(async (id: string | number, schedule: UpdateScheduleRequest): Promise<boolean> => {
    try {
      const response = await scheduleService.updateSchedule(id, schedule);
      
      if (response.errors) {
        showToast(response.errors.join(', '), 'error');
        return false;
      }

      showToast('Schedule updated successfully', 'success');
      await refreshSchedules();
      return true;
    } catch (err) {
      showToast('Failed to update schedule', 'error');
      return false;
    }
  }, [refreshSchedules, showToast]);

  const updateScheduleByDay = useCallback(async (day: string, schedule: UpdateScheduleRequest): Promise<boolean> => {
    try {
      const response = await scheduleService.updateScheduleByDay(day, schedule);
      
      if (response.errors) {
        showToast(response.errors.join(', '), 'error');
        return false;
      }

      showToast('Schedule updated successfully', 'success');
      await refreshSchedules();
      return true;
    } catch (err) {
      showToast('Failed to update schedule', 'error');
      return false;
    }
  }, [refreshSchedules, showToast]);

  const updateScheduleByDate = useCallback(async (scheduledDate: string, schedule: UpdateScheduleRequest): Promise<boolean> => {
    try {
      const response = await scheduleService.updateScheduleByDate(scheduledDate, schedule);
      
      if (response.errors) {
        showToast(response.errors.join(', '), 'error');
        return false;
      }

      showToast('Schedule updated successfully', 'success');
      await refreshSchedules();
      return true;
    } catch (err) {
      showToast('Failed to update schedule', 'error');
      return false;
    }
  }, [refreshSchedules, showToast]);

  const deleteSchedule = useCallback(async (id: string | number): Promise<boolean> => {
    // Find which array the schedule belongs to
    const generalSchedule = generalSchedules.find(s => s.id == id);
    const customSchedule = customSchedules.find(s => s.id == id);
    
    // Optimistic update - remove from appropriate array
    if (generalSchedule) {
      setGeneralSchedules(prev => prev.filter(s => s.id != id));
    }
    if (customSchedule) {
      setCustomSchedules(prev => prev.filter(s => s.id != id));
    }
    setTotalCount(prev => prev - 1);
    
    try {
      const response = await scheduleService.deleteSchedule(id);
      
      if (response.errors) {
        // Revert on error
        if (generalSchedule) {
          setGeneralSchedules(prev => [...prev, generalSchedule]);
        }
        if (customSchedule) {
          setCustomSchedules(prev => [...prev, customSchedule]);
        }
        setTotalCount(prev => prev + 1);
        showToast(response.errors.join(', '), 'error');
        return false;
      }

      showToast('Schedule deleted successfully', 'success');
      
      // Adjust page if needed
      const totalRemaining = generalSchedules.length + customSchedules.length - 1;
      if (totalRemaining === 0 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
      
      return true;
    } catch (err) {
      // Revert on error
      if (generalSchedule) {
        setGeneralSchedules(prev => [...prev, generalSchedule]);
      }
      if (customSchedule) {
        setCustomSchedules(prev => [...prev, customSchedule]);
      }
      setTotalCount(prev => prev + 1);
      showToast('Failed to delete schedule', 'error');
      return false;
    }
  }, [generalSchedules, customSchedules, currentPage, showToast]);

  const toggleScheduleStatus = useCallback(async (id: string | number, scheduledDate?: string): Promise<boolean> => {
    // Find which array the schedule belongs to and create optimistic update
    const generalSchedule = generalSchedules.find(s => s.id == id);
    const customSchedule = customSchedules.find(s => s.id == id);
    
    if (generalSchedule) {
      setGeneralSchedules(prev => prev.map(s => 
        s.id == id ? { ...s, status: !s.status } : s
      ));
    }
    if (customSchedule) {
      setCustomSchedules(prev => prev.map(s => 
        s.id == id ? { ...s, status: !s.status } : s
      ));
    }
    
    try {
      const response = await scheduleService.toggleScheduleStatus(id, scheduledDate);
      
      if (response.errors) {
        // Revert on error
        if (generalSchedule) {
          setGeneralSchedules(prev => prev.map(s => 
            s.id == id ? generalSchedule : s
          ));
        }
        if (customSchedule) {
          setCustomSchedules(prev => prev.map(s => 
            s.id == id ? customSchedule : s
          ));
        }
        showToast(response.errors.join(', '), 'error');
        return false;
      }

      showToast('Schedule status updated successfully', 'success');
      return true;
    } catch (err) {
      // Revert on error
      if (generalSchedule) {
        setGeneralSchedules(prev => prev.map(s => 
          s.id == id ? generalSchedule : s
        ));
      }
      if (customSchedule) {
        setCustomSchedules(prev => prev.map(s => 
          s.id == id ? customSchedule : s
        ));
      }
      showToast('Failed to update schedule status', 'error');
      return false;
    }
  }, [generalSchedules, customSchedules, showToast]);

  const getScheduleById = useCallback((id: string | number): Schedule | undefined => {
    return [...generalSchedules, ...customSchedules].find(schedule => schedule.id == id);
  }, [generalSchedules, customSchedules]);

  // Combined schedules for backward compatibility
  const allSchedules = useMemo(() => {
    return [...generalSchedules, ...customSchedules];
  }, [generalSchedules, customSchedules]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<ScheduleContextType>(() => ({
    generalSchedules,
    customSchedules,
    allSchedules,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    perPage,
    filters,
    setFilters,
    setCurrentPage,
    setPerPage,
    refreshSchedules,
    createSchedule,
    updateSchedule,
    updateScheduleByDay,
    updateScheduleByDate,
    deleteSchedule,
    toggleScheduleStatus,
    getScheduleById,
    customCurrentPage,
    customTotalPages,
    customTotalCount,
    customPerPage,
    setCustomCurrentPage,
    setCustomPerPage,
  }), [
    generalSchedules,
    customSchedules,
    allSchedules,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    perPage,
    filters,
    refreshSchedules,
    createSchedule,
    updateSchedule,
    updateScheduleByDay,
    updateScheduleByDate,
    deleteSchedule,
    toggleScheduleStatus,
    getScheduleById,
    customCurrentPage,
    customTotalPages,
    customTotalCount,
    customPerPage,
    setCustomCurrentPage,
    setCustomPerPage,
  ]);

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
};