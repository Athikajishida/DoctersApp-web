// hooks/useConsultations.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_ITEMS_PER_PAGE } from '../constants/pagination';
import {
  Consultation,
  ConsultationQueryParams,
  ConsultationState,
  SortField,
  SortOrder,
} from '../types/consultation.types';
import consultationService from '../services/consultation.service';

interface UseConsultationsProps {
  initialPage?: number;
  initialPerPage?: number;
  initialSortField?: SortField;
  initialSortOrder?: SortOrder;
}

export const useConsultations = ({
  initialPage = 1,
  initialPerPage = DEFAULT_ITEMS_PER_PAGE,
  initialSortField = 'created_at',
  initialSortOrder = 'desc',
}: UseConsultationsProps = {}) => {
  const [state, setState] = useState<ConsultationState>({
    consultations: [],
    loading: true,
    error: null,
    pagination: {
      current_page: initialPage,
      total_pages: 0,
      total_count: 0,
    },
    filters: {
      search: '',
      treatment_history: '',
      start_date: '',
      end_date: '',
    },
    sorting: {
      sort_by: initialSortField,
      sort_dir: initialSortOrder,
    },
  });

  const [itemsPerPage, setItemsPerPage] = useState(initialPerPage);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch consultations from API
  const fetchConsultations = useCallback(async (params: Partial<ConsultationQueryParams>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await consultationService.getConsultations({
        page: state.pagination.current_page,
        per_page: itemsPerPage,
        ...state.filters,
        ...state.sorting,
        ...params,
      });

      setState(prev => ({
        ...prev,
        consultations: response.data,
        pagination: {
          current_page: response.current_page,
          total_pages: response.total_pages,
          total_count: response.total_count,
        },
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch consultations';
      setState(prev => ({
        ...prev,
        consultations: [],
        loading: false,
        error: errorMessage,
      }));
    }
  }, [state.pagination.current_page, itemsPerPage, state.filters, state.sorting]);

  // Debounced fetch for search operations
  const debouncedFetch = useCallback((params: Partial<ConsultationQueryParams>, delay = 500) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchConsultations({ ...params, page: 1 });
    }, delay);
  }, [fetchConsultations]);

  // Update search filter
  const updateSearch = useCallback((search: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, search },
      pagination: { ...prev.pagination, current_page: 1 },
    }));
    debouncedFetch({ search });
  }, [debouncedFetch]);

  // Update treatment history filter
  const updateTreatmentFilter = useCallback((treatment_history: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, treatment_history },
      pagination: { ...prev.pagination, current_page: 1 },
    }));
    debouncedFetch({ treatment_history });
  }, [debouncedFetch]);

  // Update date filters
  const updateDateFilters = useCallback((start_date: string, end_date: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, start_date, end_date },
      pagination: { ...prev.pagination, current_page: 1 },
    }));
    fetchConsultations({ start_date, end_date, page: 1 });
  }, [fetchConsultations]);

  // Clear date filters
  const clearDateFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, start_date: '', end_date: '' },
      pagination: { ...prev.pagination, current_page: 1 },
    }));
    fetchConsultations({ start_date: '', end_date: '', page: 1 });
  }, [fetchConsultations]);

  // Update sorting
  const updateSorting = useCallback((field: SortField) => {
    const newOrder: SortOrder = 
      state.sorting.sort_by === field 
        ? state.sorting.sort_dir === 'asc' ? 'desc' : 'asc'
        : 'asc';

    setState(prev => ({
      ...prev,
      sorting: { sort_by: field, sort_dir: newOrder },
      pagination: { ...prev.pagination, current_page: 1 },
    }));

    fetchConsultations({ sort_by: field, sort_dir: newOrder, page: 1 });
  }, [state.sorting.sort_by, state.sorting.sort_dir, fetchConsultations]);

  // Change page
  const changePage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, current_page: page },
    }));
    fetchConsultations({ page });
  }, [fetchConsultations]);

  // Change items per page
  const changeItemsPerPage = useCallback((perPage: number) => {
    setItemsPerPage(perPage);
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, current_page: 1 },
    }));
    fetchConsultations({ per_page: perPage, page: 1 });
  }, [fetchConsultations]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchConsultations({});
  }, [fetchConsultations]);

  // Initial fetch
  useEffect(() => {
    fetchConsultations({});
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    itemsPerPage,
    // Actions
    updateSearch,
    updateTreatmentFilter,
    updateDateFilters,
    clearDateFilters,
    updateSorting,
    changePage,
    changeItemsPerPage,
    refresh,
    // Utilities
    formatDate: consultationService.formatDate,
    formatTime: consultationService.formatTime,
    formatConsultationForDisplay: consultationService.formatConsultationForDisplay,
  };
};

// Hook for single consultation
export const useConsultation = (id: number) => {
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await consultationService.getConsultationById(id);
      setConsultation(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch consultation';
      setError(errorMessage);
      setConsultation(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchConsultation();
    }
  }, [id, fetchConsultation]);

  return {
    consultation,
    loading,
    error,
    refresh: fetchConsultation,
    formatConsultationForDisplay: consultation 
      ? consultationService.formatConsultationForDisplay(consultation)
      : null,
  };
};

// Hook for consultation mutations
export const useConsultationMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConsultation = useCallback(async (payload: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await consultationService.createConsultation(payload);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create consultation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConsultation = useCallback(async (id: number, payload: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await consultationService.updateConsultation(id, payload);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update consultation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteConsultation = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await consultationService.deleteConsultation(id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete consultation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createConsultation,
    updateConsultation,
    deleteConsultation,
  };
};