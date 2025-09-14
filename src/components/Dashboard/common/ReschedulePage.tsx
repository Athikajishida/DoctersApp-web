import React, { useState } from 'react';
import { registrationApi } from '../../../services/registrationApi';
import { updateBookedSlot } from '../../../services/adminAppointmentApi';
import { useToast } from '../../../context/ToastContext';
import ConfirmationDialog from '../../common/ConfirmationDialog';

interface ReschedulePageProps {
  appointment: {
    id?: number;
    patient?: {
      first_name: string;
      last_name: string;
      phone_number: string;
      age: number;
      gender: 'M' | 'F';
    };
    booked_slots?: Array<{
      id: number;
      slot_date: string;
      slot_time: string;
    }>;
    patient_id?: number;
  } | null;
  onBack: () => void;
  onSuccess?: () => void;
}

const ReschedulePage: React.FC<ReschedulePageProps> = ({ 
  appointment, 
  onBack, 
  onSuccess 
}) => {
  const { showToast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ 
    id: string; 
    time: string; 
    available: boolean; 
    scheduleId?: string 
  }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  // Fetch slots when date changes
  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot('');
    setAvailableSlots([]);
    setSlotsError(null);
    
    if (!date || !appointment?.patient || !('patient_id' in appointment)) return;
    
    setLoadingSlots(true);
    try {
      const apiResponse = await registrationApi.getAvailableSchedule(
        appointment.patient_id.toString(),
        date,
        true // isAlreadyRegistered, adjust if needed
      );
      
      let slots: { id: string; time: string; available: boolean; scheduleId?: string }[] = [];
      
      if (
        apiResponse &&
        typeof apiResponse === 'object' &&
        'available_slots' in apiResponse &&
        Array.isArray(apiResponse.available_slots)
      ) {
        const scheduleId = 'id' in apiResponse ? apiResponse.id : undefined;
        slots = apiResponse.available_slots.map((slot: { start: string; end: string }) => ({
          id: `${slot.start}-${slot.end}`,
          time: `${slot.start}-${slot.end}`,
          available: true,
          scheduleId: scheduleId ? String(scheduleId) : undefined,
        }));
      }
      
      setAvailableSlots(slots);
    } catch {
      setSlotsError('Failed to load available slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Find the selected slot object for slot_time
  const selectedSlotObj = availableSlots.find(slot => slot.id === selectedSlot);
  const slotTime = selectedSlotObj ? selectedSlotObj.time.split('-')[0] : '';

  const handleSubmitReschedule = () => {
    if (!appointment?.booked_slots || appointment.booked_slots.length === 0 || !selectedDate || !slotTime) return;
    setShowConfirmDialog(true);
  };

  const confirmReschedule = async () => {
    if (!appointment?.booked_slots || appointment.booked_slots.length === 0 || !selectedDate || !slotTime) return;
    
    const slotId = appointment.booked_slots[0].id;
    setSubmitting(true);
    setSubmitError(null);
    setShowConfirmDialog(false);
    
    try {
      const response = await updateBookedSlot(slotId, selectedDate, slotTime);
      
      if (response && 'errors' in response && response.errors) {
        if (Array.isArray(response.errors)) {
          setSubmitError(response.errors.join(', '));
        } else {
          setSubmitError(String(response.errors));
        }
        setSubmitting(false);
        return;
      }
      
      showToast('Appointment slot updated successfully', 'success');
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch {
      setSubmitError('Failed to update slot.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
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
        </div>
      </div>
    );
  }

  const patient = appointment.patient;
  const bookedSlot = appointment.booked_slots?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onBack}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-2xl font-bold text-gray-900">Reschedule Appointment</h1>
              </div>
            </div>
          </div>

          {/* Patient Info in Header */}
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                {patient?.first_name?.[0]}{patient?.last_name?.[0]}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {patient?.first_name} {patient?.last_name}
                </h2>
                <p className="text-sm text-gray-600">
                  Current appointment: {bookedSlot?.slot_date ? formatDate(bookedSlot.slot_date) : 'N/A'} at {bookedSlot?.slot_time ? formatTime(bookedSlot.slot_time) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reschedule Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Select New Date & Time</h3>
          </div>
          
          <div className="p-6">
            {/* Date Picker */}
            <div className="mb-6">
              <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <div className="relative max-w-xs">
                <input
                  type="date"
                  id="appointmentDate"
                  value={selectedDate}
                  onChange={e => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Available Slots */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Available Time Slots
              </label>
              
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <svg className="animate-spin h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 20v-5h-5" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20l7-7 7 7" />
                    </svg>
                    <span>Loading available slots...</span>
                  </div>
                </div>
              ) : slotsError ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-red-600 mb-2">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-600 text-sm">{slotsError}</p>
                  </div>
                </div>
              ) : selectedDate ? (
                availableSlots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableSlots.map(slot => (
                      <label
                        key={slot.id}
                        className={`flex items-center justify-center px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                          selectedSlot === slot.id 
                            ? 'bg-blue-50 border-blue-500 text-blue-700' 
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="slot"
                          value={slot.id}
                          checked={selectedSlot === slot.id}
                          onChange={() => setSelectedSlot(slot.id)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">
                          {formatTime(slot.time)}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">No available slots for this date</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Please select a date to view available slots</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                className="px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                onClick={onBack}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={!selectedDate || !selectedSlot || submitting}
                onClick={handleSubmitReschedule}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating...
                  </div>
                ) : (
                  'Update Appointment'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          title="Confirm Reschedule"
          message="Are you sure you want to update the slot for this appointment? This action cannot be undone."
          confirmText="Update Slot"
          cancelText="Cancel"
          onConfirm={confirmReschedule}
          onCancel={() => setShowConfirmDialog(false)}
          type="warning"
        />
      </div>
    </div>
  );
};

export default ReschedulePage;