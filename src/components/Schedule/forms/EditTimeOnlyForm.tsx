import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';
import { scheduleService } from '../../../services/scheduleService';
import type { UpdateScheduleRequest } from '../../../types/schedule';

// Types
interface EditTimeOnlyProps {
  onClose?: () => void;
  onSave?: (schedule: any) => void;
  editingSchedule?: {
    id: string;
    day: string;
    start_time: string;
    end_time: string;
  };
}

const EditTimeOnly: React.FC<EditTimeOnlyProps> = ({
  onClose = () => {},
  onSave = () => {},
  editingSchedule
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Extract time from datetime string or use as-is if already in HH:MM format
  const extractTime = (timeString: string) => {
    if (!timeString) return '';
    
    if (timeString.includes('T')) {
      // Handle datetime format like "2000-01-01T08:00:00.000+05:30"
      return timeString.split('T')[1].split('.')[0].slice(0, 5); // Gets "08:00"
    }
    
    // Handle simple time format like "08:00" or "08:00:00"
    return timeString.slice(0, 5);
  };
  
  const [formData, setFormData] = useState({
    fromTime: extractTime(editingSchedule?.start_time || '09:00'),
    toTime: extractTime(editingSchedule?.end_time || '17:00')
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
    if (!formData.fromTime || !formData.toTime) {
      return 'Please fill in all required fields';
    }

    if (!validateTimeFormat(formData.fromTime) || !validateTimeFormat(formData.toTime)) {
      return 'Please enter valid time format (HH:MM)';
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

      if (!editingSchedule?.day) {
        setError('No day information available for this schedule');
        return;
      }

      const durationInMinutes = calculateDurationInMinutes(formData.fromTime, formData.toTime);

      // Create schedule data for updating by day
      const scheduleData: UpdateScheduleRequest = {
        start_time: formData.fromTime,
        end_time: formData.toTime,
        duration_hr: Math.floor(durationInMinutes / 60),
        duration_min: durationInMinutes % 60,
        status: true
      };

      // Use updateScheduleByDay method
      const response = await scheduleService.updateScheduleByDay(editingSchedule.day, scheduleData);

      if (response.error) {
        setError(response.error);
        return;
      }
      if (response.errors) {
        setError(response.errors.join(', '));
        return;
      }

      setSuccess('Schedule time updated successfully!');

      // Call the parent onSave callback
      onSave({
        day: editingSchedule.day,
        start_time: formData.fromTime,
        end_time: formData.toTime,
        duration_hr: Math.floor(durationInMinutes / 60),
        duration_min: durationInMinutes % 60
      });
      
      // Close after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      setError('An error occurred while updating the schedule');
      console.error('Error updating schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDayName = (day: string) => {
    if (!day) return '';
    
    // Capitalize first letter and make rest lowercase
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-[#333333]">Edit Time Schedule</h2>
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
            <p className="text-sm text-[#666666] mb-4">
              Update the time schedule for <span className="font-medium text-[#333333]">{formatDayName(editingSchedule?.day || '')}</span>
            </p>
          </div>

          {/* Day Display */}
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-2">
              Day
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-[#666666]">
              {formatDayName(editingSchedule?.day || '')}
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
            <div className="text-sm text-[#666666]">
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
            {loading ? 'Updating...' : 'Update Time'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTimeOnly;