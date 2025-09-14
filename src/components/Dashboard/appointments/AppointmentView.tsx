import React from 'react';
import { formatPhoneNumber, getInitials } from '../../../utils/patientUtils';
import { Edit, FileText, Plus } from 'lucide-react';
import { useState } from 'react';
import { registrationApi } from '../../../services/registrationApi';
import { useToast } from '../../../context/ToastContext';
import PrescriptionView from '../../Prescription/PrescriptionView';
import RescheduleModal from './RescheduleModal';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface FileAttachment {
  id: number;
  file: { url: string };
  created_at: string;
}

interface PrescriptionNote {
  prescription: string;
  details?: string;
}

interface AppointmentViewProps {
  appointment: {
    id?: number;
    appointment_status?: string;
    treatment_history?: string;
    additional_details?: string;
    meet_link?: string;
    is_already_registered?: boolean;
    patient?: {
      first_name: string;
      last_name: string;
      phone_number: string;
      age: number;
      gender: 'M' | 'F';
      email?: string;
      address?: string;
    };
    booked_slots?: Array<{
      id: number;
      slot_date: string;
      slot_time: string;
    }>;
    pathology_files?: FileAttachment[];
    imageology_files?: FileAttachment[];
    additional_files?: FileAttachment[];
    prescription_notes?: PrescriptionNote[];
    patient_id?: number;
  } | null;
  onBack: () => void;
  refetchAppointment?: () => Promise<unknown>;
}

const AppointmentView: React.FC<AppointmentViewProps> = ({ appointment, onBack, refetchAppointment }) => {
  const { showToast } = useToast();
  
  // Add missing state variables
  const [showPrescriptionView, setShowPrescriptionView] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);


  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Check if it's a time range (contains '-')
      if (timeString.includes('-')) {
        const [startTime, endTime] = timeString.split('-');
        const formatSingleTime = (time: string) => {
          const [hours, minutes] = time.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
        };
        
        const formattedStart = formatSingleTime(startTime);
        const formattedEnd = formatSingleTime(endTime);
        return `${formattedStart} - ${formattedEnd}`;
      } else {
        // Handle single time
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      case 'inprogress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no show':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  const handlePrescriptionSave = () => {
    setShowPrescriptionView(false);
    showToast('Prescription saved successfully', 'success');
    // Optionally refetch appointment data if needed
    if (typeof refetchAppointment === 'function') {
      refetchAppointment();
    }
  };

  const handleBackToPrescription = () => {
    setShowPrescriptionView(false);
  };

  const handleRescheduleSuccess = () => {
    if (typeof refetchAppointment === 'function') {
      refetchAppointment();
    }
  };

  if (!appointment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">No appointment data available</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show prescription view if requested
  if (showPrescriptionView) {
    return (
      <PrescriptionView
        appointmentId={appointment.id}
        patient={appointment.patient}
        onBack={handleBackToPrescription}
        onSave={handlePrescriptionSave}
      />
    );
  }

  const patient = appointment.patient;
  const bookedSlot = appointment.booked_slots?.[0];

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Appointments
        </button>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.appointment_status)}`}>
            {appointment.appointment_status || 'Unknown'}
          </span>
          <button
            onClick={() => setShowPrescriptionView(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <span>Prescription</span>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Patient Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
              {getInitials(patient.first_name + ' ' + patient.last_name)}
            </div>
          </div>
          
          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">
                {patient?.first_name} {patient?.last_name}
              </h2>
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Phone:</span> {patient?.phone_number ? formatPhoneNumber(patient.phone_number) : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Age:</span> {patient?.age || 'N/A'} years
              </div>
              <div>
                <span className="font-medium">Gender:</span> {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase() : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {patient?.email || 'N/A'}
              </div>
            </div>
            {patient?.address && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Address:</span> {patient.address}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg relative">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Appointment Date & Time</p>
                  <p className="text-sm text-gray-500">
                    {bookedSlot?.slot_date ? formatDate(bookedSlot.slot_date) : 'N/A'} at {bookedSlot?.slot_time ? formatTime(bookedSlot.slot_time) : 'N/A'}
                  </p>
                </div>
                {/* Edit Icon */}
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded hover:bg-gray-200"
                  onClick={() => setShowRescheduleModal(true)}
                  aria-label="Edit Appointment"
                >
                  <Edit size={20} className="text-gray-500" />
                </button>
              </div>

              {appointment.treatment_history && (
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Treatment History</p>
                    <p className="text-sm text-gray-500 whitespace-pre-wrap">{appointment.treatment_history}</p>
                  </div>
                </div>
              )}

              {appointment.additional_details && (
                <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Additional Details</p>
                    <p className="text-sm text-gray-500 whitespace-pre-wrap">{appointment.additional_details}</p>
                  </div>
                </div>
              )}

              {appointment.meet_link && (
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Meeting Link</p>
                    <a 
                      href={appointment.meet_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Join Meeting
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Attachments</h3>
          </div>
          <div className="p-6">
            {appointment.pathology_files?.length > 0 || appointment.imageology_files?.length > 0 || appointment.additional_files?.length > 0 ? (
              <div className="space-y-4">
                {/* Pathology Files */}
                {appointment.pathology_files?.map((file: FileAttachment) => (
                  <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">Pathology Report</p>
                      <p className="text-xs text-gray-500">Uploaded on {formatDate(file.created_at)}</p>
                    </div>
                    {file.file?.url ? (
                      <button 
                        onClick={() => {
                          const url = `${API_BASE_URL}${file.file.url}`;
                          window.open(url, '_blank');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">No file</span>
                    )}
                  </div>
                ))}

                {/* Imageology Files */}
                {appointment.imageology_files?.map((file: FileAttachment) => (
                  <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">Imageology Report</p>
                      <p className="text-xs text-gray-500">Uploaded on {formatDate(file.created_at)}</p>
                    </div>
                    {file.file?.url ? (
                      <button 
                        onClick={() => {
                          const url = `${API_BASE_URL}${file.file.url}`;
                          window.open(url, '_blank');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">No file</span>
                    )}
                  </div>
                ))}

                {/* Additional Files */}
                {appointment.additional_files?.map((file: FileAttachment) => (
                  <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">Additional Document</p>
                      <p className="text-xs text-gray-500">Uploaded on {formatDate(file.created_at)}</p>
                    </div>
                    {file.file?.url ? (
                      <button 
                        onClick={() => {
                          const url = `${API_BASE_URL}${file.file.url}`;
                          window.open(url, '_blank');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">No file</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No attachments found for this appointment.</p>
            )}
          </div>
        </div>
      </div>

       {/* Prescription Notes */}
      {appointment.prescription_notes?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Prescription Notes</h3>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {appointment.prescription_notes.map((note: PrescriptionNote, index: number) => (
                <div key={index} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{note.prescription}</p>
                      {note.details && (
                        <p className="text-sm text-gray-600 mt-1">{note.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Reschedule Modal */}
      {showRescheduleModal && appointment?.id && appointment?.patient_id && appointment?.booked_slots?.[0]?.id && (
        <RescheduleModal
          appointmentId={appointment.id}
          patientId={appointment.patient_id.toString()}
          slotId={appointment.booked_slots[0].id}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={handleRescheduleSuccess}
          isAlreadyRegistered = {appointment?.is_already_registered}
        />
      )}

    </div>
  );
};

export default AppointmentView; 