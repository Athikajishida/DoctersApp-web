// services/patientService.ts - Updated with API response fixes
import type { 
  Patient, 
  PatientDetails, 
  NewPatientData, 
  PatientFilters 
} from '../types/patient.types';

interface ApiAppointment {
  id: number;
  patient_id: number;
  treatment_history: string;
  additional_details: string;
  meet_link: string | null;
  created_at: string;
  updated_at: string;
  appointment_status: string | null;
  code: string | null;
  booked_slots: ApiBookedSlot[];
  pathology_files: any[];
  imageology_files: any[];
  additional_files: any[];
}

interface ApiBookedSlot {
  id: number;
  schedule_id: number;
  appointment_id: number;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
  created_at: string;
  updated_at: string;
  status: boolean;
}

interface ApiPatientResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  age: number;
  gender: string;
  address: string;
  created_at: string;
  updated_at: string;
  code: string | null;
  appointments: ApiAppointment[];
  last_appointment_date: string | null;
  is_inr: boolean;
}

interface ApiPaginatedResponse {
  data: ApiPatientResponse[];
  total_pages: number;
  total_items: number;
  current_page: number;
  per_page: number;
}

export class PatientService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async executeRequest<T>(
    url: string, 
    options: RequestInit = {},
    token: string
  ): Promise<T> {
    if (!token) {
      throw new Error('Missing authentication token');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(token),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as { response?: { data: unknown; status: number } }).response = { data: errorData, status: response.status };
        throw error;
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${url}:`, error);
      throw error;
    }
  }

  private calculateAge(dateOfBirth: string): number {
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return Math.max(0, age);
    } catch {
      return 0;
    }
  }

  private transformBookedSlot(apiSlot: ApiBookedSlot): any {
    return {
      id: apiSlot.id,
      slot_time: apiSlot.slot_time,
      slot_date: apiSlot.slot_date,
      status: apiSlot.status ? 'booked' : 'available',
      created_at: apiSlot.created_at,
      updated_at: apiSlot.updated_at,
    };
  }

  private transformAppointment(apiAppointment: ApiAppointment): any {
    return {
      id: apiAppointment.id,
      date: apiAppointment.created_at.split('T')[0], // Extract date from created_at
      time: apiAppointment.booked_slots.length > 0 ? apiAppointment.booked_slots[0].slot_time : '',
      diseases: apiAppointment.treatment_history,
      doctorName: '', // Not provided in API response
      notes: apiAppointment.additional_details,
      status: apiAppointment.appointment_status || 'scheduled',
      link: apiAppointment.meet_link,
      bookedSlots: apiAppointment.booked_slots.map(this.transformBookedSlot.bind(this)),
    };
  }

  private transformPatient(apiPatient: ApiPatientResponse): Patient {
    return {
      id: apiPatient.id.toString(),
      name: `${apiPatient.first_name} ${apiPatient.last_name}`.trim(),
      firstName: apiPatient.first_name,
      lastName: apiPatient.last_name,
      mobileNumber: apiPatient.phone_number,
      phoneNumber: apiPatient.phone_number,
      contact: apiPatient.phone_number, // Assuming contact is same as phone
      email: apiPatient.email,
      gender: apiPatient.gender,
      age: apiPatient.age, // Use API-provided age instead of calculating
      dateOfBirth: apiPatient.date_of_birth,
      address: apiPatient.address,
      status: 'active' as const, // Default to active since API doesn't provide status
      lastAppointment: apiPatient.last_appointment_date || '',
      totalAppointments: apiPatient.appointments.length,
      appointments: apiPatient.appointments.map(this.transformAppointment.bind(this)),
      is_inr: apiPatient.is_inr,
      created_at: apiPatient.created_at,
      updated_at: apiPatient.updated_at,
    };
  }

  private transformPatientDetails(apiPatient: ApiPatientResponse): PatientDetails {
    const basePatient = this.transformPatient(apiPatient);
    return {
      ...basePatient,
      fullAppointmentHistory: basePatient.appointments,
    };
  }

  private transformToRailsFormat(data: Partial<Patient>): any {
    const railsData: any = {};

    if (data.name) {
      const [firstName, ...rest] = data.name.trim().split(' ');
      railsData.first_name = firstName || '';
      railsData.last_name = rest.join(' ') || '';
    }

    if (data.firstName) railsData.first_name = data.firstName;
    if (data.lastName) railsData.last_name = data.lastName;
    if (data.mobileNumber) railsData.phone_number = data.mobileNumber;
    if (data.phoneNumber) railsData.phone_number = data.phoneNumber;
    if (data.email) railsData.email = data.email;
    if (data.gender) railsData.gender = data.gender;
    if (data.dateOfBirth) railsData.date_of_birth = data.dateOfBirth;
    if (data.address) railsData.address = data.address;
    if (data.age) railsData.age = data.age;

    return railsData;
  }

  async getPatients(
    page: number = 1,
    perPage: number = 10,
    filters: PatientFilters,
    token: string
  ): Promise<{
    patients: Patient[];
    totalPages: number;
    totalItems: number;
    currentPage: number;
    perPage: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      sort_by: filters.sortBy,
      sort_dir: filters.sortDir,
    });

    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.gender && filters.gender !== 'all') {
      params.append('gender', filters.gender);
    }
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const url = `${this.baseUrl}/api/v1/admin/patients?${params.toString()}`;

    const apiResponse: ApiPaginatedResponse = await this.executeRequest<ApiPaginatedResponse>(url, { method: 'GET' }, token);

    return {
      patients: apiResponse.data.map(this.transformPatient.bind(this)),
      totalPages: apiResponse.total_pages,
      totalItems: apiResponse.total_items,
      currentPage: apiResponse.current_page,
      perPage: apiResponse.per_page,
    };
  }

  async getPatientDetails(id: string, token: string): Promise<PatientDetails> {
    const url = `${this.baseUrl}/api/v1/admin/patients/${id}`;
    const apiResponse: ApiPatientResponse = await this.executeRequest<ApiPatientResponse>(url, { method: 'GET' }, token);
    return this.transformPatientDetails(apiResponse);
  }

  async createPatient(data: NewPatientData, token: string): Promise<Patient> {
    const apiData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone_number: data.phone_number,
      gender: data.gender,
      date_of_birth: data.date_of_birth,
      age: data.age,
      address: data.address,
    };

    const url = `${this.baseUrl}/api/v1/admin/patients`;
    const apiResponse: ApiPatientResponse = await this.executeRequest<ApiPatientResponse>(url, {
      method: 'POST',
      body: JSON.stringify(apiData),
    }, token);

    return this.transformPatient(apiResponse);
  }

  async registerPatient(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth?: string;
    age?: number;
    gender: string;
    address: string;
    is_inr: boolean;
  }): Promise<{ 
    patient: Patient; 
    isAlreadyRegistered: boolean;
    consultation_price?: string;
    slot_duration_minutes?: number;
  }> {
    const url = `${this.baseUrl}/api/v1/patients/patient_registrations`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patient: data }),
      });

      // Accept both 200 (OK) and 201 (Created) as success responses
      if (response.status !== 200 && response.status !== 201) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as { response?: { data: unknown; status: number } }).response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();


      // Transform the basic patient response from registration endpoint
      const patient: Patient = {
        id: result.patient.id.toString(),
        name: `${result.patient.first_name} ${result.patient.last_name || ''}`.trim(),
        firstName: result.patient.first_name,
        lastName: result.patient.last_name || '',
        mobileNumber: result.patient.phone_number,
        phoneNumber: result.patient.phone_number,
        contact: result.patient.phone_number,
        email: result.patient.email,
        gender: data.gender, // Use the original data since API doesn't return it
        age: data.age || this.calculateAge(data.date_of_birth || ''),
        dateOfBirth: data.date_of_birth || '',
        address: data.address, // Use the original data since API doesn't return it
        status: 'active' as const,
        lastAppointment: '',
        totalAppointments: 0,
        appointments: [],
        is_inr: result?.is_inr,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        patient,
        isAlreadyRegistered: result.is_already_registered || false,
        consultation_price: result.consultation_price,
        slot_duration_minutes: result.slot_duration_minutes
      };
    } catch (error) {
      console.error(`API Error for ${url}:`, error);
      throw error;
    }
  }

  async updatePatient(id: string, data: Partial<Patient>, token: string): Promise<Patient> {
    const railsData = this.transformToRailsFormat(data);

    const url = `${this.baseUrl}/api/v1/admin/patients/${id}`;
    const apiResponse: ApiPatientResponse = await this.executeRequest<ApiPatientResponse>(url, {
      method: 'PATCH',
      body: JSON.stringify({ patient: railsData }),
    }, token);

    return this.transformPatient(apiResponse);
  }

  async deletePatient(id: string, token: string): Promise<void> {
    const url = `${this.baseUrl}/api/v1/admin/patients/${id}`;
    await this.executeRequest<void>(url, { method: 'DELETE' }, token);
  }
}

export const patientService = new PatientService();