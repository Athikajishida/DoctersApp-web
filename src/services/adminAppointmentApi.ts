import SessionStorageService from './sessionStorage.service';
import AuthService from './auth.service';

export interface AdminApiResponse<T> {
  data: T;
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface AdminApiAppointment {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  slot_date: string;
  slot_time: string;
  treatment_type: string;
  // status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  appointment_status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminBookedSlot {
  id: number;
  slot_date: string;
  slot_time: string;
  patient_id: number;
  status: string;
}

export interface AdminPatient {
  id: number;
  name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  medical_history?: string;
  created_at: string;
  updated_at: string;
}

class AdminAppointmentApiService {
  private baseUrl = '/api/v1';
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  private getAuthHeaders() {
    const tokens = SessionStorageService.getTokens();
    const token = tokens?.access_token;
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async handleResponse<T>(response: Response, originalOptions?: RequestInit): Promise<T> {
    if (response.status === 401) {
      // Try to refresh token first
      const tokens = SessionStorageService.getTokens();
      if (tokens?.refresh_token) {
        try {
          await this.authService.refreshToken();
          
          // Retry the original request with new token
          const retryHeaders = this.getAuthHeaders();
          const retryResponse = await fetch(response.url, {
            ...originalOptions,
            headers: retryHeaders,
          });
          
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      // If refresh fails or no refresh token, clear auth and redirect
      SessionStorageService.clearAll();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }
    
    return response.json();
  }

  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await this.authService.makeAuthenticatedRequest(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async getConsultations(params?: {
    search?: string;
    treatment_history?: string;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }): Promise<AdminApiResponse<AdminApiAppointment[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    return this.makeAuthenticatedRequest<AdminApiResponse<AdminApiAppointment[]>>(
      `/admin/consultations?${queryParams}`
    );
  }

  async getConsultation(id: number): Promise<AdminApiAppointment> {
    return this.makeAuthenticatedRequest<AdminApiAppointment>(`/admin/consultations/${id}`);
  }

  async createConsultation(data: {
    patient_id: number;
    slot_date: string;
    slot_time: string;
    treatment_type?: string;
    notes?: string;
  }): Promise<{ message: string; consultation: AdminApiAppointment }> {
    return this.makeAuthenticatedRequest<{ message: string; consultation: AdminApiAppointment }>(
      '/admin/consultations',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async updateConsultation(id: number, data: {
    slot_date?: string;
    slot_time?: string;
    treatment_type?: string;
    notes?: string;
    status?: string;
  }): Promise<{ message: string; booked_slot: AdminBookedSlot }> {
    return this.makeAuthenticatedRequest<{ message: string; booked_slot: AdminBookedSlot }>(
      `/admin/consultations/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteConsultation(id: number): Promise<{ message: string }> {
    return this.makeAuthenticatedRequest<{ message: string }>(`/admin/consultations/${id}`, {
      method: 'DELETE',
    });
  }

  async getPatients(params?: {
    query?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }): Promise<AdminApiResponse<AdminPatient[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    return this.makeAuthenticatedRequest<AdminApiResponse<AdminPatient[]>>(
      `/admin/patients?${queryParams}`
    );
  }

  async getRecentAppointmentsByPatient(patientId: number, limit = 3): Promise<{
    patient: AdminPatient;
    recent_appointments: AdminApiAppointment[];
  }> {
    return this.makeAuthenticatedRequest<{
      patient: AdminPatient;
      recent_appointments: AdminApiAppointment[];
    }>(`/admin/consultations/recent_by_patient?patient_id=${patientId}&limit=${limit}`);
  }
}

// Create and export singleton instances
export const authService = new AuthService();
export const adminAppointmentApi = new AdminAppointmentApiService();

// Update slot for an appointment
export const updateSlotByAppointment = async (
  appointmentId: number,
  slotDate: string,
  slotTime: string
) => {
  return adminAppointmentApi.makeAuthenticatedRequest<{ message: string; booked_slot: AdminBookedSlot }>(
    '/admin/booked_slots/update_slot_by_appointment',
    {
      method: 'PUT',
      body: JSON.stringify({
        appointment_id: appointmentId,
        slot_date: slotDate,
        slot_time: slotTime,
      }),
    }
  );
};

// Update a specific booked slot by id
export const updateBookedSlot = async (
  slotId: number,
  slotDate: string,
  slotTime: string
) => {
  return adminAppointmentApi.makeAuthenticatedRequest<{ message: string; booked_slot: AdminBookedSlot }>(
    `/admin/booked_slots/${slotId}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        booked_slot: {
          slot_date: slotDate,
          slot_time: slotTime,
        },
      }),
    }
  );
};