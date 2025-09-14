import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { registrationApi } from '../../../services/registrationApi';
import { updateBookedSlot } from '../../../services/adminAppointmentApi';
import { useToast } from '../../../context/ToastContext';

interface RescheduleModalProps {
  appointmentId: number;
  patientId: string;
  slotId: number;
  isAlreadyRegistered: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ 
  appointmentId, 
  patientId,
  slotId,
  isAlreadyRegistered,
  onClose,
  onSuccess 
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date) {
      fetchAvailableSlots(date);
    } else {
      setAvailableSlots([]);
    }
  };

  // Fetch available slots for the selected date
  const fetchAvailableSlots = async (date: string) => {
    setLoadingSlots(true);
    setSlotsError(null);
    try {
      const apiResponse = await registrationApi.getAvailableSchedule(
        patientId,
        date,
        isAlreadyRegistered
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
    } catch (error: any) {
      setSlotsError('Failed to load available slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle reschedule submission
  const handleSubmitReschedule = async () => {
    if (!selectedDate || !selectedSlot) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Find the selected slot object for slot_time
      const selectedSlotObj = availableSlots.find(slot => slot.id === selectedSlot);
      const slotTime = selectedSlotObj ? selectedSlotObj.time : '';

      // Use the updateBookedSlot function like in the original code
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
      
      showToast('Appointment rescheduled successfully', 'success');
      
      // Invalidate all appointment queries to refresh all tabs
      await queryClient.invalidateQueries({ 
        queryKey: ['tabAppointments'],
        exact: false 
      });
      
      // Also invalidate appointment details queries
      await queryClient.invalidateQueries({ 
        queryKey: ['appointment'],
        exact: false 
      });
      
      // Invalidate all appointments overview
      await queryClient.invalidateQueries({ 
        queryKey: ['allAppointments'],
        exact: false 
      });
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      setSubmitError('Failed to update slot.');
      showToast('Failed to reschedule appointment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-[#333333]">Reschedule Appointment</h2>
            <button 
              onClick={onClose}
              className="text-[#666666] hover:text-[#333333] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-2">
                Select Dates
              </label>
              <div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent text-sm"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Time Slots Selection */}
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-2">
                Select Available Slots
              </label>
              <div className="min-h-[120px] max-h-48 overflow-y-auto">
                {loadingSlots ? (
                  <div className="p-4 text-center">
                    <span className="text-sm text-[#666666]">Loading available slots...</span>
                  </div>
                ) : slotsError ? (
                  <div className="p-4 text-center">
                    <span className="text-sm text-red-500">{slotsError}</span>
                  </div>
                ) : selectedDate ? (
                  availableSlots.length > 0 ? (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-3 gap-3">
                        {availableSlots.map(slot => (
                          <div
                            key={slot.id}
                            className={`relative cursor-pointer transition-colors ${
                              selectedSlot === slot.id 
                                ? 'bg-[#4A90E2] text-white' 
                                : 'bg-white hover:bg-gray-50 border border-gray-200'
                            } rounded-lg p-3 text-center`}
                            onClick={() => setSelectedSlot(slot.id)}
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
                              {slot.time}
                            </span>
                            {selectedSlot === slot.id && (
                              <div className="absolute top-1 right-1">
                                <X className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <span className="text-sm text-[#666666]">No slots available for this date.</span>
                    </div>
                  )
                ) : (
                  <div className="p-4 text-center">
                    <span className="text-sm text-[#666666]">Select a date to view slots</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-[#666666] hover:bg-gray-50 font-medium text-sm transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReschedule}
              disabled={!selectedDate || !selectedSlot || submitting}
              className="px-6 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;