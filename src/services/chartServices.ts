// services/chartServices.ts - Updated with better daily visits integration
import { Patient, Appointment, BookedSlot, DashboardStats, MonthlyData } from '../types/chart';

class ChartServices {
  private baseUrl: string;

  constructor() {
    // Use environment variable or fallback to localhost
    this.baseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  }

  private getAuthHeaders(): HeadersInit {
    // Use the same token retrieval pattern as apiClient
    const tokensString = localStorage.getItem('auth_tokens');
    let token = null;
    
    if (tokensString) {
      try {
        const tokens = JSON.parse(tokensString);
        token = tokens.access_token;
        console.log('Auth token found:', token ? 'Yes' : 'No');
        console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'None');
      } catch (error) {
        console.error('Failed to parse auth tokens:', error);
      }
    }
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse(response: Response, endpoint: string) {
    console.log(`Response from ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear potentially invalid tokens
        localStorage.removeItem('auth_tokens');
        
        throw new Error('Unauthorized: Please log in again');
      }
      
      // Try to get error details from response
      let errorMessage = `Failed to fetch from ${endpoint}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If can't parse JSON, use default message
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  }

  // Basic data fetching methods
  async getPatients(): Promise<Patient[]> {
    console.log('Fetching patients from:', `${this.baseUrl}/admin/dashboard/patients`);
    console.log('Request headers:', this.getAuthHeaders());
    
    const response = await fetch(`${this.baseUrl}/admin/dashboard/patients`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response, 'patients');
  }

  async getAppointments(): Promise<Appointment[]> {
    console.log('Fetching appointments from:', `${this.baseUrl}/admin/dashboard/appointments`);
    
    const response = await fetch(`${this.baseUrl}/admin/dashboard/appointments`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response, 'appointments');
  }

  async getBookedSlots(): Promise<BookedSlot[]> {
    console.log('Fetching booked slots from:', `${this.baseUrl}/admin/dashboard/booked_slots`);
    
    const response = await fetch(`${this.baseUrl}/admin/dashboard/booked_slots`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response, 'booked_slots');
  }

  async getDashboardStats(): Promise<DashboardStats> {
    console.log('Fetching dashboard stats from:', `${this.baseUrl}/admin/dashboard/stats`);
    
    const response = await fetch(`${this.baseUrl}/admin/dashboard/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response, 'dashboard_stats');
  }

  // Method to check authentication status
  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        headers: this.getAuthHeaders(),
      });
      
      console.log('Auth check response:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }

  // Get available years for filtering
  async getAvailableYears() {
    console.log('Fetching available years from:', `${this.baseUrl}/admin/dashboard/available_years`);
    
    try {
      const response = await fetch(`${this.baseUrl}/admin/dashboard/available_years`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      const data = await this.handleResponse(response, 'available_years');
      console.log('Available years data:', data);
      
      return {
        years: data.years || [new Date().getFullYear()],
        currentYear: data.current_year || new Date().getFullYear()
      };
    } catch (error) {
      console.error('Error fetching available years:', error);
      const currentYear = new Date().getFullYear();
      return {
        years: [currentYear, currentYear - 1, currentYear - 2],
        currentYear
      };
    }
  }

  // IMPROVED: Daily visits method with better error handling and data structure
  async getDailyVisits(year?: number, period: 'week' | 'month' = 'week') {
    const currentYear = year || new Date().getFullYear();
    const url = `${this.baseUrl}/admin/dashboard/daily_visits?year=${currentYear}&period=${period}`;
    
    console.log('Fetching daily visits from:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      const data = await this.handleResponse(response, 'daily_visits');
      console.log('Daily visits API response:', data);
      
      // Process the data to ensure consistent format
      const processedVisits = (data.visits || []).map((item: any) => ({
        day: item.day || item.name,
        visits: item.visits || item.patients || item.value || 0,
        patients: item.patients || item.visits || item.value || 0,
        date: item.date,
        year: item.year || currentYear,
        month: item.month
      }));

      return {
        visits: processedVisits,
        year: data.year || currentYear,
        period: data.period || period,
        total: data.total || processedVisits.reduce((sum: number, item: any) => sum + (item.visits || 0), 0)
      };
    } catch (error) {
      console.error('Error fetching daily visits:', error);
      
      // Return empty structure instead of failing
      return {
        visits: [],
        year: currentYear,
        period,
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Enhanced chart data method with better integration
  async getChartData(year?: number) {
    const currentYear = year || new Date().getFullYear();
    
    try {
      console.log('Fetching chart data from Rails endpoints for year:', currentYear);
      
      const [appointmentsGraphResponse, patientsGraphResponse, dailyVisitsData] = await Promise.all([
        fetch(`${this.baseUrl}/admin/dashboard/appointments_graph?year=${currentYear}`, {
          headers: this.getAuthHeaders(),
        }),
        fetch(`${this.baseUrl}/admin/dashboard/patients_graph?year=${currentYear}`, {
          headers: this.getAuthHeaders(),
        }),
        this.getDailyVisits(currentYear, 'week')
      ]);

      const appointmentsGraph = await this.handleResponse(appointmentsGraphResponse, 'appointments_graph');
      const patientsGraph = await this.handleResponse(patientsGraphResponse, 'patients_graph');

      console.log('Appointments graph data:', appointmentsGraph);
      console.log('Patients graph data:', patientsGraph);
      console.log('Daily visits data:', dailyVisitsData);

      return {
        appointmentsGraph: appointmentsGraph.appointments || [],
        patientsGraph: patientsGraph.patients || [],
        dailyVisits: dailyVisitsData.visits || [],
        year: currentYear,
        totalVisits: dailyVisitsData.total || 0,
        dailyVisitsError: dailyVisitsData.error || null
      };
    } catch (error) {
      console.error('Error fetching chart data, falling back to calculated data:', error);
      
      // Fallback to calculated data if API endpoints fail
      try {
        const [patients, appointments] = await Promise.all([
          this.getPatients(),
          this.getAppointments()
        ]);

        const monthlyData = this.generateMonthlyData(patients, appointments, currentYear);

        return {
          appointmentsGraph: monthlyData.map(item => ({
            name: item.month,
            value: item.appointments
          })),
          patientsGraph: monthlyData.map(item => ({
            name: item.month,
            value: item.patients
          })),
          dailyVisits: [],
          year: currentYear,
          totalVisits: 0,
          dailyVisitsError: 'API endpoint not available'
        };
      } catch (fallbackError) {
        console.error('Fallback data generation also failed:', fallbackError);
        return {
          appointmentsGraph: [],
          patientsGraph: [],
          dailyVisits: [],
          year: currentYear,
          totalVisits: 0,
          error: fallbackError instanceof Error ? fallbackError.message : 'Complete data fetch failure'
        };
      }
    }
  }

  // Enhanced dashboard stats method
  async getDashboardStatsDetailed(): Promise<DashboardStats> {
    try {
      // Try to get stats from the dedicated endpoint first
      const stats = await this.getDashboardStats();
      console.log('Got stats from API:', stats);
      return stats;
    } catch (error) {
      console.error('Failed to get stats from API, calculating manually:', error);
      
      // Fallback: calculate manually
      const [patients, appointments, bookedSlots] = await Promise.all([
        this.getPatients(),
        this.getAppointments(), 
        this.getBookedSlots()
      ]);

      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Calculate stats (fallback if Rails endpoint is not available)
      const todayBookedSlots = bookedSlots.filter(slot => 
        slot.slot_date === today && slot.status
      ).length;

      const thisMonthPatients = patients.filter(patient => {
        const createdDate = new Date(patient.created_at);
        return createdDate.getMonth() === currentMonth && 
               createdDate.getFullYear() === currentYear;
      });

      const thisMonthAppointments = appointments.filter(appointment => {
        const createdDate = new Date(appointment.created_at);
        return createdDate.getMonth() === currentMonth && 
               createdDate.getFullYear() === currentYear;
      });

      // Calculate growth
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const yearToCheck = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const lastMonthPatients = patients.filter(patient => {
        const createdDate = new Date(patient.created_at);
        return createdDate.getMonth() === lastMonth && 
               createdDate.getFullYear() === yearToCheck;
      });

      const growthPercentage = lastMonthPatients.length > 0 
        ? Math.round(((thisMonthPatients.length - lastMonthPatients.length) / lastMonthPatients.length) * 100)
        : 100;

      return {
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        todayBookedSlots,
        monthlyPatientGrowth: growthPercentage,
        appointmentsThisMonth: thisMonthAppointments.length,
        newPatientsThisMonth: thisMonthPatients.length
      };
    }
  }

  // NEW: Method specifically for testing daily visits endpoint
  async testDailyVisitsEndpoint(year?: number, period: 'week' | 'month' = 'week') {
    const currentYear = year || new Date().getFullYear();
    const url = `${this.baseUrl}/admin/dashboard/daily_visits?year=${currentYear}&period=${period}`;
    
    console.log('Testing daily visits endpoint:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      console.log('Daily visits endpoint test - Response status:', response.status);
      console.log('Daily visits endpoint test - Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Daily visits endpoint test - Error response:', errorText);
        return {
          success: false,
          status: response.status,
          error: errorText,
          url
        };
      }
      
      const data = await response.json();
      console.log('Daily visits endpoint test - Success response:', data);
      
      return {
        success: true,
        status: response.status,
        data,
        url
      };
    } catch (error) {
      console.error('Daily visits endpoint test - Network error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        url
      };
    }
  }

  // Generate monthly data with year parameter (fallback method)
  generateMonthlyData(patients: Patient[], appointments: Appointment[], year?: number): MonthlyData[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const targetYear = year || new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Only show months up to current month if it's the current year
    const maxMonth = (targetYear === currentYear) ? currentMonth + 1 : 12;
    
    return months.slice(0, maxMonth).map((month, index) => {
      const monthPatients = patients.filter(patient => {
        const createdDate = new Date(patient.created_at);
        return createdDate.getMonth() === index && createdDate.getFullYear() === targetYear;
      });

      const monthAppointments = appointments.filter(appointment => {
        const createdDate = new Date(appointment.created_at);
        return createdDate.getMonth() === index && createdDate.getFullYear() === targetYear;
      });

      return {
        month,
        patients: monthPatients.length,
        appointments: monthAppointments.length
      };
    });
  }
}

export const chartServices = new ChartServices();
//recent