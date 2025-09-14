import React from 'react';
import { PatientDetails } from '../../../types/patient.types';
import { formatPhoneNumber, getInitials } from '../../../utils/patientUtils';

interface PatientOverviewProps {
  patient: PatientDetails;
}

const PatientOverview: React.FC<PatientOverviewProps> = ({ patient }) => {
  // Transform appointments from API to match expected format
  const transformedAppointments = patient.appointments?.map(appointment => ({
    id: appointment.id,
    date: appointment.booked_slots?.[0]?.slot_date || new Date().toISOString().split('T')[0],
    time: appointment.booked_slots?.[0]?.slot_time || '00:00',
    diseases: appointment.treatment_history || 'General Consultation',
    doctorName: 'Dr. Smith', // This should come from appointment data when available
    notes: appointment.additional_details || '',
    status: appointment.booked_slots?.[0]?.is_booked ? 'completed' : 'upcoming',
    link: appointment.meet_link
  })) || [];

  const recentAppointments = transformedAppointments
    .filter(apt => apt.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const upcomingAppointments = transformedAppointments
    .filter(apt => apt.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Get file attachments from appointments
  const getAllAttachments = () => {
    const attachments: any[] = [];
    patient.appointments?.forEach(appointment => {
      // Add pathology files
      appointment.pathology_files?.forEach((file: any) => {
        attachments.push({
          id: `pathology-${file.id}`,
          name: file.name || 'Pathology Report',
          type: 'pathology',
          uploadedAt: appointment.created_at,
          url: file.url
        });
      });
      
      // Add imageology files
      appointment.imageology_files?.forEach((file: any) => {
        attachments.push({
          id: `imageology-${file.id}`,
          name: file.name || 'Imaging Report',
          type: 'imageology',
          uploadedAt: appointment.created_at,
          url: file.url
        });
      });
      
      // Add additional files
      appointment.additional_files?.forEach((file: any) => {
        attachments.push({
          id: `additional-${file.id}`,
          name: file.name || 'Additional Document',
          type: 'document',
          uploadedAt: appointment.created_at,
          url: file.url
        });
      });
    });
    return attachments;
  };

  const recentAttachments = getAllAttachments()
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 4);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'upcoming':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get patient full name
  const getPatientName = () => {
    if (patient.name) return patient.name;
    if (patient.firstName && patient.lastName) {
      return `${patient.firstName} ${patient.lastName}`;
    }
    return 'Unknown Patient';
  };

  return (
    <div className="space-y-6">
      {/* Patient Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
              {getInitials(getPatientName())}
            </div>
          </div>
          
          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">{getPatientName()}</h2>
              <span className={getStatusBadge(patient.status || 'active')}>
                {patient.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Phone:</span> {formatPhoneNumber(patient.mobileNumber || patient.phoneNumber || '')}
              </div>
              <div>
                <span className="font-medium">Age:</span> {patient.age} years
              </div>
              <div>
                <span className="font-medium">Gender:</span> {patient.gender}
              </div>
              <div>
                <span className="font-medium">Total Visits:</span> {patient.appointments?.length || 0}
              </div>
            </div>
            {patient.email && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Email:</span> {patient.email}
              </div>
            )}
            {patient.address && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Address:</span> {patient.address}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Appointments</p>
              <p className="text-lg font-semibold text-gray-900">{patient.appointments?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-lg font-semibold text-gray-900">
                {transformedAppointments.filter(apt => apt.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-lg font-semibold text-gray-900">
                {transformedAppointments.filter(apt => apt.status === 'upcoming').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Attachments</p>
              <p className="text-lg font-semibold text-gray-900">{recentAttachments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Appointments</h3>
          </div>
          <div className="p-6">
            {recentAppointments.length > 0 ? (
              <div className="space-y-4">
                {recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{appointment.diseases}</p>
                      <p className="text-sm text-gray-500">{formatDate(appointment.date)} at {appointment.time}</p>
                      {appointment.notes && (
                        <p className="text-xs text-gray-400 mt-1">{appointment.notes}</p>
                      )}
                    </div>
                    <span className={getStatusBadge(appointment.status)}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent appointments found.</p>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Appointments</h3>
          </div>
          <div className="p-6">
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{appointment.diseases}</p>
                      <p className="text-sm text-gray-500">{formatDate(appointment.date)} at {appointment.time}</p>
                      {appointment.notes && (
                        <p className="text-xs text-gray-400 mt-1">{appointment.notes}</p>
                      )}
                    </div>
                    <span className={getStatusBadge(appointment.status)}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No upcoming appointments scheduled.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Attachments */}
      {recentAttachments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Attachments</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentAttachments.map((attachment) => (
                <div key={attachment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{attachment.type}</p>
                      <p className="text-xs text-gray-400">{formatDate(attachment.uploadedAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Medical History */}
      {patient.medicalHistory && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Medical History</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-700 whitespace-pre-wrap">{patient.medicalHistory}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientOverview;