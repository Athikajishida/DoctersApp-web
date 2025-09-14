import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminAppointmentApi } from '../services/adminAppointmentApi';
import { transformAdminApiAppointmentToAppointment, filterAdminAppointmentsByDate } from '../utils/adminAppointmentTransformer';
import type { Appointment } from '../types/dashboard.types';
import { useSearchDebounce } from './useDebounce';

interface UseAdminAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function useAdminAppointments(params?: {
  search?: string;
  treatment_history?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}): UseAdminAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAppointmentApi.getConsultations(params);
      const transformedAppointments = response.data.map(transformAdminApiAppointmentToAppointment);
      
      setAppointments(transformedAppointments);
      setTotalCount(response.total_count);
      setCurrentPage(response.current_page);
      setTotalPages(response.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    refresh: fetchAppointments,
    totalCount,
    currentPage,
    totalPages,
  };
}

export function useFilteredAdminAppointments(filterType: 'today' | 'past' | 'future', searchTerm: string = '') {
  // Use debounced search term to reduce API calls
  const { debouncedSearchTerm, isSearching } = useSearchDebounce(
    searchTerm,
    500, // 500ms delay
    1    // Minimum 1 character to trigger search
  );

  const params = useMemo(() => ({
    search: debouncedSearchTerm || undefined,
    per_page: 50,
  }), [debouncedSearchTerm]);

  const { appointments, loading, error, refresh } = useAdminAppointments(params);

  const filteredAppointments = filterAdminAppointmentsByDate(appointments, filterType);

  return {
    appointments: filteredAppointments,
    loading: loading || isSearching,
    error,
    refresh,
    isSearching,
  };
}
