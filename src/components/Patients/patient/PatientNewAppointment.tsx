import React, { useState } from 'react';
import type { Patient } from '../../../types/patient.types';
import { usePatientDetails } from '../../../hooks/usePatients';
import { formatPhoneNumber } from '../../../utils/patientUtils';
import AttachmentDownload from '../common/AttachmentDownload';

interface PatientDetailsProps {
  patient: Patient | null;
  onBack: () => void;
  onUpdate: (id: string, data: Partial<Patient>) => Promise<void>;
}

const PatientNewAppointment: React.FC<PatientDetailsProps> = ({ patient, onBack, onUpdate }) => {
  const { patient: detailedPatient, loading } = usePatientDetails(patient?.id || null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  if (!patient) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const currentPatient = detailedPatient || patient;
  
  // Get the most recent appointment from the appointments array
  const mostRecentAppointment = currentPatient.appointments?.[0] || null;
  const bookedSlot = mostRecentAppointment?.booked_slots?.[0] || null;
  
  // Format date and time from the booked slot
  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAppointmentTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Create attachment objects from appointment files
  const getAllAttachments = () => {
    if (!mostRecentAppointment) return [];
    
    const attachments = [];
    
    // Add pathology files (if they exist as arrays)
    if (Array.isArray(mostRecentAppointment.pathology_files)) {
      mostRecentAppointment.pathology_files.forEach((file: any, index: number) => {
        attachments.push({
          id: `pathology-${index}`,
          name: file.name || `Pathology Report ${index + 1}.pdf`,
          type: 'pathology' as const,
          url: file.url || '#',
          uploadedAt: file.uploaded_at || mostRecentAppointment.date
        });
      });
    }
    
    // Add imageology files (if they exist as arrays)
    if (Array.isArray(mostRecentAppointment.imageology_files)) {
      mostRecentAppointment.imageology_files.forEach((file: any, index: number) => {
        attachments.push({
          id: `imageology-${index}`,
          name: file.name || `Imaging Report ${index + 1}.pdf`,
          type: 'imageology' as const,
          url: file.url || '#',
          uploadedAt: file.uploaded_at || mostRecentAppointment.date
        });
      });
    }
    
    // Add additional files (if they exist as arrays)
    if (Array.isArray(mostRecentAppointment.additional_files)) {
      mostRecentAppointment.additional_files.forEach((file: any, index: number) => {
        attachments.push({
          id: `additional-${index}`,
          name: file.name || `Additional Document ${index + 1}.pdf`,
          type: 'additional' as const,
          url: file.url || '#',
          uploadedAt: file.uploaded_at || mostRecentAppointment.date
        });
      });
    }
    
    return attachments;
  };

  const attachments = getAllAttachments();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentPatient.firstName} {currentPatient.lastName}
                </h1>
                <p className="text-gray-600">New Appointment</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Patient Information Card */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                <p className="text-gray-900">{currentPatient.firstName} {currentPatient.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Age</label>
                <p className="text-gray-900">{currentPatient.age} Years</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
                <p className="text-gray-900">{currentPatient.gender}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                <p className="text-gray-900">{formatPhoneNumber(currentPatient.phoneNumber)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900">{currentPatient.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Appointment</label>
                <p className="text-gray-900">
                  {currentPatient.lastAppointment 
                    ? new Date(currentPatient.lastAppointment).toLocaleDateString()
                    : 'No previous appointments'
                  }
                </p>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                <p className="text-gray-900">{currentPatient.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Appointment Details Card */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Appointment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Date</label>
                <p className="text-gray-900">
                  {bookedSlot?.slot_date 
                    ? formatAppointmentDate(bookedSlot.slot_date)
                    : mostRecentAppointment?.date 
                      ? formatAppointmentDate(mostRecentAppointment.date)
                      : 'No appointment scheduled'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Time</label>
                <p className="text-gray-900">
                  {bookedSlot?.slot_time 
                    ? formatAppointmentTime(bookedSlot.slot_time)
                    : mostRecentAppointment?.time 
                      ? formatAppointmentTime(mostRecentAppointment.time)
                      : 'No time scheduled'
                  }
                </p>
              </div>
            </div>
            <div className='flex gap-6 '>
              {mostRecentAppointment?.link && (
                <a 
                  href={mostRecentAppointment.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                  Meeting Started
                </a>
              )}
              <button
                onClick={() => setShowRescheduleModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Reschedule Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Clinical Summary and Additional Details */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Summary / Treatment History</h3>
              <p className="text-gray-600">
                {mostRecentAppointment?.diseases || 
                  'No treatment history available for this appointment.'}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
              <p className="text-gray-600">
                {mostRecentAppointment?.notes || 
                  'No additional details available for this appointment.'}
              </p>
            </div>
          </div>
        </div>

        {/* Attachments Card */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
            {attachments.length > 0 ? (
              <AttachmentDownload patientId={currentPatient.id} attachments={attachments} />
            ) : (
              <p className="text-gray-500 text-sm">No attachments available for this appointment.</p>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reschedule Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Available Slots</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">10:00-10:15 AM</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">10:15-10:30 AM</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientNewAppointment;