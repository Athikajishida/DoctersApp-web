// context/ChartContext.tsx - Updated with year filtering support
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { chartServices } from '../services/chartServices';
import { DashboardStats, MonthlyData, ChartContextType } from '../types/chart';

interface ChartState {
  stats: DashboardStats | null;
  monthlyData: MonthlyData[];
  chartData: ChartContextType['chartData'];
  selectedYear: number;
  availableYears: number[];
  isLoading: boolean;
  error: string | null;
}

type ChartAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { stats: DashboardStats; monthlyData: MonthlyData[]; chartData: any } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'RESET_ERROR' }
  | { type: 'SET_YEAR'; payload: number }
  | { type: 'SET_AVAILABLE_YEARS'; payload: number[] }
  | { type: 'UPDATE_YEARLY_DATA'; payload: any };

const initialState: ChartState = {
  stats: null,
  monthlyData: [],
  chartData: {
    patientsGrowth: [],
    appointmentsMonthly: [],
    appointmentsByStatus: [],
    patientsByGender: []
  },
  selectedYear: new Date().getFullYear(),
  availableYears: [],
  isLoading: false,
  error: null
};

function chartReducer(state: ChartState, action: ChartAction): ChartState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    
    case 'FETCH_SUCCESS':
      { const { stats, monthlyData, chartData } = action.payload;
      return {
        ...state,
        isLoading: false,
        stats,
        monthlyData,
        chartData
      }; }
    
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    
    case 'RESET_ERROR':
      return { ...state, error: null };
    
    case 'SET_YEAR':
      return { ...state, selectedYear: action.payload };
    
    case 'SET_AVAILABLE_YEARS':
      return { ...state, availableYears: action.payload };
    
    case 'UPDATE_YEARLY_DATA':
      return { 
        ...state, 
        chartData: {
          ...state.chartData,
          ...action.payload
        }
      };
    
    default:
      return state;
  }
}

const ChartContext = createContext<ChartContextType & {
  selectedYear: number;
  availableYears: number[];
  setSelectedYear: (year: number) => void;
  fetchYearlyData: (year: number) => Promise<void>;
} | undefined>(undefined);

export function ChartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chartReducer, initialState);

  const refreshCharts = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      console.log('Starting to fetch chart data...');
      
      // Get dashboard stats and chart data from API
      const [stats, realChartData, patients, appointments] = await Promise.all([
        chartServices.getDashboardStatsDetailed(),
        chartServices.getChartData(),
        chartServices.getPatients(),
        chartServices.getAppointments()
      ]);
      
      console.log('Received stats:', stats);
      console.log('Received chart data:', realChartData);
      
      // Generate monthly data as fallback
      const monthlyData = chartServices.generateMonthlyData(patients, appointments);
      console.log('Generated monthly data:', monthlyData);
      
      // Use real API data if available, otherwise use calculated data
      const chartData = {
        patientsGrowth: realChartData.patientsGraph.length > 0 
          ? realChartData.patientsGraph 
          : monthlyData.map(item => ({ name: item.month, value: item.patients })),
        
        appointmentsMonthly: realChartData.appointmentsGraph.length > 0 
          ? realChartData.appointmentsGraph 
          : monthlyData.map(item => ({ name: item.month, value: item.appointments })),
        
        appointmentsByStatus: [
          { name: 'Scheduled', value: 45, color: '#0088FE' },
          { name: 'Completed', value: 35, color: '#00C49F' },
          { name: 'Cancelled', value: 20, color: '#FF8042' }
        ],
        
        patientsByGender: [
          { name: 'Male', value: 55, color: '#8884d8' },
          { name: 'Female', value: 45, color: '#82ca9d' }
        ]
      };
      
      console.log('Final chart data structure:', chartData);
      
      dispatch({ 
        type: 'FETCH_SUCCESS', 
        payload: { stats, monthlyData, chartData } 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      console.error('Error in refreshCharts:', error);
      
      // Handle authentication errors
      if (errorMessage.includes('Unauthorized')) {
        console.error('Authentication error in charts:', errorMessage);
        localStorage.removeItem('auth_tokens');
        sessionStorage.removeItem('auth_tokens');
      }
      
      dispatch({ 
        type: 'FETCH_ERROR', 
        payload: errorMessage
      });
    }
  }, []);

  // Fetch available years
  const fetchAvailableYears = useCallback(async () => {
    try {
      const { years, currentYear } = await chartServices.getAvailableYears();
      dispatch({ type: 'SET_AVAILABLE_YEARS', payload: years });
      dispatch({ type: 'SET_YEAR', payload: currentYear });
    } catch (error) {
      console.error('Error fetching available years:', error);
      const currentYear = new Date().getFullYear();
      dispatch({ type: 'SET_AVAILABLE_YEARS', payload: [currentYear, currentYear - 1, currentYear - 2] });
      dispatch({ type: 'SET_YEAR', payload: currentYear });
    }
  }, []);

  // Fetch data for specific year
  const fetchYearlyData = useCallback(async (year: number) => {
    try {
      console.log(`Fetching data for year: ${year}`);
      
      const [chartData, dailyVisits] = await Promise.all([
        chartServices.getChartData(year),
        chartServices.getDailyVisits(year, 'week')
      ]);
      
      // Update chart data with yearly filtered data
      const updatedChartData = {
        patientsGrowth: chartData.patientsGraph || [],
        appointmentsMonthly: chartData.appointmentsGraph || [],
        dailyVisits: dailyVisits.visits || []
      };
      
      dispatch({ type: 'UPDATE_YEARLY_DATA', payload: updatedChartData });
    } catch (error) {
      console.error(`Error fetching data for year ${year}:`, error);
    }
  }, []);

  // Set selected year and fetch data
  const setSelectedYear = useCallback((year: number) => {
    dispatch({ type: 'SET_YEAR', payload: year });
    fetchYearlyData(year);
  }, [fetchYearlyData]);

  // Auto-fetch data when component mounts
  useEffect(() => {
    refreshCharts();
    fetchAvailableYears();
  }, [refreshCharts, fetchAvailableYears]);

  const value = {
    ...state,
    refreshCharts,
    setSelectedYear,
    fetchYearlyData
  };

  return (
    <ChartContext.Provider value={value}>
      {children}
    </ChartContext.Provider>
  );
}

export function useChart() {
  const context = useContext(ChartContext);
  if (context === undefined) {
    throw new Error('useChart must be used within a ChartProvider');
  }
  return context;
}