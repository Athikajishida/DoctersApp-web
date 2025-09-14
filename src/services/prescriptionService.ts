// services/prescriptionService.ts
import { PrescriptionNote, PrescriptionApiResponse } from '../types/prescription.types';

class PrescriptionService {
  private readonly baseURL: string;
  private readonly apiVersion: string = 'v1';

  constructor() {
    // Use window object to access environment variables or fallback to localhost
    this.baseURL = (window as any).REACT_APP_API_BASE_URL || 
                   import.meta.env?.VITE_API_URL || 
                   'http://localhost:3000';
  }

  private get apiEndpoint(): string {
    return `${this.baseURL}/api/${this.apiVersion}/admin/prescription_notes`;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const authToken = this.getAuthToken();
    if (authToken) {
      defaultHeaders['Authorization'] = `Bearer ${authToken}`;
    }

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

  // Get prescription notes for an appointment
  async getPrescriptionNotes(appointmentId: number): Promise<PrescriptionNote[]> {
    try {
      const response = await this.makeRequest<PrescriptionApiResponse>(`?appointment_id=${appointmentId}`);
      return response.data || [];
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        console.log(`No prescription notes found for appointment ${appointmentId}`);
        return []; // Return empty array for 404
      }
      console.error('Error fetching prescription notes:', error);
      throw error;
    }
  }

  // Create new prescription notes
  async createPrescriptionNotes(
    appointmentId: number, 
    prescriptions: { prescription: string; details: string }[]
  ): Promise<PrescriptionApiResponse> {
    try {
      const payload = {
        appointment_id: appointmentId,
        prescription: prescriptions
      };

      return await this.makeRequest<PrescriptionApiResponse>('', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Error creating prescription notes:', error);
      throw error;
    }
  }

  // Create a single prescription note
  async createSinglePrescriptionNote(
    appointmentId: number,
    prescription: string,
    details: string
  ): Promise<PrescriptionNote> {
    try {
      const payload = {
        appointment_id: appointmentId,
        prescription: [{ prescription, details }]
      };

      const response = await this.makeRequest<PrescriptionApiResponse>('', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return response.data?.[0] || {} as PrescriptionNote;
    } catch (error) {
      console.error('Error creating single prescription note:', error);
      throw error;
    }
  }

  // Update a single prescription note by ID
  async updateSinglePrescriptionNote(
    noteId: number,
    prescription: string,
    details: string
  ): Promise<PrescriptionNote> {
    try {
      const payload = {
        prescription,
        details
      };

      const response = await this.makeRequest<{ data: PrescriptionNote }>(`/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      return response.data;
    } catch (error) {
      console.error('Error updating single prescription note:', error);
      throw error;
    }
  }

  // Delete a single prescription note by ID
  async deleteSinglePrescriptionNote(noteId: number): Promise<void> {
    try {
      await this.makeRequest(`/note/${noteId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting single prescription note:', error);
      throw error;
    }
  }

  // Update existing prescription notes (bulk update)
  async updatePrescriptionNotes(
    appointmentId: number,
    prescriptions: { prescription: string; details: string }[]
  ): Promise<PrescriptionApiResponse> {
    try {
      const payload = {
        appointment_id: appointmentId,
        prescription: prescriptions
      };

      return await this.makeRequest<PrescriptionApiResponse>(`/${appointmentId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Error updating prescription notes:', error);
      throw error;
    }
  }

  // Delete prescription notes for an appointment
  async deletePrescriptionNotes(appointmentId: number): Promise<void> {
    try {
      await this.makeRequest(`/${appointmentId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting prescription notes:', error);
      throw error;
    }
  }

  // Check if prescriptions exist for an appointment
  async checkPrescriptionExists(appointmentId: number): Promise<boolean> {
    try {
      const notes = await this.getPrescriptionNotes(appointmentId);
      return notes.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Get the latest prescription notes for main fields
  getLatestMainFieldPrescriptions(notes: PrescriptionNote[]): Map<string, PrescriptionNote> {
    const mainFields = [
      'treatmentHistory', 'surgery', 'chemo', 'radiation', 
      'immunotherapy', 'others', 'diagnosis', 'instructions', 
      'finalDiagnosis', 'advice'
    ];

    const prescriptionMap = new Map<string, PrescriptionNote>();

    notes.forEach(note => {
      if (mainFields.includes(note.prescription)) {
        // Keep only the most recent prescription for each type
        if (!prescriptionMap.has(note.prescription) || 
            (note.updated_at && prescriptionMap.get(note.prescription)?.updated_at && 
             new Date(note.updated_at) > new Date(prescriptionMap.get(note.prescription)!.updated_at!))) {
          prescriptionMap.set(note.prescription, note);
        }
      }
    });

    return prescriptionMap;
  }

  // Get prescription notes that are not main fields (additional notes)
  getAdditionalPrescriptionNotes(notes: PrescriptionNote[]): PrescriptionNote[] {
    const mainFields = [
      'treatmentHistory', 'surgery', 'chemo', 'radiation', 
      'immunotherapy', 'others', 'diagnosis', 'instructions', 
      'finalDiagnosis', 'advice'
    ];

    return notes.filter(note => !mainFields.includes(note.prescription));
  }

  // Get authentication token from localStorage
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

  // Utility method to format prescription data for display
  formatPrescriptionForDisplay(note: PrescriptionNote) {
    return {
      id: note.id,
      prescription: note.prescription,
      details: note.details,
      appointmentId: note.appointment_id,
      createdAt: note.created_at ? this.formatDate(note.created_at) : 'Unknown',
      updatedAt: note.updated_at ? this.formatDate(note.updated_at) : 'Unknown',
    };
  }

  // Utility method to format date
  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Utility method to group prescriptions by field type
  groupPrescriptionsByField(notes: PrescriptionNote[]): {
    mainFields: Map<string, PrescriptionNote>;
    additionalNotes: PrescriptionNote[];
  } {
    return {
      mainFields: this.getLatestMainFieldPrescriptions(notes),
      additionalNotes: this.getAdditionalPrescriptionNotes(notes)
    };
  }
}

export const prescriptionService = new PrescriptionService();
export default PrescriptionService;