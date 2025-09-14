import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { adminAppointmentApi } from '../services/adminAppointmentApi';
import { DEFAULT_ITEMS_PER_PAGE, MAX_ITEMS_PER_PAGE } from '../constants/pagination';
import type { Appointment } from '../types/dashboard.types';
import type { AdminApiAppointment } from '../services/adminAppointmentApi';
import { useSearchDebounce } from './useDebounce';

interface UseOptimizedAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export function useOptimizedAppointments(
  filterType: 'today' | 'past' | 'future',
  searchTerm: string = ''
): UseOptimizedAppointmentsReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  // Use debounced search term
  const { debouncedSearchTerm } = useSearchDebounce(searchTerm, 500, 1);

  // Single API call to get ALL appointments
  const {
    data: allAppointmentsData,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['allAppointments'],
    queryFn: async () => {
      const response = await adminAppointmentApi.getConsultations({
        per_page: MAX_ITEMS_PER_PAGE, // Get all appointments
        sort_by: 'slot_date',
        sort_dir: 'desc'
      });

      // Transform API appointments to internal format
      const appointments: Appointment[] = response.data.map((apiAppointment: AdminApiAppointment) => {
        const mapApiStatus = (status: string): 'InProgress' | 'Upcoming' | 'Completed' | 'Cancelled' | 'No Show' => {
          switch (status?.toLowerCase()) {
            case 'scheduled':
              return 'Upcoming';
            case 'in_progress':
            case 'inprogress':
              return 'InProgress';
            case 'completed':
              return 'Completed';
            case 'cancelled':
            case 'canceled':
              return 'Cancelled';
            case 'no_show':
            case 'noshow':
              return 'No Show';
            default:
              return 'Upcoming';
          }
        };

        return {
          id: apiAppointment.id,
          patientName: apiAppointment.patient_name || 'Unknown Patient',
          mobileNumber: apiAppointment.patient_phone || 'N/A',
          gender: 'M', // Default gender - API doesn't provide this
          age: 0, // Default age - API doesn't provide this
          diseases: apiAppointment.treatment_type || 'General Consultation',
          status: mapApiStatus(apiAppointment.status),
          date: apiAppointment.slot_date,
          time: apiAppointment.slot_time,
        };
      });

      return appointments;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: window.location.pathname === '/dashboard',
  });

  // Filter appointments by date and search term
  const filteredAppointments = useMemo(() => {
    if (!allAppointmentsData) return [];

    const today = new Date().toISOString().split('T')[0];
    
    // First filter by date
    let dateFilteredAppointments = allAppointmentsData.filter(appointment => {
      if (!appointment.date) return false;
      
      switch (filterType) {
        case 'today':
          return appointment.date === today;
        case 'past':
          return appointment.date < today;
        case 'future':
          return appointment.date > today;
        default:
          return true;
      }
    });

    // Then filter by search term
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 1) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      dateFilteredAppointments = dateFilteredAppointments.filter(appointment => 
        appointment.patientName?.toLowerCase().includes(searchLower) ||
        appointment.mobileNumber?.toLowerCase().includes(searchLower) ||
        appointment.diseases?.toLowerCase().includes(searchLower)
      );
    }

    return dateFilteredAppointments;
  }, [allAppointmentsData, filterType, debouncedSearchTerm]);

  // Paginate the filtered appointments
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, currentPage, itemsPerPage]);

  // Calculate pagination info
  const totalCount = filteredAppointments.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Reset to page 1 when filter type or search term changes
  useMemo(() => {
    setCurrentPage(1);
  }, [filterType, debouncedSearchTerm]);

  const refresh = async () => {
    await refetch();
  };

  const setPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    appointments: paginatedAppointments,
    loading,
    error: error?.message || null,
    refresh,
    totalCount,
    currentPage,
    totalPages,
    setPage,
  };
} 