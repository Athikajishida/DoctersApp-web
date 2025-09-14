// types/schedule.ts
export interface Schedule {
  id: number;
  day?: string; // For general schedules (Sunday, Monday, etc.)
  scheduled_date?: string; // For custom schedules (YYYY-MM-DD)
  start_time: string;
  end_time: string;
  duration_hr?: number;
  duration_min?: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
  schedules_count?: number; // For all_days endpoint
}

export interface CreateScheduleRequest {
  id?: string;
  day?: string;
  scheduled_date?: string;
  start_time: string;
  end_time: string;
  duration_hr?: number;
  duration_min?: number;
  status?: boolean;
}

export interface UpdateScheduleRequest {
  day?: string;
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  duration_hr?: number;
  duration_min?: number;
  status?: boolean;
}

export interface ScheduleResponse {
  schedules: Schedule[];
  current_page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  current_count: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: string[];
  message?: string;
}

// Form-specific types for your components
export interface OverwriteScheduleData {
  id?: string;
  date: string;
  timings: {
    start: string;
    end: string;
  };
  timePerSession: number;
  availableSlots: any[];
}

export interface EditTimeScheduleData {
  id?: string;
  day: string;
  start_time: string;
  end_time: string;
}