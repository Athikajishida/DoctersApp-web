// src/types/patient.types.ts
export interface Patient {
  id: number | string;
  name: string;
  age: number | string;
  gender: 'M' | 'F' | string;
  contact: string;
  mobileNumber: string;
  email?: string;
  address: string;
  status: 'active' | 'inactive';
  lastAppointment: string;
  totalAppointments: number;
  created_at: string;
  updated_at: string;
  appointments: Appointment[];
  emergencyContact?: number | string;
  medicalHistory?: string;
  is_inr: boolean;
  
  // Additional fields from Rails API
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
}

export interface PatientDetails extends Patient {
  fullAppointmentHistory?: Appointment[];
}

export interface Appointment {
  id?: number | string;
  date: string;
  time: string;
  diseases: string;
  doctorName: string;
  notes: string;
  status?: string;
  link?: string;
  bookedSlots?: BookedSlot[];
}

export interface BookedSlot {
  id: number | string;
  slot_time: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface NewPatientData {
  first_name: string;
  last_name: string;
  email?: string;
  phone_number: string;
  date_of_birth?: string;
  age?: number;
  gender?: 'M' | 'F';
  address?: string;
  name?: string;
  mobileNumber?: string;
  emergencyContact?: string;
  medicalHistory?: string;
}

export interface PatientFilters {
  search: string;
  gender: 'all' | 'M' | 'F';
  status: 'all' | 'active' | 'inactive';
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export interface PatientContextType {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  currentPatient: PatientDetails | null;
  filters: PatientFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  fetchPatients: () => Promise<void>;
  fetchPatientDetails: (id: string) => Promise<void>;
  createPatient: (data: NewPatientData) => Promise<void>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  setFilters: (filters: Partial<PatientFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearError: () => void;
}

export interface ApiResponse<T> {
  data: T;
  current_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface ApiError {
  error: string;
  message?: string;
  errors?: string[];
}