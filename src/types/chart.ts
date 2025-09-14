// types/chart.ts - Updated types with year filtering support
export interface Patient {
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
  code: string;
}
//recent
export interface Appointment {
  id: number;
  patient_id: number;
  treatment_history: string;
  additional_details: string;
  meet_link: string;
  appointment_status: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface BookedSlot {
  id: number;
  schedule_id: number;
  appointment_id: number;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
  status: boolean;
  booking_status: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  todayBookedSlots: number;
  monthlyPatientGrowth: number;
  monthlyAppointmentGrowth?: number;
  appointmentsThisMonth: number;
  newPatientsThisMonth: number;
}

export interface MonthlyData {
  month: string;
  patients: number;
  appointments: number;
}

// New interface for yearly data filtering
export interface YearlyChartData {
  appointmentsGraph: Array<{ name: string; value: number; month?: number; year?: number }>;
  patientsGraph: Array<{ name: string; value: number; month?: number; year?: number }>;
  dailyVisits: Array<{ 
    day: string; 
    visits: number; 
    patients: number; 
    date?: string; 
    year?: number 
  }>;
  year: number;
  totalVisits?: number;
}

// New interface for daily visits data
export interface DailyVisitsData {
  visits: Array<{
    day: string;
    visits: number;
    patients: number;
    date?: string;
    year?: number;
  }>;
  year: number;
  period: 'week' | 'month';
  total: number;
}

// New interface for available years
export interface AvailableYearsData {
  years: number[];
  currentYear: number;
}

export interface ChartContextType {
  stats: DashboardStats | null;
  monthlyData: MonthlyData[];
  chartData: {
    patientsGrowth: Array<{ name: string; value: number }>;
    appointmentsMonthly: Array<{ name: string; value: number }>;
    appointmentsByStatus: Array<{ name: string; value: number; color: string }>;
    patientsByGender: Array<{ name: string; value: number; color: string }>;
    dailyVisits?: Array<{ 
      day: string; 
      visits: number; 
      patients?: number; 
      date?: string; 
    }>;
  };
  isLoading: boolean;
  error: string | null;
  refreshCharts: () => Promise<void>;
  
  // New year filtering properties
  selectedYear?: number;
  availableYears?: number[];
  setSelectedYear?: (year: number) => void;
  fetchYearlyData?: (year: number) => Promise<void>;
}

// Chart configuration interfaces
export interface ChartConfig {
  chartType: 'line' | 'bar' | 'pie' | 'area';
  color: string;
  IconBox?: React.ComponentType<any>;
  title: string;
  number: string;
  dataKey: string;
  percentage?: number;
  chartData: any[];
  isLoading: boolean;
  isSuccess: boolean;
  viewAllRoute?: string;
  message?: string;
}

export interface BarChartConfig extends Omit<ChartConfig, 'chartType'> {
  chartType: 'bar';
}

export interface PieChartConfig {
  chartType: 'pie';
  title: string;
  chartPieData: Array<{ name: string; value: number; color: string }>;
  isLoading: boolean;
  isSuccess: boolean;
  message?: string;
}

export interface AreaChartConfig {
  chartType: 'area';
  title: string;
  chartAreaData: any[];
  isLoading: boolean;
  isSuccess: boolean;
  message?: string;
}

// API Response interfaces
export interface AppointmentsGraphResponse {
  appointments: Array<{ name: string; value: number; month?: number; year?: number }>;
  year: number;
}

export interface PatientsGraphResponse {
  patients: Array<{ name: string; value: number; month?: number; year?: number }>;
  year: number;
}

export interface DailyVisitsResponse {
  visits: Array<{
    day: string;
    visits: number;
    patients: number;
    date?: string;
    year?: number;
  }>;
  year: number;
  period: 'week' | 'month';
  total: number;
}

// Extended chart data with year information
export interface ExtendedChartData {
  patientsGrowth: Array<{ name: string; value: number; year?: number }>;
  appointmentsMonthly: Array<{ name: string; value: number; year?: number }>;
  appointmentsByStatus: Array<{ name: string; value: number; color: string }>;
  patientsByGender: Array<{ name: string; value: number; color: string }>;
  dailyVisits: Array<{ 
    day: string; 
    visits: number; 
    patients: number; 
    date?: string; 
    year?: number;
  }>;
  selectedYear: number;
  totalVisits?: number;
}

// Props for year selector component
export interface YearSelectorProps {
  selectedYear: number;
  availableYears: number[];
  onChange: (year: number) => void;
  isLoading: boolean;
  className?: string;
}

// Chart filter options
export type ChartPeriod = 'week' | 'month' | 'year';
export type ChartDataType = 'appointments' | 'patients' | 'visits' | 'revenue';

export interface ChartFilters {
  year: number;
  period: ChartPeriod;
  dataType: ChartDataType;
}

// Error handling interfaces
export interface ChartError {
  message: string;
  code?: string;
  endpoint?: string;
  timestamp: Date;
}

export interface ChartLoadingState {
  isLoadingMain: boolean;
  isLoadingYearly: boolean;
  isLoadingStats: boolean;
  isLoadingVisits: boolean;
}