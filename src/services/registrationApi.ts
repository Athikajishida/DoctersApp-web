// services/registrationApi.ts

import axios from 'axios';
import SessionStorageService from './sessionStorage.service';
import { RegistrationFormData, TimeSlot } from '../types/registration';



const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token if needed
api.interceptors.request.use((config) => {
  const tokens = SessionStorageService.getTokens();
  if (tokens?.access_token) {
    config.headers.Authorization = `Bearer ${tokens.access_token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const registrationApi = {
  // Submit complete registration
  submitRegistration: async (formData: RegistrationFormData) => {
    const response = await api.post('/registrations', formData);
    return response.data;
  },

  // Get available appointment slots for a specific date
  getAvailableSlots: async (date: string): Promise<TimeSlot[]> => {
    const response = await api.get(`/appointments/slots?date=${date}`);
    return response.data as TimeSlot[];
  },

  // Check if a date has available appointments
  checkDateAvailability: async (date: string): Promise<boolean> => {
    const response = await api.get(`/appointments/availability?date=${date}`);
    return (response.data as TimeSlot).available;
  },

  // Upload files
  uploadFiles: async (files: File[], category: string) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(`files`, file);
    });
    formData.append('category', category);

    const response = await api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Get registration by ID
  getRegistration: async (id: string) => {
    const response = await api.get(`/registrations/${id}`);
    return response.data;
  },

  // Update registration
  updateRegistration: async (id: string, data: Partial<RegistrationFormData>) => {
    const response = await api.put(`/registrations/${id}`, data);
    return response.data;
  },

  // Delete registration
  deleteRegistration: async (id: string) => {
    const response = await api.delete(`/registrations/${id}`);
    return response.data;
  },

  // Book an appointment (with file uploads)
  bookAppointment: async (formData: FormData) => {
    const response = await api.post('/patients/appointments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Fetch available slots for a patient and date
  getAvailableSchedule: async (
    patientId: string,
    date: string,
    isAlreadyRegistered: boolean
  ) => {
    const response = await api.get(
      `/patients/patient_registrations/${patientId}/check_available_schedule`,
      {
        params: {
          date,
          is_already_registered: isAlreadyRegistered,
        },
        headers: {
          Accept: 'application/json',
        },
      }
    );
    return response.data; // Adjust if the API returns a nested structure
  },
};

export default registrationApi;