// src/context/PatientContext.tsx
import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useCallback, 
  useMemo,
  useRef,
  useEffect
} from 'react';
import { useAuth } from './AuthContext'; // Import useAuth
import { patientService } from '../services/patientService';
import { DEFAULT_ITEMS_PER_PAGE } from '../constants/pagination';
import type { 
  Patient, 
  PatientDetails, 
  NewPatientData, 
  PatientFilters, 
  PatientContextType 
} from '../types/patient.types';

// Action types
type PatientAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PATIENTS'; payload: { 
      patients: Patient[]; 
      totalPages: number; 
      totalItems: number; 
      currentPage: number; 
      perPage: number; 
    }}
  | { type: 'SET_CURRENT_PATIENT'; payload: PatientDetails | null }
  | { type: 'SET_FILTERS'; payload: Partial<PatientFilters> }
  | { type: 'SET_PAGINATION'; payload: { page: number; itemsPerPage?: number } }
  | { type: 'UPDATE_PATIENT'; payload: { id: string; patient: Patient } }
  | { type: 'ADD_PATIENT'; payload: Patient }
  | { type: 'REMOVE_PATIENT'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState = {
  patients: [] as Patient[],
  loading: false,
  error: null as string | null,
  currentPatient: null as PatientDetails | null,
  filters: {
    search: '',
    gender: 'all' as const,
    status: 'all' as const,
    sortBy: 'created_at',
    sortDir: 'desc' as const,
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  },
};

type PatientState = typeof initialState;

// Reducer with optimized state updates
const patientReducer = (state: PatientState, action: PatientAction): PatientState => {
  switch (action.type) {
    case 'SET_LOADING':
      if (state.loading === action.payload) return state;
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      if (state.error === action.payload) return state;
      return { ...state, error: action.payload, loading: false };

    case 'SET_PATIENTS':
      return {
        ...state,
        patients: action.payload.patients,
        pagination: {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalItems: action.payload.totalItems,
          itemsPerPage: action.payload.perPage,
        },
        loading: false,
        error: null,
      };

    case 'SET_CURRENT_PATIENT':
      if (state.currentPatient?.id === action.payload?.id) return state;
      return { ...state, currentPatient: action.payload };

    case 'SET_FILTERS':
      const newFilters = { ...state.filters, ...action.payload };
      if (JSON.stringify(state.filters) === JSON.stringify(newFilters)) return state;
      return { ...state, filters: newFilters };

    case 'SET_PAGINATION':
      const newPagination = {
        ...state.pagination,
        currentPage: action.payload.page,
        itemsPerPage: action.payload.itemsPerPage || state.pagination.itemsPerPage,
      };
      if (JSON.stringify(state.pagination) === JSON.stringify(newPagination)) return state;
      return { ...state, pagination: newPagination };

    case 'UPDATE_PATIENT':
      const updatedPatients = state.patients.map(p =>
        p.id === action.payload.id ? action.payload.patient : p
      );
      return { ...state, patients: updatedPatients };

    case 'ADD_PATIENT':
      return { 
        ...state, 
        patients: [action.payload, ...state.patients],
        pagination: {
          ...state.pagination,
          totalItems: state.pagination.totalItems + 1,
        }
      };

    case 'REMOVE_PATIENT':
      return {
        ...state,
        patients: state.patients.filter(p => p.id !== action.payload),
        pagination: {
          ...state.pagination,
          totalItems: Math.max(0, state.pagination.totalItems - 1),
        }
      };

    case 'CLEAR_ERROR':
      if (!state.error) return state;
      return { ...state, error: null };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};

// Create context
const PatientContext = createContext<PatientContextType | undefined>(undefined);

// Provider component
export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(patientReducer, initialState);
  const { tokens, isAuthenticated, logout } = useAuth(); // Get auth data
  
  // Single source of truth for request management
  const requestStateRef = useRef({
    activeController: null as AbortController | null,
    isLoading: false,
    lastRequestId: 0,
    searchTimeout: null as NodeJS.Timeout | null,
  });

  // Generate unique request ID
  const getRequestId = useCallback(() => {
    requestStateRef.current.lastRequestId += 1;
    return requestStateRef.current.lastRequestId;
  }, []);

  // Cancel active request
  const cancelActiveRequest = useCallback(() => {
    const { activeController, searchTimeout } = requestStateRef.current;
    
    if (activeController) {
      console.log('🛑 Canceling active request');
      activeController.abort();
      requestStateRef.current.activeController = null;
    }
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      requestStateRef.current.searchTimeout = null;
    }
    
    requestStateRef.current.isLoading = false;
  }, []);

  // Helper function to get current access token
  const getAccessToken = useCallback(() => {
    if (!tokens?.access_token) {
      throw new Error('No access token available');
    }
    return tokens.access_token;
  }, [tokens]);

  // Core fetch function with proper request management
  const executePatientFetch = useCallback(async (
    page: number,
    itemsPerPage: number,
    filters: PatientFilters,
    requestId: number
  ) => {
    // Check if user is authenticated
    if (!isAuthenticated || !tokens) {
      console.log(`❌ [${requestId}] User not authenticated`);
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    const controller = new AbortController();
    requestStateRef.current.activeController = controller;
    requestStateRef.current.isLoading = true;

    try {
      console.log(`🚀 [${requestId}] Fetching patients:`, { page, itemsPerPage, filters });
      
      dispatch({ type: 'SET_LOADING', payload: true });

      const accessToken = getAccessToken();
      const response = await patientService.getPatients(
        page,
        itemsPerPage,
        filters,
        accessToken
      );

      // Check if this request is still active
      if (controller.signal.aborted) {
        console.log(`❌ [${requestId}] Request was aborted`);
        return;
      }

      // Check if we're still the active request
      if (requestStateRef.current.activeController !== controller) {
        console.log(`❌ [${requestId}] Request superseded by newer request`);
        return;
      }

      console.log(`✅ [${requestId}] Patients fetched successfully:`, response);

      dispatch({
        type: 'SET_PATIENTS',
        payload: response,
      });

    } catch (error) {
      if (controller.signal.aborted) {
        console.log(`❌ [${requestId}] Request aborted in error handler`);
        return;
      }

      console.error(`❌ [${requestId}] Failed to fetch patients:`, error);

      // Handle authentication errors
      if (error instanceof Error && error.message === 'Authentication failed') {
        logout(); // Logout user if token is invalid
        return;
      }

      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to fetch patients',
      });
    } finally {
      // Only clear if we're still the active request
      if (requestStateRef.current.activeController === controller) {
        requestStateRef.current.activeController = null;
        requestStateRef.current.isLoading = false;
      }
    }
  }, [isAuthenticated, tokens, getAccessToken, logout]);

  // Main fetch function with debouncing logic
  const fetchPatients = useCallback((immediate = false) => {
    // Don't fetch if not authenticated
    if (!isAuthenticated || !tokens) {
      console.log('⚠️ Not authenticated, skipping fetch');
      return;
    }

    const requestId = getRequestId();
    
    console.log(`🔄 [${requestId}] fetchPatients called:`, {
      immediate,
      currentPage: state.pagination.currentPage,
      itemsPerPage: state.pagination.itemsPerPage,
      search: state.filters.search,
      isCurrentlyLoading: requestStateRef.current.isLoading
    });

    // Cancel any existing requests
    cancelActiveRequest();

    const shouldDebounce = !immediate && state.filters.search.trim() !== '';

    if (shouldDebounce) {
      console.log(`⏳ [${requestId}] Debouncing search request`);
      
      requestStateRef.current.searchTimeout = setTimeout(() => {
        executePatientFetch(
          state.pagination.currentPage,
          state.pagination.itemsPerPage,
          state.filters,
          requestId
        );
      }, 300);
    } else {
      console.log(`⚡ [${requestId}] Executing immediate request`);
      
      executePatientFetch(
        state.pagination.currentPage,
        state.pagination.itemsPerPage,
        state.filters,
        requestId
      );
    }
  }, [
    isAuthenticated,
    tokens,
    state.pagination.currentPage,
    state.pagination.itemsPerPage,
    state.filters,
    getRequestId,
    cancelActiveRequest,
    executePatientFetch
  ]);

  // Other CRUD operations with authentication
  const fetchPatientDetails = useCallback(async (id: string) => {
    if (!isAuthenticated || !tokens) {
      throw new Error('User not authenticated');
    }

    if (state.currentPatient?.id === id) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const accessToken = getAccessToken();
      const patient = await patientService.getPatientDetails(id, accessToken);
      dispatch({ type: 'SET_CURRENT_PATIENT', payload: patient });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication failed') {
        logout();
        return;
      }
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to fetch patient details',
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentPatient?.id, isAuthenticated, tokens, getAccessToken, logout]);

  const createPatient = useCallback(async (data: NewPatientData) => {
    if (!isAuthenticated || !tokens) {
      throw new Error('User not authenticated');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const accessToken = getAccessToken();
      const newPatient = await patientService.createPatient(data, accessToken);
      dispatch({ type: 'ADD_PATIENT', payload: newPatient });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication failed') {
        logout();
        return;
      }
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to create patient',
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  }, [isAuthenticated, tokens, getAccessToken, logout]);

  const updatePatient = useCallback(async (id: string, data: Partial<Patient>) => {
    if (!isAuthenticated || !tokens) {
      throw new Error('User not authenticated');
    }

    try {
      const accessToken = getAccessToken();
      const updatedPatient = await patientService.updatePatient(id, data, accessToken);
      dispatch({ type: 'UPDATE_PATIENT', payload: { id, patient: updatedPatient } });
      
      if (state.currentPatient?.id === id) {
        dispatch({ type: 'SET_CURRENT_PATIENT', payload: { ...state.currentPatient, ...updatedPatient } });
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication failed') {
        logout();
        return;
      }
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to update patient',
      });
      throw error;
    }
  }, [state.currentPatient, isAuthenticated, tokens, getAccessToken, logout]);

  const deletePatient = useCallback(async (id: string) => {
    if (!isAuthenticated || !tokens) {
      throw new Error('User not authenticated');
    }

    try {
      const accessToken = getAccessToken();
      await patientService.deletePatient(id, accessToken);
      dispatch({ type: 'REMOVE_PATIENT', payload: id });
      
      if (state.currentPatient?.id === id) {
        dispatch({ type: 'SET_CURRENT_PATIENT', payload: null });
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication failed') {
        logout();
        return;
      }
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to delete patient',
      });
      throw error;
    }
  }, [state.currentPatient, isAuthenticated, tokens, getAccessToken, logout]);

  const setFilters = useCallback((filters: Partial<PatientFilters>) => {
    console.log('🔍 Setting filters:', filters);
    dispatch({ type: 'SET_FILTERS', payload: filters });
    
    // Reset to first page when filters change
    if (filters.search !== undefined || filters.gender !== undefined || filters.status !== undefined) {
      dispatch({ type: 'SET_PAGINATION', payload: { page: 1 } });
    }
  }, []);

  const setPagination = useCallback((page: number, itemsPerPage?: number) => {
    console.log('📄 Setting pagination:', { page, itemsPerPage });
    dispatch({ type: 'SET_PAGINATION', payload: { page, itemsPerPage } });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Effect to trigger fetch when dependencies change
  useEffect(() => {
    // Only fetch if authenticated and on the patients page
    if (isAuthenticated && tokens && window.location.pathname === '/patients') {
      console.log('🔄 Dependencies changed, triggering fetch');
      fetchPatients();
    }
  }, [
    isAuthenticated,
    tokens,
    state.pagination.currentPage,
    state.pagination.itemsPerPage,
    state.filters.search,
    state.filters.gender,
    state.filters.status,
    state.filters.sortBy,
    state.filters.sortDir,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up PatientProvider');
      cancelActiveRequest();
    };
  }, [cancelActiveRequest]);

  // Manual fetch for external use
  const manualFetchPatients = useCallback(() => {
    console.log('🔄 Manual fetch triggered');
    fetchPatients(true);
  }, [fetchPatients]);

  // Memoized context value
  const contextValue = useMemo<PatientContextType>(() => ({
    patients: state.patients,
    loading: state.loading,
    error: state.error,
    currentPatient: state.currentPatient,
    filters: state.filters,
    pagination: state.pagination,
    fetchPatients: manualFetchPatients,
    fetchPatientDetails,
    createPatient,
    updatePatient,
    deletePatient,
    setFilters,
    setPagination,
    clearError,
  }), [
    state.patients,
    state.loading,
    state.error,
    state.currentPatient,
    state.filters,
    state.pagination,
    manualFetchPatients,
    fetchPatientDetails,
    createPatient,
    updatePatient,
    deletePatient,
    setFilters,
    setPagination,
    clearError,
  ]);

  return (
    <PatientContext.Provider value={contextValue}>
      {children}
    </PatientContext.Provider>
  );
};

// Custom hook to use patient context
export const usePatientContext = (): PatientContextType => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  return context;
};

export default PatientContext;