import React, { useState, useEffect } from 'react';
import { Clock, X, Plus } from 'lucide-react';
import { scheduleService } from '../../../services/scheduleService';
import type { CreateScheduleRequest, UpdateScheduleRequest, Schedule } from '../../../types/schedule';
import Header from '../../layouts/Header';

// Types
interface TimeSlot {
  start: string;
  end: string;
}

interface ConsultationScheduleFormProps {
  onCancel?: () => void;
  onSave?: (schedule: any) => void;
  schedule?: Schedule; // Changed from editingSchedule to schedule
}

const ConsultationScheduleForm: React.FC<ConsultationScheduleFormProps> = ({
  onCancel = () => {},
  onSave = () => {},
  schedule // This is the schedule to edit, undefined for new schedule
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Helper function to parse days string to array
  const parseDaysToArray = (daysString?: string): string[] => {
    if (!daysString) return [];
    
    // Handle comma-separated days
    const dayMap: { [key: string]: string } = {
      'MON': 'Monday',
      'TUE': 'Tuesday', 
      'WED': 'Wednesday',
      'THU': 'Thursday',
      'FRI': 'Friday',
      'SAT': 'Saturday',
      'SUN': 'Sunday'
    };
    
    return daysString.split(',').map(day => {
      const trimmedDay = day.trim();
      return dayMap[trimmedDay] || trimmedDay;
    }).filter(Boolean);
  };

  // Helper function to format duration from hours and minutes
  const formatDurationToMinutes = (durationHr?: string, durationMin?: string): string => {
    const hours = parseInt(durationHr || '0') || 0;
    const minutes = parseInt(durationMin || '0') || 0;
    return (hours * 60 + minutes).toString();
  };

  // Consultation Schedule Form Data
  const [consultationFormData, setConsultationFormData] = useState({
    days: [] as string[],
    timePerSession: '15',
    fromTime: '09:00',
    toTime: '17:00',
    timeSlots: [] as string[]
  });

  // Initialize form data when schedule prop changes
  useEffect(() => {
    if (schedule) {
      // Set up for consultation form
      setConsultationFormData({
        days: parseDaysToArray(schedule.day || schedule.days),
        timePerSession: formatDurationToMinutes(schedule.duration_hr, schedule.duration_min),
        fromTime: schedule.start_time || '09:00',
        toTime: schedule.end_time || '17:00',
        timeSlots: []
      });
    } else {
      // Reset form for new schedule
      setConsultationFormData({
        days: [],
        timePerSession: '15',
        fromTime: '09:00',
        toTime: '17:00',
        timeSlots: []
      });
    }
  }, [schedule]);

  const weekDays = [
    { short: 'Sun', full: 'Sunday' },
    { short: 'Mon', full: 'Monday' },
    { short: 'Tue', full: 'Tuesday' },
    { short: 'Wed', full: 'Wednesday' },
    { short: 'Thu', full: 'Thursday' },
    { short: 'Fri', full: 'Friday' },
    { short: 'Sat', full: 'Saturday' }
  ];

  const handleDayToggle = (dayFull: string) => {
    setConsultationFormData(prev => ({
      ...prev,
      days: prev.days.includes(dayFull)
        ? prev.days.filter(d => d !== dayFull)
        : [...prev.days, dayFull]
    }));
  };

  const handleConsultationTimeSlotChange = (index: number, value: string) => {
    setConsultationFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => i === index ? value : slot)
    }));
  };

  const handleConsultationAddTimeSlot = () => {
    setConsultationFormData(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, '']
    }));
  };

  const handleConsultationRemoveTimeSlot = (index: number) => {
    setConsultationFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

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

  const validateForm = (formData: any) => {
    if (!formData.fromTime || !formData.toTime || !formData.timePerSession) {
      return 'Please fill in all required fields';
    }

    if (!validateTimeFormat(formData.fromTime) || !validateTimeFormat(formData.toTime)) {
      return 'Please enter valid time format (HH:MM)';
    }

    if (formData.days.length === 0) {
      return 'Please select at least one day';
    }

    const timePerSessionNum = parseInt(formData.timePerSession);
    if (isNaN(timePerSessionNum) || timePerSessionNum <= 0) {
      return 'Please enter a valid time per session';
    }

    // Check if from time is before to time
    const fromTimeDate = new Date(`1970-01-01T${formData.fromTime}:00`);
    const toTimeDate = new Date(`1970-01-01T${formData.toTime}:00`);
    
    if (fromTimeDate >= toTimeDate) {
      return 'End time must be after start time';
    }

    const durationInMinutes = calculateDurationInMinutes(formData.fromTime, formData.toTime);
    if (durationInMinutes < timePerSessionNum) {
      return 'Session duration cannot be longer than the total time duration';
    }

    return null;
  };

  // Helper function to convert days array to backend format
  const convertDaysToBackendFormat = (days: string[]): string => {
    const dayMap: { [key: string]: string } = {
      'Monday': 'MON',
      'Tuesday': 'TUE',
      'Wednesday': 'WED',
      'Thursday': 'THU',
      'Friday': 'FRI',
      'Saturday': 'SAT',
      'Sunday': 'SUN'
    };
    
    return days.map(day => dayMap[day] || day).join(',');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const validationError = validateForm(consultationFormData);
      if (validationError) {
        setError(validationError);
        return;
      }

      const timePerSessionNum = parseInt(consultationFormData.timePerSession);
      const durationInMinutes = calculateDurationInMinutes(
        consultationFormData.fromTime,
        consultationFormData.toTime
      );

      // Create schedule data matching your backend API structure
      const scheduleData: CreateScheduleRequest | UpdateScheduleRequest = {
        day: convertDaysToBackendFormat(consultationFormData.days),
        start_time: consultationFormData.fromTime,
        end_time: consultationFormData.toTime,
        duration_hr: Math.floor(durationInMinutes / 60),
        duration_min: durationInMinutes % 60,
        status: true
      };

      let response;
      if (schedule?.id) {
        // Editing existing schedule
        response = await scheduleService.updateSchedule(schedule.id, scheduleData);
      } else {
        // Creating new schedule
        response = await scheduleService.createSchedule(scheduleData);
      }

      if (response.error) {
        setError(response.error);
        return;
      }

      setSuccess(`Schedule ${schedule?.id ? 'updated' : 'created'} successfully!`);

      // Call the parent onSave callback
      onSave(response.data);
      
      // Close after a short delay to show success message
      setTimeout(() => {
        onCancel();
      }, 1500);

    } catch (err) {
      setError('An error occurred while saving the schedule');
      console.error('Error saving schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header/>
      
      <div className="p-6">
        <div className="w-full max-w-5xl ml-20 pr-6">
          {/* Form Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {schedule ? 'Edit Schedule' : 'Create New Schedule'}
            </h1>
            <p className="text-gray-600 mt-1">
              {schedule ? 'Update the existing schedule details' : 'Set up a new consultation schedule'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Consultation Schedule Form Content */}
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select week Days</h3>
                <div className="flex flex-wrap gap-3">
                  {weekDays.map(day => (
                    <label key={day.full} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={consultationFormData.days.includes(day.full)}
                        onChange={() => handleDayToggle(day.full)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mr-2"
                      />
                      <span className="text-gray-700 font-medium">{day.short}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3">Select the days on which booking will be available</p>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-900 mb-4">
                  Time for each Session (minutes)
                </label>
                <input
                  type="number"
                  value={consultationFormData.timePerSession}
                  onChange={(e) => setConsultationFormData(prev => ({ ...prev, timePerSession: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="Enter session duration in minutes"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-900 mb-4">
                  Select the Duration
                </label>
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <input
                      type="time"
                      value={consultationFormData.fromTime}
                      onChange={(e) => setConsultationFormData(prev => ({ ...prev, fromTime: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="From"
                    />
                    <Clock className="absolute right-4 top-4 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="time"
                      value={consultationFormData.toTime}
                      onChange={(e) => setConsultationFormData(prev => ({ ...prev, toTime: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="To"
                    />
                    <Clock className="absolute right-4 top-4 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Total Slots Display */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  Duration: {Math.floor(calculateDurationInMinutes(consultationFormData.fromTime, consultationFormData.toTime) / 60)}h {calculateDurationInMinutes(consultationFormData.fromTime, consultationFormData.toTime) % 60}m
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Total Possible Slots: {consultationFormData.timePerSession ? Math.floor(calculateDurationInMinutes(consultationFormData.fromTime, consultationFormData.toTime) / parseInt(consultationFormData.timePerSession || '0')) : 0}
                </div>
              </div>

              {/* Optional: Time Slots Section */}
              <div>
                <label className="block text-lg font-medium text-gray-900 mb-4">
                  Custom Time Slots (Optional)
                </label>
                <div className="bg-gray-50 rounded-lg p-6">
                  {consultationFormData.timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center space-x-3 mb-4 last:mb-0">
                      <input
                        type="text"
                        value={slot}
                        onChange={(e) => handleConsultationTimeSlotChange(index, e.target.value)}
                        className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        placeholder="10:00 - 10:15"
                      />
                      <button
                        onClick={() => handleConsultationRemoveTimeSlot(index)}
                        className="text-gray-400 hover:text-red-500 p-2"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleConsultationAddTimeSlot}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Time Slot</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={onCancel}
                className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-lg"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationScheduleForm;