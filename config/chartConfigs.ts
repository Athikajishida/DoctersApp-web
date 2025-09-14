// config/chartConfigs.ts
import {
  MdGroup,
  MdInventory2,
  MdAssessment,
  MdSwapHorizontalCircle,
  MdCalendarToday,
  MdSchedule,
  MdPersonAdd
} from 'react-icons/md';

// Static chart configurations (can be used as fallback or demo data)
export const staticChartConfigs = {
  treatmentSuccess: {
    color: 'teal',
    IconBox: MdAssessment,
    title: 'Treatment Success',
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
  },

  patientSatisfaction: {
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
  },

  dailyVisits: {
    title: 'Daily Patient Visits',
    color: '#FF8042',
    dataKey: 'visit',
    chartData: [
      { name: 'Mon', visit: 45 },
      { name: 'Tue', visit: 52 },
      { name: 'Wed', visit: 38 },
      { name: 'Thu', visit: 61 },
      { name: 'Fri', visit: 48 },
      { name: 'Sat', visit: 35 },
      { name: 'Sun', visit: 28 },
    ],
  },

  patientSources: {
    title: 'Patient Referral Sources',
    chartPieData: [
      { name: 'Direct Visit', value: 350, color: '#0088FE' },
      { name: 'Online Booking', value: 250, color: '#00C49F' },
      { name: 'Phone Call', value: 180, color: '#FFBB28' },
      { name: 'Referral', value: 120, color: '#FF8042' },
    ],
  },

  treatmentTypes: {
    title: 'Treatment Types Distribution',
    chartAreaData: [
      {
        name: 'Jan',
        consultation: 120,
        surgery: 45,
        therapy: 80,
        checkup: 200,
      },
      {
        name: 'Feb',
        consultation: 135,
        surgery: 52,
        therapy: 95,
        checkup: 180,
      },
      {
        name: 'Mar',
        consultation: 145,
        surgery: 38,
        therapy: 110,
        checkup: 220,
      },
      {
        name: 'Apr',
        consultation: 160,
        surgery: 65,
        therapy: 85,
        checkup: 195,
      },
      {
        name: 'May',
        consultation: 140,
        surgery: 48,
        therapy: 125,
        checkup: 210,
      },
      {
        name: 'Jun',
        consultation: 175,
        surgery: 55,
        therapy: 100,
        checkup: 185,
      },
    ],
  }
};