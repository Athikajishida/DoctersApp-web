export interface AdminPatient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth?: string;
  age: number;
  gender: 'M' | 'F';
  address?: string;
}

export interface AdminBookedSlot {
  id: number;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
  schedule_id: number;
}

export interface AdminApiAppointment {
  id: number;
  patient_id: number;
  treatment_history?: string;
  additional_details?: string;
  created_at: string;
  updated_at: string;
  patient: AdminPatient;
  booked_slots: AdminBookedSlot[];
}

export interface AdminApiResponse<T> {
  data: T;
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page?: number;
}