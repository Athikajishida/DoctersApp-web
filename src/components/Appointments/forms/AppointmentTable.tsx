import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Appointment {
  id?: number;
  date: string;
  time: string;
  diseases: string;
  doctorName?: string;
  notes?: string;
  link?: string;
}

interface AppointmentTableProps {
  appointments: Appointment[];
}

const AppointmentTable: React.FC<AppointmentTableProps> = ({ appointments }) => {
  const handleGoToDetails = (appointment: Appointment, index: number) => {
    const appointmentId = appointment.id || index;
    console.log(`Navigate to appointment ${appointmentId}`);
    // navigate(`/admin/appointments/${appointmentId}`);
  };

  // Sample data for demo if no appointments provided
  const sampleAppointments = [
    { id: 1, date: '24-Jul-2022', time: '06:00 PM', diseases: 'Diabetes and Infection' },
    { id: 2, date: '24-Jul-2022', time: '06:15 AM', diseases: 'Diabetes and Infection' },
    { id: 3, date: '24-Jul-2022', time: '07:25 PM', diseases: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry' },
  ];

  const displayAppointments = appointments.length > 0 ? appointments : sampleAppointments;

  return (
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Time
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Diseases
                </th>
                <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayAppointments.map((appointment, idx) => (
                <tr key={appointment.id || idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-sm text-gray-900 font-medium">
                    {appointment.date}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-900">
                    {appointment.time}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-900 max-w-md">
                    {appointment.diseases}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleGoToDetails(appointment, idx)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
                    >
                      Go to Details
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  );
};

export default AppointmentTable;