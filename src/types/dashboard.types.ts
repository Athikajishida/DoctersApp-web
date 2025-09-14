export interface Appointment {
  id: number;
  patientName?: string;
  mobileNumber?: string;
  gender: string;
  age: number;
  diseases?: string;
  status?: string;
  date?: string;
  time?: string;
  patientId?: number;
  meetLink?: string;
  isAlreadyRegistered?: boolean;
  bookedSlots?: Array<{
    id: number;
    slot_date: string;
    slot_time: string;
  }>;
}

export interface DashboardState {
  activeTab: 'today' | 'future' | 'past';
  searchTerm: string;
  appointments: {
    today: Appointment[];
    future: Appointment[];
    past: Appointment[];
  };
}

export type TabType = 'today' | 'future' | 'past';