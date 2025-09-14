// services/consultation.service.ts

import type {
  Consultation,
  ConsultationApiResponse,
  ConsultationQueryParams,
  CreateConsultationPayload,
  UpdateConsultationPayload,
  RecentAppointmentsResponse,
} from '../types/consultation.types';
 
class ConsultationService {
  private readonly baseURL: string;
  private readonly apiVersion: string = 'v1';

  constructor() {
    // Use window object to access environment variables or fallback to localhost
    this.baseURL = (window as any).REACT_APP_API_BASE_URL || 
                   import.meta.env?.VITE_API_BASE_URL || 
                   'http://localhost:3000';
  }

  private get apiEndpoint(): string {
    return `${this.baseURL}/api/${this.apiVersion}/admin/consultations`;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      // Add authentication headers if needed
      // 'Authorization': `Bearer ${this.getAuthToken()}`,
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.apiEndpoint}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private buildQueryParams(params: Partial<ConsultationQueryParams>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }

  // Get all consultations with filtering, sorting, and pagination
  async getConsultations(
    params: Partial<ConsultationQueryParams>
  ): Promise<ConsultationApiResponse> {
    const queryString = this.buildQueryParams(params);
    const endpoint = queryString ? `?${queryString}` : '';
    
    return this.makeRequest<ConsultationApiResponse>(endpoint);
  }

  // Get a specific consultation by ID
  async getConsultationById(id: number): Promise<Consultation> {
    return this.makeRequest<Consultation>(`/${id}`);
  }

  // Create a new consultation
  async createConsultation(
    payload: CreateConsultationPayload
  ): Promise<{ message: string; consultation: Consultation }> {
    const formData = new FormData();
    
    // Append text fields
    formData.append('appointment[patient_id]', payload.patient_id.toString());

    if (payload.treatment_history !== undefined) {
      formData.append('appointment[treatment_history]', payload.treatment_history);
    }

    if (payload.additional_details !== undefined) {
      formData.append('appointment[additional_details]', payload.additional_details);
    }

    if (payload.meet_link !== undefined) {
      formData.append('appointment[meet_link]', payload.meet_link);
    }
    
    // Append files if they exist
    if (payload.pathology_upload) {
      formData.append('appointment[pathology_upload]', payload.pathology_upload);
    }
    if (payload.imageology_upload) {
      formData.append('appointment[imageology_upload]', payload.imageology_upload);
    }
    if (payload.additional_upload) {
      formData.append('appointment[additional_upload]', payload.additional_upload);
    }

    return this.makeRequest('', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set it with boundary for FormData
      },
    });
  }

  // Update a consultation
  async updateConsultation(
    id: number,
    payload: UpdateConsultationPayload
  ): Promise<{ message: string; booked_slot?: any }> {
    return this.makeRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Delete a consultation
  async deleteConsultation(id: number): Promise<{ message: string }> {
    return this.makeRequest(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Get recent appointments for a patient
  async getRecentAppointmentsByPatient(
    patientId: number,
    limit: number = 3
  ): Promise<RecentAppointmentsResponse> {
    const queryString = this.buildQueryParams({
      patient_id: patientId,
      limit,
    } as any);
    
    return this.makeRequest<RecentAppointmentsResponse>(
      `/recent_by_patient?${queryString}`
    );
  }

  // Utility method to format consultation data for display
  formatConsultationForDisplay(consultation: Consultation) {
    const patient = consultation.patient;
    const slot = consultation.booked_slots?.[0];

    return {
      id: consultation.id,
      patientName: `${patient.first_name} ${patient.last_name}`,
      patientEmail: patient.email,
      appointmentDate: slot?.slot_date || 'Not scheduled',
      appointmentTime: slot?.slot_time || 'Not scheduled',
      treatmentHistory: consultation.treatment_history,
      additionalDetails: consultation.additional_details,
      meetLink: consultation.meet_link,
      createdAt: consultation.created_at,
      hasPathologyUpload: !!consultation.pathology_upload,
      hasImageologyUpload: !!consultation.imageology_upload,
      hasAdditionalUpload: !!consultation.additional_upload,
    };
  }

  // Utility method to format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Utility method to format time
  formatTime(timeString: string): string {
    if (!timeString) return 'Not scheduled';
    
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeString; // Return original if parsing fails
    }
  }

  // Utility method to get file download URL
  getFileDownloadUrl(filename: string): string {
    return `${this.baseURL}/uploads/${filename}`;
  }

  private getAuthToken(): string | null {
    // Check if localStorage is available (browser environment)
    if (typeof window !== 'undefined' && window.localStorage) {
      const tokensString = localStorage.getItem('auth_tokens');
      if (tokensString) {
        try {
          const tokens = JSON.parse(tokensString);
          return tokens.access_token || null;
        } catch (error) {
          console.error('Failed to parse auth tokens:', error);
          return null;
        }
      }
    }
    return null;
  }
}

export const consultationService = new ConsultationService();
export default ConsultationService;