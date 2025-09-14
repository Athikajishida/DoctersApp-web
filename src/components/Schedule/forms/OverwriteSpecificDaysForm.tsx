import React, { useState } from 'react';
import { Calendar, Clock, X } from 'lucide-react';
import { useScheduleContext } from '../../../context/ScheduleContext';
import type { CreateScheduleRequest, UpdateScheduleRequest } from '../../../types/schedule';

// Types
interface TimeSlot {
  start: string;
  end: string;
}

interface SpecificDaySchedule {
  id: string;
  date: string;
  timings: TimeSlot;
}

interface OverwriteSpecificDaysProps {
  onClose?: () => void;
  onSave?: (schedule: Omit<SpecificDaySchedule, 'id'>) => void;
  editingSchedule?: SpecificDaySchedule;
}

const OverwriteSpecificDays: React.FC<OverwriteSpecificDaysProps> = ({
  onClose = () => {},
  onSave = () => {},
  editingSchedule
}) => {
  const { createSchedule, updateScheduleByDate } = useScheduleContext();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Function to convert time format to HH:MM for HTML time input
  const convertTimeToHHMM = (time: string): string => {
    if (!time) return '09:00';
    
    // If it's already in HH:MM format, return as is
    if (/^\d{1,2}:\d{2}$/.test(time)) {
      return time;
    }
    
    // If it's in HH:MM:SS format, remove seconds
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(time)) {
      return time.substring(0, 5);
    }
    
    // If it's in datetime format like "2000-01-01T08:00:00.000+05:30"
    if (time.includes('T')) {
      const timeStr = time.split('T')[1].split('.')[0]; // Gets "08:00:00"
      return timeStr.substring(0, 5); // Gets "08:00"
    }
    
    // If it's in 12-hour format with AM/PM, convert to 24-hour
    const isPM = /PM|pm/.test(time);
    const timeWithoutAMPM = time.replace(/\s*(AM|PM|am|pm)/i, '');
    const [hours, minutes] = timeWithoutAMPM.split(':');
    
    if (isPM && parseInt(hours) !== 12) {
      return `${(parseInt(hours) + 12).toString().padStart(2, '0')}:${minutes}`;
    } else if (!isPM && parseInt(hours) === 12) {
      return `00:${minutes}`;
    } else {
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
  };
  
  const [formData, setFormData] = useState({
    id: editingSchedule?.id,
    selectedDate: editingSchedule?.date || '',
    fromTime: convertTimeToHHMM(editingSchedule?.timings?.start || '09:00'),
    toTime: convertTimeToHHMM(editingSchedule?.timings?.end || '17:00')
  });

  const calculateDurationInMinutes = (fromTime: string, toTime: string) => {
    if (!fromTime || !toTime) return 0;
    
    const start = new Date(`1970-01-01T${fromTime}:00`);
    const end = new Date(`1970-01-01T${toTime}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60);
  };

  const validateTimeFormat = (time: string) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const validateForm = () => {
    if (!formData.selectedDate || !formData.fromTime || !formData.toTime) {
      return 'Please fill in all required fields';
    }

    if (!validateTimeFormat(formData.fromTime) || !validateTimeFormat(formData.toTime)) {
      return 'Please enter valid time format (HH:MM)';
    }

    // Check if selected date is not in the past
    const selectedDate = new Date(formData.selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return 'Please select a future date';
    }

    // Check if from time is before to time
    const fromTimeDate = new Date(`1970-01-01T${formData.fromTime}:00`);
    const toTimeDate = new Date(`1970-01-01T${formData.toTime}:00`);
    
    if (fromTimeDate >= toTimeDate) {
      return 'End time must be after start time';
    }

    return null;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      const durationInMinutes = calculateDurationInMinutes(formData.fromTime, formData.toTime);

      // Create schedule data for specific date matching the API structure
      const scheduleData: CreateScheduleRequest | UpdateScheduleRequest = {
        id: editingSchedule?.id,
        scheduled_date: formData.selectedDate,
        start_time: formData.fromTime,
        end_time: formData.toTime,
        duration_hr: Math.floor(durationInMinutes / 60),
        duration_min: durationInMinutes % 60,
        status: true
      };

      let success = false;
      if (editingSchedule?.id) {
        // Use updateScheduleByDate for editing existing custom schedules
        success = await updateScheduleByDate(formData.selectedDate, scheduleData);
      } else {
        // Use createSchedule for new custom schedules
        success = await createSchedule(scheduleData);
      }

      if (success) {
        setSuccess('Specific date schedule saved successfully!');

        // Call the parent onSave callback with the local format
        const localScheduleData = {
          date: formData.selectedDate,
          timings: { start: formData.fromTime, end: formData.toTime },
        };

        onSave(localScheduleData);
        
        // Close the modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      setError('Failed to save schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-[#333333]">Overwrite Specific Days</h2>
          <button 
            onClick={onClose}
            className="text-[#666666] hover:text-[#333333] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <p className="text-sm text-[#666666] mb-4">This will create a schedule that overrides the regular weekly schedule for the selected date.</p>
          </div>

         <div>
            <label className="block text-sm font-medium text-[#333333] mb-2">
              Select Dates
            </label>
            <div>
              <input
                type="date"
                value={formData.selectedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, selectedDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent text-sm"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

         <div>
            <label className="block text-sm font-medium text-[#333333] mb-2">
              Select the Duration
            </label>
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="time"
                  value={formData.fromTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, fromTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent text-sm"
                  placeholder="From"
                />
              </div>
              <div className="flex-1">
                <input
                  type="time"
                  value={formData.toTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, toTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent text-sm"
                  placeholder="To"
                />
              </div>
            </div>
          </div>
{/* Total Duration Display */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-[#666666] mt-1">
              Total Duration: {calculateDurationInMinutes(formData.fromTime, formData.toTime) > 0 
                ? `${Math.floor(calculateDurationInMinutes(formData.fromTime, formData.toTime) / 60)}h ${calculateDurationInMinutes(formData.fromTime, formData.toTime) % 60}m`
                : '__'
              }
            </div>
          </div>
        </div>


        <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-[#666666] hover:bg-gray-50 font-medium text-sm transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverwriteSpecificDays;