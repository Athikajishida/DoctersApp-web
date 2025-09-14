// context/ConsultationContext.tsx

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  Consultation,
  ConsultationState,
  SortField,
  SortOrder,
} from '../types/consultation.types';

// Action types
type ConsultationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONSULTATIONS'; payload: Consultation[] }
  | { type: 'SET_PAGINATION'; payload: { current_page: number; total_pages: number; total_count: number } }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_TREATMENT_FILTER'; payload: string }
  | { type: 'SET_DATE_FILTERS'; payload: { start_date: string; end_date: string } }
  | { type: 'SET_SORTING'; payload: { sort_by: SortField; sort_dir: SortOrder } }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'ADD_CONSULTATION'; payload: Consultation }
  | { type: 'UPDATE_CONSULTATION'; payload: { id: number; consultation: Partial<Consultation> } }
  | { type: 'REMOVE_CONSULTATION'; payload: number }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: ConsultationState = {
  consultations: [],
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
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
    sort_by: 'created_at',
    sort_dir: 'desc',
  },
};

// Reducer function
const consultationReducer = (
  state: ConsultationState,
  action: ConsultationAction
): ConsultationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'SET_CONSULTATIONS':
      return {
        ...state,
        consultations: action.payload,
        loading: false,
        error: null,
      };

    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: action.payload,
      };

    case 'SET_SEARCH':
      return {
        ...state,
        filters: {
          ...state.filters,
          search: action.payload,
        },
        pagination: {
          ...state.pagination,
          current_page: 1,
        },
      };

    case 'SET_TREATMENT_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          treatment_history: action.payload,
        },
        pagination: {
          ...state.pagination,
          current_page: 1,
        },
      };

    case 'SET_DATE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
        pagination: {
          ...state.pagination,
          current_page: 1,
        },
      };

    case 'SET_SORTING':
      return {
        ...state,
        sorting: action.payload,
        pagination: {
          ...state.pagination,
          current_page: 1,
        },
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {
          search: '',
          treatment_history: '',
          start_date: '',
          end_date: '',
        },
        pagination: {
          ...state.pagination,
          current_page: 1,
        },
      };

    case 'ADD_CONSULTATION':
      return {
        ...state,
        consultations: [action.payload, ...state.consultations],
        pagination: {
          ...state.pagination,
          total_count: state.pagination.total_count + 1,
        },
      };

    case 'UPDATE_CONSULTATION':
      return {
        ...state,
        consultations: state.consultations.map(consultation =>
          consultation.id === action.payload.id
            ? { ...consultation, ...action.payload.consultation }
            : consultation
        ),
      };

    case 'REMOVE_CONSULTATION':
      return {
        ...state,
        consultations: state.consultations.filter(
          consultation => consultation.id !== action.payload
        ),
        pagination: {
          ...state.pagination,
          total_count: Math.max(0, state.pagination.total_count - 1),
        },
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};

// Context type
interface ConsultationContextType {
  state: ConsultationState;
  dispatch: React.Dispatch<ConsultationAction>;
  // Action creators
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConsultations: (consultations: Consultation[]) => void;
  setPagination: (pagination: { current_page: number; total_pages: number; total_count: number }) => void;
  setSearch: (search: string) => void;
  setTreatmentFilter: (filter: string) => void;
  setDateFilters: (dates: { start_date: string; end_date: string }) => void;
  setSorting: (sorting: { sort_by: SortField; sort_dir: SortOrder }) => void;
  clearFilters: () => void;
  addConsultation: (consultation: Consultation) => void;
  updateConsultation: (id: number, consultation: Partial<Consultation>) => void;
  removeConsultation: (id: number) => void;
  resetState: () => void;
}

// Create context
const ConsultationContext = createContext<ConsultationContextType | undefined>(undefined);

// Provider component
interface ConsultationProviderProps {
  children: ReactNode;
  initialState?: Partial<ConsultationState>;
}

export const ConsultationProvider: React.FC<ConsultationProviderProps> = ({
  children,
  initialState: customInitialState,
}) => {
  const [state, dispatch] = useReducer(
    consultationReducer,
    customInitialState ? { ...initialState, ...customInitialState } : initialState
  );

  // Action creators
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setConsultations = (consultations: Consultation[]) => {
    dispatch({ type: 'SET_CONSULTATIONS', payload: consultations });
  };

  const setPagination = (pagination: { current_page: number; total_pages: number; total_count: number }) => {
    dispatch({ type: 'SET_PAGINATION', payload: pagination });
  };

  const setSearch = (search: string) => {
    dispatch({ type: 'SET_SEARCH', payload: search });
  };

  const setTreatmentFilter = (filter: string) => {
    dispatch({ type: 'SET_TREATMENT_FILTER', payload: filter });
  };

  const setDateFilters = (dates: { start_date: string; end_date: string }) => {
    dispatch({ type: 'SET_DATE_FILTERS', payload: dates });
  };

  const setSorting = (sorting: { sort_by: SortField; sort_dir: SortOrder }) => {
    dispatch({ type: 'SET_SORTING', payload: sorting });
  };

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const addConsultation = (consultation: Consultation) => {
    dispatch({ type: 'ADD_CONSULTATION', payload: consultation });
  };

  const updateConsultation = (id: number, consultation: Partial<Consultation>) => {
    dispatch({ type: 'UPDATE_CONSULTATION', payload: { id, consultation } });
  };

  const removeConsultation = (id: number) => {
    dispatch({ type: 'REMOVE_CONSULTATION', payload: id });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const value: ConsultationContextType = {
    state,
    dispatch,
    setLoading,
    setError,
    setConsultations,
    setPagination,
    setSearch,
    setTreatmentFilter,
    setDateFilters,
    setSorting,
    clearFilters,
    addConsultation,
    updateConsultation,
    removeConsultation,
    resetState,
  };

  return (
    <ConsultationContext.Provider value={value}>
      {children}
    </ConsultationContext.Provider>
  );
};

// Custom hook to use consultation context
export const useConsultationContext = (): ConsultationContextType => {
  const context = useContext(ConsultationContext);
  if (context === undefined) {
    throw new Error('useConsultationContext must be used within a ConsultationProvider');
  }
  return context;
};

// HOC for consultation context
export const withConsultationContext = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <ConsultationProvider>
      <Component {...props} />
    </ConsultationProvider>
  );

  WrappedComponent.displayName = `withConsultationContext(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ConsultationContext;