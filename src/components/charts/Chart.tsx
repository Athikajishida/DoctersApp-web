// components/charts/Chart.tsx   - Updated with year filtering
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartBox } from './ChartBox'; 
import { useChart } from '../../context/ChartContext';
import { useCharts } from '../../hooks/useCharts';
import { chartServices } from '../../services/chartServices';

export function Chart() {
  const { refreshCharts, error, stats, isLoading, chartData } = useChart();
  const { chartConfigs, barChartConfig, dailyVisitsBarChart } = useCharts();
  
  // State for year filtering 
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<any>(null);
  const [yearlyDailyVisits, setYearlyDailyVisits] = useState<any>(null);
  const [loadingYearData, setLoadingYearData] = useState(false);

  // Fetch available years on component mount
  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        const { years, currentYear } = await chartServices.getAvailableYears();
        setAvailableYears(years);
        setSelectedYear(currentYear);
      } catch (error) {
        console.error('Error fetching available years:', error);
        const currentYear = new Date().getFullYear();
        setAvailableYears([currentYear, currentYear - 1, currentYear - 2]);
        setSelectedYear(currentYear);
      }
    };

    fetchAvailableYears();
  }, []);

  // Fetch data for selected year
  useEffect(() => {
    const fetchYearlyData = async () => {
      if (!selectedYear) return;
      
      setLoadingYearData(true);
      try {
        const [chartData, dailyVisits] = await Promise.all([
          chartServices.getChartData(selectedYear),
          chartServices.getDailyVisits(selectedYear, 'week')
        ]);
        
        setYearlyChartData(chartData);
        setYearlyDailyVisits(dailyVisits);
      } catch (error) {
        console.error('Error fetching yearly data:', error);
      } finally {
        setLoadingYearData(false);
      }
    };

    fetchYearlyData();
  }, [selectedYear]);

  // Initial data fetch
  useEffect(() => {
    refreshCharts();
  }, [refreshCharts]);

  // Handle year change
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  // Get real monthly appointments data from API with year filtering
  const getMonthlyAppointmentData = () => {
    if (loadingYearData || !yearlyChartData?.appointmentsGraph) {
      return chartData?.appointmentsMonthly?.map(item => ({
        month: item.name,
        appointments: item.value
      })) || [];
    }
    
    return yearlyChartData.appointmentsGraph.map((item: any) => ({
      month: item.name,
      appointments: item.value
    }));
  };

  // Get real daily visits data from API with year filtering
  const getDailyVisitsData = () => {
    if (loadingYearData || !yearlyDailyVisits?.visits) {
      return [];
    }

    return yearlyDailyVisits.visits.map((item: any) => ({
      day: item.day,
      visits: item.visits || item.patients || 0,
      date: item.date
    }));
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-800 font-semibold text-lg">Error Loading Analytics</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
        <button 
          onClick={refreshCharts}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  // Function to determine the route based on chart title/type
  const getViewAllRoute = (config: any, index: number) => {
    const routeMapping: { [key: string]: string } = {
      'Total Patients': '/patients',
      'Total Appointments': '/dashboard',
      'Today Appointments': '/dashboard?tab=today',
      'Today\'s Booked Slots': '/dashboard?tab=today',
      'Today\'s Appointments': '/dashboard?tab=today',
      'Revenue': '/charts?filter=revenue',
      'Monthly Growth': '/charts?filter=growth',
      'Patient Demographics': '/patients?view=demographics',
      'Appointment Status': '/dashboard?tab=today',
      'Treatment Types': '/charts?filter=treatments',
      'Daily Visits': '/charts?filter=visits',
      'Future Appointments': '/dashboard?tab=future',
      'Past Appointments': '/dashboard?tab=past'
    };

    if (config.title && routeMapping[config.title]) {
      return routeMapping[config.title];
    }

    const fallbackRoutes = ['/patients', '/dashboard', '/charts?filter=revenue', '/charts?filter=growth'];
    return fallbackRoutes[index] || '/charts';
  };

  // Get data for display
  const monthlyData = getMonthlyAppointmentData();
  const dailyData = getDailyVisitsData();

  // Calculate totals from real data
  const totalMonthlyAppointments = monthlyData.reduce((sum, item) => sum + item.appointments, 0);
  const totalDailyVisits = dailyData.reduce((sum, item) => sum + item.visits, 0);

  // Calculate growth percentage for monthly appointments
  const calculateMonthlyGrowth = () => {
    if (monthlyData.length < 2) return 0;
    
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    const currentMonthData = monthlyData[currentMonth];
    const lastMonthData = monthlyData[lastMonth];
    
    if (!currentMonthData || !lastMonthData || lastMonthData.appointments === 0) {
      return 0;
    }
    
    return Math.round(((currentMonthData.appointments - lastMonthData.appointments) / lastMonthData.appointments) * 100);
  };

  // Year selector component
  const YearSelector = ({ selectedYear, availableYears, onChange, isLoading }: {
    selectedYear: number;
    availableYears: number[];
    onChange: (year: number) => void;
    isLoading: boolean;
  }) => (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-600">Year:</label>
      <select
        value={selectedYear}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={isLoading}
        className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {availableYears.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Key Metrics Grid - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {chartConfigs.map((config, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
            <ChartBox 
              {...config}
              isLoading={isLoading}
              isSuccess={!isLoading && !error}
              viewAllRoute={getViewAllRoute(config, index)}
            />
          </div>
        ))}
      </div>

      {/* Activity Overview with Real API Data */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Activity Overview</h2>
          <YearSelector 
            selectedYear={selectedYear}
            availableYears={availableYears}
            onChange={handleYearChange}
            isLoading={loadingYearData}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Appointments Chart with Real Data and Year Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Appointments per Month ({selectedYear})
                </h3>
              </div>
              <button className="text-blue-500 text-sm hover:text-blue-700 font-medium">
                View All
              </button>
            </div>
            
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900">
                {(isLoading || loadingYearData) ? '...' : totalMonthlyAppointments.toLocaleString()}
              </div>
              <div className={`text-sm ${calculateMonthlyGrowth() >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(isLoading || loadingYearData) ? '...' : `${calculateMonthlyGrowth() >= 0 ? '+' : ''}${calculateMonthlyGrowth()}% this month`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Showing data for {selectedYear}
              </div>
            </div>
            
            {(isLoading || loadingYearData) ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-lg font-medium">No data available</div>
                  <div className="text-sm">Monthly appointment data for {selectedYear} will appear here</div>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [value, 'Appointments']}
                      labelFormatter={(label) => `Month: ${label} ${selectedYear}`}
                    />
                    <Bar 
                      dataKey="appointments" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Daily Patient Visits Chart with Real Data and Year Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Daily Patient Visits ({selectedYear})
                </h3>
              </div>
              <button className="text-blue-500 text-sm hover:text-blue-700 font-medium">
                View All
              </button>
            </div>
            
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900">
                {(isLoading || loadingYearData) ? '...' : (yearlyDailyVisits?.total || totalDailyVisits || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {(isLoading || loadingYearData) ? '...' : `${dailyData.length > 0 ? 'Last 7 days' : 'No data'}`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                New patient registrations for {selectedYear}
              </div>
            </div>
            
            {(isLoading || loadingYearData) ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : dailyData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-lg font-medium">No daily visits data</div>
                  <div className="text-sm mb-4">Daily patient registration data for {selectedYear}</div>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono text-left max-w-sm">
                    <div>API endpoint: /admin/dashboard/daily_visits</div>
                    <div className="mt-2">Parameters:</div>
                    <div>&nbsp;&nbsp;year: {selectedYear}</div>
                    <div>&nbsp;&nbsp;period: week</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 5, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [value, 'New Patients']}
                      labelFormatter={(label) => `Day: ${label}`}
                    />
                    <Bar 
                      dataKey="visits" 
                      fill="#fb923c"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div>
            <h3 className="font-semibold text-gray-800">Analytics Dashboard</h3>
            <p className="text-gray-600 text-sm">
              Real-time insights from your medical practice API for {selectedYear}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {stats && (
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            )}
            <button 
              onClick={refreshCharts}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm"
              disabled={isLoading || loadingYearData}
            >
              {(isLoading || loadingYearData) ? 'Loading...' : 'Refresh All Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}