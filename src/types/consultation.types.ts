// types/consultation.types.ts

// Base Patient type
export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
}

// Booked slot type
export interface BookedSlot {
  id: number;
  schedule_id: number;
  appointment_id: number;
  slot_date: string; // Date in YYYY-MM-DD format
  slot_time: string; // Time in HH:MM format
  is_booked: boolean;
  created_at: string;
  updated_at: string;
}

// Main Consultation (Appointment) type
export interface Consultation {
  id: number;
  patient_id: number;
  treatment_history: string;
  additional_details: string;
  pathology_upload: string | null;
  imageology_upload: string | null;
  additional_upload: string | null;
  meet_link: string | null;
  created_at: string;
  updated_at: string;
  // Included relations
  patient: Patient;
  booked_slots: BookedSlot[];
}

// API Response types
export interface ConsultationApiResponse {
  data: Consultation[];
  current_page: number;
  total_pages: number;
  total_count: number;
}

export interface SingleConsultationResponse {
  data: Consultation;
}

// Query parameters for filtering/searching consultations
export interface ConsultationQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  treatment_history?: string;
  start_date?: string; // YYYY-MM-DD format
  end_date?: string;   // YYYY-MM-DD format
  sort_by?: SortField;
  sort_dir?: SortOrder;
}

// Sorting types
export type SortField = 
  | 'id'
  | 'patient_id'
  | 'treatment_history'
  | 'additional_details'
  | 'created_at'
  | 'updated_at';

export type SortOrder = 'asc' | 'desc';

// Payload for creating consultations
export interface CreateConsultationPayload {
  patient_id: number;
  treatment_history: string;
  additional_details: string;
  pathology_upload?: File;
  imageology_upload?: File;
  additional_upload?: File;
  meet_link?: string;
}

// Payload for updating consultation slots
export interface UpdateConsultationPayload {
  slot_date?: string;
  slot_time?: string;
}

// Response for recent appointments by patient
export interface RecentAppointmentsResponse {
  patient: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'email'>;
  recent_appointments: Consultation[];
}

// State management types for React context
export interface ConsultationFilters {
  search: string;
  treatment_history: string;
  start_date: string;
  end_date: string;
}

export interface ConsultationSorting {
  sort_by: SortField;
  sort_dir: SortOrder;
}

export interface ConsultationPagination {
  current_page: number;
  total_pages: number;
  total_count: number;
}

export interface ConsultationState {
  consultations: Consultation[];
  loading: boolean;
  error: string | null;
  pagination: ConsultationPagination;
  filters: ConsultationFilters;
  sorting: ConsultationSorting;
}

// Error response type
export interface ApiErrorResponse {
  error?: string;
  errors?: string[];
  message?: string;
}

// Success response types
export interface CreateConsultationResponse {
  message: string;
  consultation: Consultation;
}

export interface UpdateSlotResponse {
  message: string;
  booked_slot: BookedSlot;
}

export interface DeleteConsultationResponse {
  message: string;
}

// Display/UI helper types
export interface FormattedConsultation {
  id: number;
  patientName: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  treatmentHistory: string;
  additionalDetails: string;
  meetLink: string | null;
  createdAt: string;
  hasPathologyUpload: boolean;
  hasImageologyUpload: boolean;
  hasAdditionalUpload: boolean;
}

// Extended consultation with computed properties
export interface ConsultationWithComputed extends Consultation {
  patient_name: string;
  patient_email: string;
  appointment_date: string | null;
  appointment_time: string | null;
  formatted_date: string;
  formatted_time: string;
  has_files: boolean;
  is_scheduled: boolean;
}

// Filter options for dropdowns/selects
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// Table configuration
export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// Action types for context reducer
export type ConsultationActionType =
  | 'SET_LOADING'
  | 'SET_ERROR'
  | 'SET_CONSULTATIONS'
  | 'SET_PAGINATION'
  | 'SET_SEARCH'
  | 'SET_TREATMENT_FILTER'
  | 'SET_DATE_FILTERS'
  | 'SET_SORTING'
  | 'CLEAR_FILTERS'
  | 'ADD_CONSULTATION'
  | 'UPDATE_CONSULTATION'
  | 'REMOVE_CONSULTATION'
  | 'RESET_STATE';

// Hook return types
export interface UseConsultationsReturn {
  consultations: Consultation[];
  loading: boolean;
  error: string | null;
  pagination: ConsultationPagination;
  filters: ConsultationFilters;
  sorting: ConsultationSorting;
  // Action functions
  fetchConsultations: (params?: Partial<ConsultationQueryParams>) => Promise<void>;
  createConsultation: (payload: CreateConsultationPayload) => Promise<void>;
  updateConsultation: (id: number, payload: UpdateConsultationPayload) => Promise<void>;
  deleteConsultation: (id: number) => Promise<void>;
  setFilters: (filters: Partial<ConsultationFilters>) => void;
  setSorting: (sorting: ConsultationSorting) => void;
  clearFilters: () => void;
  refetch: () => Promise<void>;
}

// Component prop types
export interface ConsultationTableProps {
  consultations: Consultation[];
  loading?: boolean;
  error?: string | null;
  onSort?: (field: SortField, direction: SortOrder) => void;
  onRowClick?: (consultation: Consultation) => void;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  actions?: boolean;
}

export interface ConsultationFiltersProps {
  filters: ConsultationFilters;
  onFiltersChange: (filters: Partial<ConsultationFilters>) => void;
  loading?: boolean;
  treatmentOptions?: FilterOption[];
}

export interface ConsultationFormProps {
  consultation?: Partial<Consultation>;
  onSubmit: (data: CreateConsultationPayload) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  patients?: Patient[];
}

// Validation types
export interface ConsultationValidation {
  patient_id: string[];
  treatment_history: string[];
  additional_details: string[];
  meet_link: string[];
}

// Consultation module constants and utilities
export const SORT_FIELDS = {
  ID: 'id' as const,
  PATIENT_ID: 'patient_id' as const,
  TREATMENT_HISTORY: 'treatment_history' as const,
  ADDITIONAL_DETAILS: 'additional_details' as const,
  CREATED_AT: 'created_at' as const,
  UPDATED_AT: 'updated_at' as const,
} as const;

export const SORT_ORDERS = {
  ASC: 'asc' as const,
  DESC: 'desc' as const,
} as const;

// Default values
export const DEFAULT_CONSULTATION_FILTERS: ConsultationFilters = {
  search: '',
  treatment_history: '',
  start_date: '',
  end_date: '',
};

export const DEFAULT_CONSULTATION_SORTING: ConsultationSorting = {
  sort_by: 'created_at',
  sort_dir: 'desc',
};

export const DEFAULT_PAGINATION: ConsultationPagination = {
  current_page: 1,
  total_pages: 0,
  total_count: 0,
};

// Create a module object that can be used as default export
const ConsultationModule = {
  types: {
    // Re-export types for convenience
  },
  constants: {
    SORT_FIELDS,
    SORT_ORDERS,
    DEFAULT_CONSULTATION_FILTERS,
    DEFAULT_CONSULTATION_SORTING,
    DEFAULT_PAGINATION,
  },
  utils: {
    // You can add utility functions here if needed
    createEmptyConsultation: (): Partial<Consultation> => ({
      treatment_history: '',
      additional_details: '',
      meet_link: null,
    }),
    
    createEmptyFilters: (): ConsultationFilters => ({ ...DEFAULT_CONSULTATION_FILTERS }),
    
    createDefaultSorting: (): ConsultationSorting => ({ ...DEFAULT_CONSULTATION_SORTING }),
  },
};

// Export the module as default (this is now a runtime value)
export default ConsultationModule;