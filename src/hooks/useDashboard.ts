import { useState, useEffect, useMemo } from 'react';
import { DashboardState, TabType, Appointment } from '../types/dashboard.types';
import { filterAppointments, sortAppointmentsByDateTime } from '../utils/dashboardHelpers';
import { adminAppointmentApi, AdminApiAppointment } from '../services/adminAppointmentApi';
import { useSearchDebounce } from './useDebounce';

const emptyAppointments = {
  today: [],
  future: [],
  past: []
};

export const useDashboard = () => {
  const [state, setState] = useState<DashboardState>({
    activeTab: 'today',
    searchTerm: '',
    appointments: emptyAppointments
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use debounced search term to reduce API calls
  const { debouncedSearchTerm, isSearching } = useSearchDebounce(
    state.searchTerm,
    500, // 500ms delay
    1    // Minimum 1 character to trigger search
  );

  // Transform API appointment to internal appointment format
  const transformApiAppointment = (apiAppointment: AdminApiAppointment): Appointment => {
    return {
      id: apiAppointment.id,
      patientName: apiAppointment.patient_name || 'Unknown Patient',
      mobileNumber: apiAppointment.patient_phone || 'N/A',
      gender: 'M', // You might want to add gender field to your API response
      age: 0, // You might want to add age field to your API response
      diseases: apiAppointment.treatment_type || 'General Consultation',
      status: mapApiStatusToAppointmentStatus(apiAppointment.status),
      date: apiAppointment.slot_date,
      time: apiAppointment.slot_time
    };
  };

  // Map API status to your internal status
  const mapApiStatusToAppointmentStatus = (apiStatus: string) => {
    switch (apiStatus) {
      case 'scheduled':
        return 'Upcoming' as const;
      case 'completed':
        return 'Completed' as const;
      case 'cancelled':
        return 'Cancelled' as const;
      case 'no_show':
        return 'No Show' as const;
      default:
        return 'Upcoming' as const;
    }
  };

  // Map internal status to API status
  const mapAppointmentStatusToApiStatus = (status: string) => {
    switch (status) {
      case 'Upcoming':
      case 'InProgress':
        return 'scheduled';
      case 'Completed':
        return 'completed';
      case 'Cancelled':
        return 'cancelled';
      case 'No Show':
        return 'no_show';
      default:
        return 'scheduled';
    }
  };

  // Appointments are now handled by React Query in useAdminAppointments
  // No need to fetch appointments here since individual components handle their own data
  
  const fetchAppointments = async () => {
    // This function is kept for compatibility but does nothing
    // Appointments are now handled by React Query
    setLoading(false);
  };

  // Update active tab
  const setActiveTab = (tab: TabType) => {
    setState(prev => ({
      ...prev,
      activeTab: tab,
      searchTerm: '' // Clear search when switching tabs
    }));
  };

  // Update search term
  const setSearchTerm = (term: string) => {
    setState(prev => ({
      ...prev,
      searchTerm: term
    }));
  };

  // Get current appointments based on active tab
  const currentAppointments = useMemo(() => {
    const appointments = state.appointments[state.activeTab];
    return sortAppointmentsByDateTime(appointments);
  }, [state.appointments, state.activeTab]);

  // Get filtered appointments based on debounced search term
  const filteredAppointments = useMemo(() => {
    return filterAppointments(currentAppointments, debouncedSearchTerm);
  }, [currentAppointments, debouncedSearchTerm]);

  // Add new appointment
  const addAppointment = async (appointment: Omit<Appointment, 'id'>, tab: TabType) => {
    try {
      // For creating appointments, you'll need to handle patient creation/selection
      // This is a simplified version - you might need to create/find the patient first
      const response = await adminAppointmentApi.createConsultation({
        patient_id: 1, // You'll need to implement patient selection logic
        slot_date: appointment.date,
        slot_time: appointment.time,
        treatment_type: appointment.diseases,
        notes: `Patient: ${appointment.patientName}, Phone: ${appointment.mobileNumber}`
      });

      const newAppointment: Appointment = {
        ...appointment,
        id: response.consultation.id
      };

      setState(prev => ({
        ...prev,
        appointments: {
          ...prev.appointments,
          [tab]: [...prev.appointments[tab], newAppointment]
        }
      }));

      return response;
    } catch (error) {
      console.error('Error adding appointment:', error);
      throw error;
    }
  };

  // Update appointment
  const updateAppointment = async (appointmentId: number, updates: Partial<Appointment>) => {
    try {
      const updateData: any = {};
      
      if (updates.date) updateData.slot_date = updates.date;
      if (updates.time) updateData.slot_time = updates.time;
      if (updates.diseases) updateData.treatment_type = updates.diseases;
      if (updates.status) updateData.status = mapAppointmentStatusToApiStatus(updates.status);
      
      // Add notes with patient info if name or phone is updated
      if (updates.patientName || updates.mobileNumber) {
        const currentAppointment = findAppointmentById(appointmentId);
        updateData.notes = `Patient: ${updates.patientName || currentAppointment?.patientName}, Phone: ${updates.mobileNumber || currentAppointment?.mobileNumber}`;
      }

      await adminAppointmentApi.updateConsultation(appointmentId, updateData);

      setState(prev => {
        const newAppointments = { ...prev.appointments };
        
        // Find and update appointment in the correct tab
        Object.keys(newAppointments).forEach(tab => {
          const tabKey = tab as TabType;
          const appointmentIndex = newAppointments[tabKey].findIndex(
            app => app.id === appointmentId
          );
          
          if (appointmentIndex !== -1) {
            newAppointments[tabKey][appointmentIndex] = {
              ...newAppointments[tabKey][appointmentIndex],
              ...updates
            };
          }
        });

        return {
          ...prev,
          appointments: newAppointments
        };
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };

  // Delete appointment
  const deleteAppointment = async (appointmentId: number) => {
    try {
      await adminAppointmentApi.deleteConsultation(appointmentId);

      setState(prev => {
        const newAppointments = { ...prev.appointments };
        
        // Remove appointment from all tabs
        Object.keys(newAppointments).forEach(tab => {
          const tabKey = tab as TabType;
          newAppointments[tabKey] = newAppointments[tabKey].filter(
            app => app.id !== appointmentId
          );
        });

        return {
          ...prev,
          appointments: newAppointments
        };
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  };

  // Helper function to find appointment by ID
  const findAppointmentById = (appointmentId: number): Appointment | undefined => {
    for (const tab of Object.keys(state.appointments) as TabType[]) {
      const found = state.appointments[tab].find(app => app.id === appointmentId);
      if (found) return found;
    }
    return undefined;
  };

  // Move appointment between tabs
  const moveAppointment = async (appointmentId: number, fromTab: TabType, toTab: TabType) => {
    const appointment = state.appointments[fromTab].find(app => app.id === appointmentId);
    
    if (!appointment) return;

    // Update status based on tab
    const statusMap = {
      today: 'InProgress',
      future: 'Upcoming',
      past: 'Completed'
    };

    try {
      await updateAppointment(appointmentId, { status: statusMap[toTab] as any });

      setState(prev => {
        const newAppointments = {
          ...prev.appointments,
          [fromTab]: prev.appointments[fromTab].filter(app => app.id !== appointmentId),
          [toTab]: [...prev.appointments[toTab], { ...appointment, status: statusMap[toTab] as any }]
        };

        return {
          ...prev,
          appointments: newAppointments
        };
      });
    } catch (error) {
      console.error('Error moving appointment:', error);
      throw error;
    }
  };

  // Get appointment counts for each tab
  const appointmentCounts = useMemo(() => ({
    today: state.appointments.today.length,
    future: state.appointments.future.length,
    past: state.appointments.past.length
  }), [state.appointments]);

  // Retry failed requests (useful for network errors)
  const retryOperation = async (operation: () => Promise<any>, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  return {
    // State
    activeTab: state.activeTab,
    searchTerm: state.searchTerm,
    appointments: state.appointments,
    currentAppointments,
    filteredAppointments,
    appointmentCounts,
    loading,
    error,
    isSearching,
    
    // Actions
    setActiveTab,
    setSearchTerm,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    moveAppointment,
    refreshAppointments: fetchAppointments,
    clearError,
    
    // Utility functions
    retryOperation
  };
};