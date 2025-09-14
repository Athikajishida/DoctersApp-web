import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../../../types/patient.types';
import { usePatientDetails } from '../../../hooks/usePatients';
import { useAppointmentDetails } from '../../../hooks/useAppointmentDetails';
import { getInitials, formatDate, calculateAge } from '../../../utils/patientUtils';
import { Calendar, Phone, Mail, MapPin, User, Clock, FileText, Eye, ChevronRight, Video, Edit } from 'lucide-react';
import AppointmentView from '../../Dashboard/appointments/AppointmentView';

interface PatientDetailsProps {
  patient: Patient | null;
  onBack: () => void;
  onUpdate: (id: string, data: Partial<Patient>) => Promise<void>;
}

const PatientDetails: React.FC<PatientDetailsProps> = ({ 
  patient, 
  onBack, 
  onUpdate
}) => {
  const navigate = useNavigate();
  const { patient: detailedPatient, loading, error } = usePatientDetails(patient?.id?.toString() || null);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const { data: detailedAppointment, isLoading: detailLoading, error: detailError, refetch } = useAppointmentDetails(selectedAppointmentId);

  if (!patient) return null;

  // Use detailedPatient if available, otherwise fall back to patient prop
  const currentPatient = detailedPatient || patient;
  
  // Show loading only if we don't have any patient data and we're loading
  const shouldShowLoading = loading && !currentPatient;

  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading patient details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">Error loading patient details</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Helper functions
  const getPatientName = (patient: any) => {
    if (patient.name) return patient.name;
    if (patient.firstName && patient.lastName) {
      return `${patient.firstName} ${patient.lastName}`;
    }
    if (patient.firstName) return patient.firstName;
    if (patient.lastName) return patient.lastName;
    return 'Unknown Patient';
  };

  const getPatientAge = (patient: any) => {
    if (patient.age && patient.age > 0) return patient.age;
    if (patient.dateOfBirth) {
      return calculateAge(patient.dateOfBirth);
    }
    return 'N/A';
  };

  const getPatientGender = (patient: any) => {
    if (!patient.gender) return 'N/A';
    const gender = (patient.gender || '').toLowerCase();
    if (gender === 'male' || gender === 'm') return 'Male';
    if (gender === 'female' || gender === 'f') return 'Female';
    return patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase();
  };

  const getPatientPhone = (patient: any) => {
    return patient.phoneNumber || patient.mobileNumber || patient.phone || '';
  };

  const formatAppointmentDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatAppointmentTime = (timeString: string) => {
    try {
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
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      }
    } catch (error) {
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

  // Memoized appointments display - sorted by creation date (newest first)
  const displayedAppointments = useMemo(() => {
    const appointments = currentPatient.appointments || [];
    // Sort appointments by created_at in descending order (newest first)
    const sortedAppointments = appointments.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.date || 0);
      const dateB = new Date(b.created_at || b.date || 0);
      return dateB.getTime() - dateA.getTime(); // Descending order
    });
    

    
    return showAllAppointments ? sortedAppointments : sortedAppointments.slice(0, 3);
  }, [currentPatient.appointments, showAllAppointments]);

  const handleViewAppointment = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
  };

  const handleBackToList = () => {
    setSelectedAppointmentId(null);
  };

  const patientName = getPatientName(currentPatient);
  const patientAge = getPatientAge(currentPatient);
  const patientGender = getPatientGender(currentPatient);
  const patientPhone = getPatientPhone(currentPatient);

  if (selectedAppointmentId) {
    if (detailLoading) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-[#999999] text-sm ml-3">Loading appointment details...</p>
          </div>
        </div>
      );
    }

    if (detailError) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center text-red-600">
            <p>Error loading appointment details: {detailError?.toString()}</p>
            <button 
              onClick={handleBackToList}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <AppointmentView 
          appointment={detailedAppointment} 
          onBack={handleBackToList}
          refetchAppointment={refetch}
        />
      </div>
    );
  }

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
          Back to Patients
        </button>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Active Patient
          </span>
        </div>
      </div>

      {/* Patient Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
              {getInitials(patientName)}
            </div>
          </div>
          
          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">
                {patientName}
              </h2>
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                <span>{patientPhone ? patientPhone : 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                <span>{patientAge} {patientAge !== 'N/A' ? 'Years' : ''}</span>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                <span>{patientGender}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <span>{currentPatient.email || 'N/A'}</span>
              </div>
            </div>
            {currentPatient.address && (
              <div className="mt-2 text-sm text-gray-600 flex items-start">
                <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{currentPatient.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Patient Information</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Full Name</p>
                  <p className="text-sm text-gray-500">{patientName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Date of Birth</p>
                                     <p className="text-sm text-gray-500">
                     {currentPatient.dateOfBirth ? formatDate(currentPatient.dateOfBirth) : 'N/A'}
                   </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Created Date</p>
                  <p className="text-sm text-gray-500">
                    {currentPatient.created_at ? formatDate(currentPatient.created_at) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Last Appointment</p>
                  <p className="text-sm text-gray-500">
                     {currentPatient.lastAppointment ? formatDate(currentPatient.lastAppointment) : 'N/A'}
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Patient Overview</h3>
          </div>
          <div className="p-6">
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 leading-relaxed">
                  An after-visit summary that provides a patient with relevant and actionable 
                  information and instructions containing the patient name, provider's office 
                  contact information, date and location of visit, an updated medication list, 
                  updated vitals, reason(s) for visit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Appointment History</h3>
              <p className="text-sm text-gray-600 mt-1">
                {currentPatient.appointments?.length || 0} total appointments
              </p>
            </div>
            {currentPatient.appointments && currentPatient.appointments.length > 3 && (
              <button
                onClick={() => setShowAllAppointments(!showAllAppointments)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showAllAppointments ? 'Show Less' : 'View All'}
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {displayedAppointments && displayedAppointments.length > 0 ? (
            <div className="space-y-4">
              {displayedAppointments.map((appointment: any, index: number) => {
                return (
                  <div 
                    key={appointment.id || index}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleViewAppointment(appointment.id)}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Appointment
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.date ? formatAppointmentDate(appointment.date) : 'N/A'} at {appointment.time ? formatAppointmentTime(appointment.time) : 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status || 'Unknown')}`}>
                            {appointment.status || 'Unknown'}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {appointment.diseases && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {appointment.diseases}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Calendar className="w-12 h-12 mx-auto" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Appointments Found</h4>
              <p className="text-gray-500">This patient has no appointment history yet.</p>
            </div>
          )}
        </div>
      </div> 
    </div>
  );
};

export default PatientDetails;