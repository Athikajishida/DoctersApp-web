import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAppointmentApi } from '../services/adminAppointmentApi';
import { useDebounce } from './useDebounce';
import { DEFAULT_ITEMS_PER_PAGE } from '../constants/pagination';
import type { Appointment } from '../types/dashboard.types';

interface UseTabAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setPage: (page: number, itemsPerPage?: number) => void;
}

export function useTabAppointments(
  filterType: 'today' | 'past' | 'future',
  searchTerm: string,
  sortField: string,
  sortOrder: 'asc' | 'desc',
  itemsPerPage: number = DEFAULT_ITEMS_PER_PAGE
): UseTabAppointmentsReturn {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [currentItemsPerPage, setCurrentItemsPerPage] = React.useState(itemsPerPage);

  // Debounce search to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Map frontend sort fields to backend fields
  const mapSortFieldToBackend = (field: string): string => {
    switch (field) {
      case 'patientName':
        return 'patient_name'; // Backend patient name sorting
      case 'mobileNumber':
        return 'patient_phone'; // Backend patient phone sorting
      case 'gender':
        return 'patient_gender'; // Backend patient gender sorting
      case 'diseases':
        return 'treatment_history'; // Backend field for diseases/treatment
      case 'status':
        return 'appointment_status'; // Backend appointment status field
      case 'date':
        return 'slot_date'; // Backend slot date field
      case 'time':
        return 'slot_time'; // Backend slot time field
      default:
        return 'slot_date'; // Default fallback
    }
  };

  // API call with server-side filtering per tab
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery({
    queryKey: ['tabAppointments', filterType, currentPage, debouncedSearchTerm, sortField, sortOrder, currentItemsPerPage],
    queryFn: async () => {
      const backendSortField = mapSortFieldToBackend(sortField);
      
      const params: any = {
        date_filter: filterType,
        page: currentPage,
        per_page: currentItemsPerPage,
        sort_by: backendSortField,
        sort_dir: sortOrder
      };

      // Add search if present
      if (debouncedSearchTerm && debouncedSearchTerm.length >= 1) {
        params.search = debouncedSearchTerm;
      }

      const response = await adminAppointmentApi.getConsultations(params);

      const appointments = (response.data || []).map((apiAppointment: any) => {
        const capitalizeStatus = (status: string): string => {
          if (!status) return 'Unknown';
          return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        };

        const capitalizeGender = (gender: string): string => {
          if (!gender) return 'Unknown';
          return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
        };

        return {
          id: apiAppointment.id,
          patientName: apiAppointment.patient_name || `${apiAppointment.patient?.first_name || ''} ${apiAppointment.patient?.last_name || ''}`.trim() || 'Unknown Patient',
          mobileNumber: apiAppointment.patient_phone || apiAppointment.patient?.phone_number || 'N/A',
          gender: capitalizeGender(apiAppointment.patient?.gender),
          age: apiAppointment.patient?.age || 0,
          diseases: apiAppointment.treatment_type || apiAppointment.treatment_history || 'General Consultation',
          status: capitalizeStatus(apiAppointment.appointment_status || apiAppointment.status || 'scheduled'),
          date: apiAppointment.slot_date || apiAppointment.booked_slots?.[0]?.slot_date,
          time: apiAppointment.slot_time || apiAppointment.booked_slots?.[0]?.slot_time,
          patientId: apiAppointment.patient_id || apiAppointment.patient?.id,
          meetLink: apiAppointment.meet_link || apiAppointment.meeting_link || null,
          isAlreadyRegistered: apiAppointment.is_already_registered,
          bookedSlots: apiAppointment.booked_slots || [],
        };
      });

      return {
        appointments,
        totalCount: (response as any).meta?.total || (response as any).total_count || 0,
        currentPage: (response as any).meta?.current_page || (response as any).current_page || 1,
        totalPages: (response as any).meta?.total_pages || (response as any).total_pages || 1,
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: window.location.pathname === '/dashboard',
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  // Reset to page 1 when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const refresh = async () => {
    await refetch();
  };

  const setPage = (page: number, newItemsPerPage?: number) => {
    if (newItemsPerPage !== undefined) {
      setCurrentItemsPerPage(newItemsPerPage);
      setCurrentPage(1); // Reset to first page when changing items per page
    } else {
      const maxPage = data?.totalPages || 1;
      setCurrentPage(Math.max(1, Math.min(page, maxPage)));
    }
  };

  // 🎯 Smart loading logic: only show loading on initial load, not on subsequent fetches
  const loading = isLoading && !data;

  return {
    appointments: data?.appointments || [],
    loading,
    error: error?.message || null,
    refresh,
    totalCount: data?.totalCount || 0,
    currentPage: data?.currentPage || 1,
    totalPages: data?.totalPages || 1,
    itemsPerPage: currentItemsPerPage,
    setPage,
  };
} 