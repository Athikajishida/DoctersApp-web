import type { AdminApiAppointment } from '../types/adminAppointment.types';
import type { Appointment } from '../types/dashboard.types';

export function transformAdminApiAppointmentToAppointment(adminApiAppointment: AdminApiAppointment): Appointment {
  const bookedSlot = adminApiAppointment.booked_slots?.[0];
  
  return {
    id: adminApiAppointment.id,
    patientName: `${adminApiAppointment.patient.first_name} ${adminApiAppointment.patient.last_name}`,
    mobileNumber: adminApiAppointment.patient.phone_number,
    gender: adminApiAppointment.patient.gender,
    age: adminApiAppointment.patient.age,
    diseases: adminApiAppointment.treatment_history || 'N/A',
    status: getAdminAppointmentStatus(bookedSlot?.slot_date, bookedSlot?.slot_time),
    date: bookedSlot?.slot_date,
    time: bookedSlot?.slot_time,
  };
}

function getAdminAppointmentStatus(date?: string, time?: string): 'Upcoming' | 'InProgress' | 'Completed' | 'Cancelled' {
  if (!date || !time) return 'Upcoming';
  
  const appointmentDateTime = new Date(`${date} ${time}`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const appointmentDate = new Date(appointmentDateTime.getFullYear(), appointmentDateTime.getMonth(), appointmentDateTime.getDate());
  
  if (appointmentDate < today) {
    return 'Completed';
  } else if (appointmentDate.getTime() === today.getTime()) {
    // Check if appointment time has passed today
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const appointmentTime = appointmentDateTime.getHours() * 60 + appointmentDateTime.getMinutes();
    
    if (appointmentTime < currentTime - 60) { // 1 hour buffer
      return 'Completed';
    } else if (appointmentTime <= currentTime + 30) { // 30 minutes buffer
      return 'InProgress';
    }
  }
  
  return 'Upcoming';
}

export function filterAdminAppointmentsByDate(appointments: Appointment[], filterType: 'today' | 'past' | 'future'): Appointment[] {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  return appointments.filter(appointment => {
    if (!appointment.date) return false;
    
    const appointmentDate = appointment.date;
    
    switch (filterType) {
      case 'today':
        return appointmentDate === todayStr;
      case 'past':
        return appointmentDate < todayStr;
      case 'future':
        return appointmentDate > todayStr;
      default:
        return true;
    }
  });
}