// hooks/useCharts.ts - Updated with daily visits integration
import { useMemo } from 'react';
import { useChart } from '../context/ChartContext';
import {
  MdGroup,
  MdCalendarToday,
  MdSchedule,
  MdTrendingUp,
  MdAssessment,
  MdPersonAdd,
  MdInventory2,
  MdSwapHorizontalCircle,
  MdVisibility,
  MdToday
} from 'react-icons/md';

export function useCharts() {
  const { stats, chartData, isLoading, selectedYear } = useChart();

  // Main line chart configurations (your existing ones)
  const chartConfigs = useMemo(() => {
    if (!stats) return [];

    return [
      {
        chartType: 'line',
        color: '#8884d8',
        IconBox: MdGroup,
        title: 'Total Patients',
        number: stats.totalPatients.toLocaleString(),
        dataKey: 'value',
        percentage: stats.monthlyPatientGrowth,
        chartData: chartData.patientsGrowth,
        isLoading,
        isSuccess: !isLoading && !!stats
      },
      {
        chartType: 'line',
        color: '#00C49F',
        IconBox: MdCalendarToday,
        title: 'Total Appointments',
        number: stats.totalAppointments.toLocaleString(),
        dataKey: 'value',
        percentage: stats.monthlyAppointmentGrowth || 0,
        chartData: chartData.appointmentsMonthly,
        isLoading,
        isSuccess: !isLoading && !!stats
      },
      {
        chartType: 'line',
        color: '#FF8042',
        IconBox: MdSchedule,
        title: "Today's Booked Slots",
        number: stats.todayBookedSlots.toString(),
        dataKey: 'value',
        percentage: 0,
        chartData: [
          { name: 'Morning', value: Math.floor(stats.todayBookedSlots * 0.4) },
          { name: 'Afternoon', value: Math.floor(stats.todayBookedSlots * 0.35) },
          { name: 'Evening', value: Math.floor(stats.todayBookedSlots * 0.25) }
        ],
        isLoading,
        isSuccess: !isLoading && !!stats
      },
      {
        chartType: 'line',
        color: '#82ca9d',
        IconBox: MdPersonAdd,
        title: 'New Patients This Month',
        number: stats.newPatientsThisMonth.toString(),
        dataKey: 'value',
        percentage: stats.monthlyPatientGrowth,
        chartData: chartData.patientsGrowth.slice(-7),
        isLoading,
        isSuccess: !isLoading && !!stats
      }
    ];
  }, [stats, chartData, isLoading]);

  // Additional medical-themed line charts
  const additionalLineCharts = useMemo(() => {
    if (!stats) return [];

    return [
      {
        chartType: 'line',
        color: 'teal',
        IconBox: MdAssessment,
        title: 'Treatment Success Rate',
        number: '87.5%',
        dataKey: 'success',
        percentage: 15,
        chartData: [
          { name: 'Mon', success: 85 },
          { name: 'Tue', success: 88 },
          { name: 'Wed', success: 82 },
          { name: 'Thu', success: 90 },
          { name: 'Fri', success: 87 },
          { name: 'Sat', success: 89 },
          { name: 'Sun', success: 86 },
        ],
        isLoading,
        isSuccess: !isLoading && !!stats
      },
      {
        chartType: 'line',
        color: 'gold',
        IconBox: MdSwapHorizontalCircle,
        title: 'Patient Satisfaction',
        number: '4.8/5.0',
        dataKey: 'rating',
        percentage: 8,
        chartData: [
          { name: 'Mon', rating: 4.7 },
          { name: 'Tue', rating: 4.8 },
          { name: 'Wed', rating: 4.6 },
          { name: 'Thu', rating: 4.9 },
          { name: 'Fri', rating: 4.8 },
          { name: 'Sat', rating: 4.7 },
          { name: 'Sun', rating: 4.8 },
        ],
        isLoading,
        isSuccess: !isLoading && !!stats
      }
    ];
  }, [stats, isLoading]);

  // Bar chart configuration with real data
  const barChartConfig = useMemo(() => {
    if (!stats || !chartData.appointmentsMonthly) {
      return {
        chartType: 'bar',
        title: 'Appointments per Month',
        color: '#8884d8',
        dataKey: 'value',
        number: '0',
        chartData: [],
        isLoading: true,
        isSuccess: false
      };
    }

    const totalMonthlyAppointments = chartData.appointmentsMonthly.reduce(
      (sum, item) => sum + (item.value || 0), 0
    );

    return {
      chartType: 'bar',
      title: 'Appointments per Month',
      color: '#8884d8',
      dataKey: 'value',
      number: totalMonthlyAppointments.toLocaleString(),
      chartData: chartData.appointmentsMonthly,
      isLoading,
      isSuccess: !isLoading && !!stats
    };
  }, [chartData.appointmentsMonthly, isLoading, stats]);

  // UPDATED: Daily visits bar chart with real API integration
  const dailyVisitsBarChart = useMemo(() => {
    // Check if we have daily visits data in chartData
    const dailyVisits = chartData.dailyVisits || [];
    
    // Calculate total visits
    const totalVisits = dailyVisits.reduce((sum, item) => sum + (item.visits || item.patients || 0), 0);
    
    // Check if we have real data
    const hasRealData = dailyVisits.length > 0 && totalVisits > 0;
    
    return {
      chartType: 'bar',
      title: 'Daily Patient Visits',
      subtitle: selectedYear ? `New patient registrations for ${selectedYear}` : 'New patient registrations',
      color: '#FF8042',
      dataKey: 'visits',
      number: hasRealData ? totalVisits.toLocaleString() : '0',
      chartData: dailyVisits.map(item => ({
        name: item.day,
        day: item.day,
        visits: item.visits || item.patients || 0,
        date: item.date
      })),
      period: 'Last 7 days',
      isLoading,
      isSuccess: hasRealData && !isLoading,
      hasData: hasRealData,
      message: !hasRealData ? 'No daily visits data available' : undefined,
      apiEndpoint: '/admin/dashboard/daily_visits',
      year: selectedYear
    };
  }, [chartData.dailyVisits, isLoading, selectedYear]);

  // Enhanced daily visits summary card
  const dailyVisitsSummaryCard = useMemo(() => {
    const dailyVisits = chartData.dailyVisits || [];
    const totalVisits = dailyVisits.reduce((sum, item) => sum + (item.visits || item.patients || 0), 0);
    const hasData = dailyVisits.length > 0;
    
    // Calculate weekly growth if we have enough data
    let weeklyGrowth = 0;
    if (dailyVisits.length >= 7) {
      const firstHalf = dailyVisits.slice(0, 3).reduce((sum, item) => sum + (item.visits || 0), 0);
      const secondHalf = dailyVisits.slice(4, 7).reduce((sum, item) => sum + (item.visits || 0), 0);
      if (firstHalf > 0) {
        weeklyGrowth = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
      }
    }

    return {
      chartType: 'line',
      color: '#10B981',
      IconBox: MdVisibility,
      title: 'Daily Patient Visits',
      subtitle: `New registrations (${selectedYear || 'Current Year'})`,
      number: totalVisits.toLocaleString(),
      dataKey: 'visits',
      percentage: weeklyGrowth,
      chartData: dailyVisits.map(item => ({
        name: item.day,
        value: item.visits || item.patients || 0
      })),
      period: hasData ? 'Last 7 days' : 'No data',
      isLoading,
      isSuccess: hasData && !isLoading,
      hasData
    };
  }, [chartData.dailyVisits, isLoading, selectedYear]);

  // Pie chart configuration (using real data where available)
  const pieChartConfig = useMemo(() => ({
    chartType: 'pie',
    title: 'Appointments by Status',
    chartPieData: chartData.appointmentsByStatus,
    isLoading,
    isSuccess: !isLoading && !!stats
  }), [chartData.appointmentsByStatus, isLoading, stats]);

  // Additional pie chart for patient referral sources
  const patientSourcePieChart = useMemo(() => ({
    chartType: 'pie',
    title: 'Patient Referral Sources',
    chartPieData: [
      { name: 'Direct Visit', value: 0, color: '#0088FE' },
      { name: 'Online Booking', value: 0, color: '#00C49F' },
      { name: 'Phone Call', value: 0, color: '#FFBB28' },
      { name: 'Referral', value: 0, color: '#FF8042' },
    ],
    isLoading,
    isSuccess: false,
    message: 'API endpoint needed: /admin/dashboard/referral_sources'
  }), [isLoading]);

  // Area chart configuration
  const areaChartConfig = useMemo(() => ({
    chartType: 'area',
    title: 'Treatment Types Distribution',
    chartAreaData: [],
    isLoading,
    isSuccess: false,
    message: 'API endpoint needed: /admin/dashboard/treatment_types'
  }), [isLoading]);

  // NEW: Weekly visits summary for dashboard cards
  const weeklyVisitsSummary = useMemo(() => {
    const dailyVisits = chartData.dailyVisits || [];
    
    if (dailyVisits.length === 0) {
      return {
        totalWeeklyVisits: 0,
        averagePerDay: 0,
        highestDay: null,
        lowestDay: null,
        hasData: false
      };
    }

    const totalVisits = dailyVisits.reduce((sum, item) => sum + (item.visits || 0), 0);
    const averagePerDay = Math.round(totalVisits / dailyVisits.length);
    
    // Find highest and lowest days
    const sortedDays = [...dailyVisits].sort((a, b) => (b.visits || 0) - (a.visits || 0));
    const highestDay = sortedDays[0];
    const lowestDay = sortedDays[sortedDays.length - 1];

    return {
      totalWeeklyVisits: totalVisits,
      averagePerDay,
      highestDay: {
        day: highestDay.day,
        visits: highestDay.visits || 0
      },
      lowestDay: {
        day: lowestDay.day,
        visits: lowestDay.visits || 0
      },
      hasData: true
    };
  }, [chartData.dailyVisits]);

  return {
    // Original charts
    chartConfigs,
    additionalLineCharts,
    barChartConfig,
    pieChartConfig,
    patientSourcePieChart,
    areaChartConfig,
    
    // Daily visits related charts and data
    dailyVisitsBarChart,
    dailyVisitsSummaryCard,
    weeklyVisitsSummary,
    
    // Helper data
    selectedYear,
    hasStats: !!stats,
    hasChartData: !!chartData && Object.keys(chartData).length > 0
  };
}

// recent