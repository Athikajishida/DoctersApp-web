import type { Appointment } from '../types/dashboard.types';

/**
 * Filter appointments based on search term
 */
export const filterAppointments = (
  appointments: Appointment[],
  searchTerm: string
): Appointment[] => {
  if (!searchTerm.trim()) return appointments;

  const term = searchTerm.toLowerCase();
  return appointments.filter(appointment =>
    (appointment.patientName?.toLowerCase() || '').includes(term) ||
    (appointment.diseases?.toLowerCase() || '').includes(term) ||
    (appointment.mobileNumber || '').includes(term) ||
    (appointment.status?.toLowerCase() || '').includes(term)
  );
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format time for display
 */
export const formatTime = (timeString: string): string => {
  return timeString;
};

/**
 * Get status color class
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'InProgress':
      return 'text-[#FF6B6B]';
    case 'Upcoming':
      return 'text-[#4A90E2]';
    case 'Completed':
      return 'text-[#28A745]';
    case 'Cancelled':
      return 'text-[#DC3545]';
    case 'No Show':
      return 'text-[#FFA500]';
    default:
      return 'text-[#666666]';
  }
};

/**
 * Sort appointments by date and time
 */
export const sortAppointmentsByDateTime = (appointments: Appointment[]): Appointment[] => {
  return appointments.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    
    const dateA = new Date(`${a.date} ${a.time || '00:00'}`);
    const dateB = new Date(`${b.date} ${b.time || '00:00'}`);
    
    return dateA.getTime() - dateB.getTime();
  });
};

/**
 * Get appointment counts by status
 */
export const getAppointmentCounts = (appointments: Appointment[]) => {
  return appointments.reduce((counts, appointment) => {
    const status = appointment.status || 'Unknown';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
};

/**
 * Validate appointment data
 */
export const validateAppointment = (appointment: Partial<Appointment>): string[] => {
  const errors: string[] = [];

  if (!appointment.patientName?.trim()) {
    errors.push('Patient name is required');
  }

  if (!appointment.mobileNumber?.trim()) {
    errors.push('Mobile number is required');
  }

  if (!appointment.gender || !['M', 'F'].includes(appointment.gender)) {
    errors.push('Valid gender is required');
  }

  if (!appointment.age || appointment.age < 0 || appointment.age > 120) {
    errors.push('Valid age is required');
  }

  if (!appointment.diseases?.trim()) {
    errors.push('Diseases/conditions are required');
  }

  return errors;
};

/**
 * Generate dummy appointment data for testing
 */
export const generateDummyAppointment = (id: number): Appointment => {
  const names = [
    'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis',
    'Robert Wilson', 'Jennifer Garcia', 'David Martinez', 'Lisa Anderson'
  ];
  
  const diseases = [
    'Hypertension', 'Diabetes', 'Migraine', 'Asthma', 'Back Pain',
    'Thyroid', 'Allergies', 'Skin Condition', 'Heart Condition', 'Arthritis'
  ];
  
  const statuses: ('InProgress' | 'Upcoming' | 'Completed' | 'Cancelled' | 'No Show')[] = ['InProgress', 'Upcoming', 'Completed', 'Cancelled', 'No Show'];
  const genders: ('M' | 'F')[] = ['M', 'F'];

  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  const randomGender = genders[Math.floor(Math.random() * genders.length)];

  return {
    id,
    patientName: randomName,
    mobileNumber: `+1 234-567-${8900 + id}`,
    gender: randomGender,
    age: Math.floor(Math.random() * 60) + 20,
    diseases: randomDisease,
    status: randomStatus,
    date: new Date().toISOString().split('T')[0],
    time: `${Math.floor(Math.random() * 8) + 9}:${['00', '30'][Math.floor(Math.random() * 2)]} AM`
  };
};