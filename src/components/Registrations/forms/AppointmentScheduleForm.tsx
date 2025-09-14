// components/Registrations/forms/AppointmentScheduleForm.tsx

import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useRegistration } from '../../../context/RegistrationContext';
import FormButtons from '../common/FormButtons';
import { registrationApi } from '../../../services/registrationApi';
import type { TimeSlot } from '../../../types/registration';
import { paymentService } from '../../../services/paymentService';
import { useToast } from '../../../context/ToastContext';
import { currencyService } from '../../../services/currencyService';

const AppointmentScheduleForm: React.FC = () => {
  const { state, updateAppointmentSchedule, prevStep, resetForm, goToStep } = useRegistration();
  const { appointmentSchedule, personalInfo } = state.formData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { showToast } = useToast();

  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [currentRate, setCurrentRate] = useState<number | null>(null);

  const currencies = [
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' },
  ];

  const getBaseAmount = (): number => {
    return personalInfo.consultation_price 
      ? parseFloat(personalInfo.consultation_price) 
      : 1500;
  };

  const handleCurrencyChange = async (currency: string) => {
    setSelectedCurrency(currency);
    setIsConverting(true);
    
    try {
      const baseAmount = getBaseAmount();
      
      if (currency === 'INR') {
        setConvertedAmount(baseAmount);
        setCurrentRate(1);
      } else {
        const rate = await currencyService.getExchangeRate(currency);
        const converted = baseAmount * rate;
        setConvertedAmount(converted);
        setCurrentRate(rate);
      }
    } catch (error) {
      console.error('Currency conversion error:', error);
      setConvertedAmount(getBaseAmount());
      setCurrentRate(null);
      showToast('Failed to convert currency. Using INR instead.', 'error', 3000);
    } finally {
      setIsConverting(false);
    }
  };

  useEffect(() => {
    const initializeCurrency = async () => {
      const baseAmount = getBaseAmount();
      setConvertedAmount(baseAmount);
    };
    initializeCurrency();
  }, [personalInfo.consultation_price]);

  // Fetch slots from API when date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!appointmentSchedule.selectedDate || !personalInfo.patientId) return;
      setLoadingSlots(true);
      try {
        const apiResponse = await registrationApi.getAvailableSchedule(
          personalInfo.patientId,
          appointmentSchedule.selectedDate,
          !!personalInfo.isAlreadyRegistered
        );
        let slots: TimeSlot[] = [];
        if (
          apiResponse &&
          typeof apiResponse === 'object' &&
          'available_slots' in apiResponse &&
          Array.isArray((apiResponse as { available_slots?: unknown }).available_slots)
        ) {
          const scheduleId = (apiResponse as { id?: string | number }).id;
          slots = (apiResponse as { available_slots: { start: string; end: string }[] }).available_slots.map(
            (slot: { start: string; end: string }) => ({
              id: `${slot.start}-${slot.end}`,
              time: `${slot.start}-${slot.end}`,
              available: true,
              scheduleId: scheduleId ? String(scheduleId) : undefined,
            })
          );
        }
        updateAppointmentSchedule({ availableSlots: slots });
      } catch {
        updateAppointmentSchedule({ availableSlots: [] });
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentSchedule.selectedDate, personalInfo.patientId, personalInfo.isAlreadyRegistered]);

  const handleDateChange = (date: string) => {
    updateAppointmentSchedule({ 
      selectedDate: date,
      selectedTimeSlot: '' // Reset time slot when date changes
    });
  };

  const handleTimeSlotChange = (timeSlot: string) => {
    updateAppointmentSchedule({ selectedTimeSlot: timeSlot });
  };

  const handleFinish = async () => {
    setIsSubmitting(true);

    try {
      const { medicalHistory, additionalDetails, appointmentSchedule, personalInfo } = state.formData;

      const finalAmount = convertedAmount || getBaseAmount();
      
      const order = await paymentService.createOrder(finalAmount, selectedCurrency, `appointment_${Date.now()}`);

      const paymentResponse = await paymentService.initializeRazorpay(order, {
        name: 'Mediconnect',
        description: 'Medical Consultation Appointment',
        prefill: {
          name: personalInfo.name,
          email: personalInfo.email,
          contact: personalInfo.phone,
        },
        notes: {
          appointment_date: appointmentSchedule.selectedDate,
          appointment_time: appointmentSchedule.selectedTimeSlot,
        },
      });

      const isPaymentVerified = await paymentService.verifyPayment(paymentResponse);

      if (!isPaymentVerified) {
        throw new Error('Payment verification failed');
      }

      const formData = new FormData();

      formData.append('first_name', personalInfo.name.split(' ')[0] || '');
      formData.append('last_name', personalInfo.name.split(' ').slice(1).join(' ') || '');
      formData.append('email', personalInfo.email);
      formData.append('phone_number', personalInfo.phone);
      if (personalInfo.date_of_birth) formData.append('date_of_birth', personalInfo.date_of_birth);
      if (personalInfo.gender) formData.append('gender', personalInfo.gender);
      if (personalInfo.address) formData.append('address', personalInfo.address);
      if (personalInfo.patientId) formData.append('patient_id', personalInfo.patientId);

      formData.append('treatment_history', medicalHistory.clinicalSummary);
      formData.append('additional_details', additionalDetails.additionalNotes);
      formData.append('slot_date', appointmentSchedule.selectedDate);
      formData.append('slot_time', appointmentSchedule.selectedTimeSlot);
      const selectedSlot = appointmentSchedule.availableSlots.find(slot => slot.time === appointmentSchedule.selectedTimeSlot);
      if (selectedSlot && selectedSlot.scheduleId) {
        formData.append('schedule_id', selectedSlot.scheduleId);
      }

      formData.append('payment_id', paymentResponse.razorpay_payment_id);
      formData.append('order_id', paymentResponse.razorpay_order_id);
      formData.append('amount', finalAmount.toString());
      formData.append('currency', selectedCurrency);

      (medicalHistory.pathologyFiles || []).forEach(file => formData.append('pathology_uploads[]', file));
      (medicalHistory.imageologyFiles || []).forEach(file => formData.append('imageology_uploads[]', file));
      (additionalDetails.additionalAttachments || []).forEach(file => formData.append('additional_uploads[]', file));

      await registrationApi.bookAppointment(formData);

      showToast('Payment successful! Appointment booked successfully.', 'success', 5000);
      
      // Refetch slots after successful booking to get fresh data
      if (appointmentSchedule.selectedDate && personalInfo.patientId) {
        try {
          const apiResponse = await registrationApi.getAvailableSchedule(
            personalInfo.patientId,
            appointmentSchedule.selectedDate,
            !!personalInfo.isAlreadyRegistered
          );
          let slots: TimeSlot[] = [];
          if (
            apiResponse &&
            typeof apiResponse === 'object' &&
            'available_slots' in apiResponse &&
            Array.isArray((apiResponse as { available_slots?: unknown }).available_slots)
          ) {
            const scheduleId = (apiResponse as { id?: string | number }).id;
            slots = (apiResponse as { available_slots: { start: string; end: string }[] }).available_slots.map(
              (slot: { start: string; end: string }) => ({
                id: `${slot.start}-${slot.end}`,
                time: `${slot.start}-${slot.end}`,
                available: true,
                scheduleId: scheduleId ? String(scheduleId) : undefined,
              })
            );
          }
          updateAppointmentSchedule({ availableSlots: slots });
        } catch (error) {
          console.error('Failed to refetch slots after booking:', error);
        }
      }
      
      setIsRedirecting(true);
      setTimeout(() => {
        resetForm();
        goToStep(1);
        setIsRedirecting(false);
      }, 2000);
    } catch (error: unknown) {
      let message = 'Payment failed. Please try again.';
      
      if (error && typeof error === 'object' && 'message' in error) {
        const err = error as { message?: string };
        if (typeof err.message === 'string') {
          if (err.message.includes('cancelled')) {
            message = 'Payment was cancelled. Please try again.';
          } else {
            message = err.message;
          }
        }
      }
      
      showToast(message, 'error', 5000);
      
      // Refetch slots after payment failure to get fresh data
      if (appointmentSchedule.selectedDate && personalInfo.patientId) {
        try {
          const apiResponse = await registrationApi.getAvailableSchedule(
            personalInfo.patientId,
            appointmentSchedule.selectedDate,
            !!personalInfo.isAlreadyRegistered
          );
          let slots: TimeSlot[] = [];
          if (
            apiResponse &&
            typeof apiResponse === 'object' &&
            'available_slots' in apiResponse &&
            Array.isArray((apiResponse as { available_slots?: unknown }).available_slots)
          ) {
            const scheduleId = (apiResponse as { id?: string | number }).id;
            slots = (apiResponse as { available_slots: { start: string; end: string }[] }).available_slots.map(
              (slot: { start: string; end: string }) => ({
                id: `${slot.start}-${slot.end}`,
                time: `${slot.start}-${slot.end}`,
                available: true,
                scheduleId: scheduleId ? String(scheduleId) : undefined,
              })
            );
          }
          updateAppointmentSchedule({ availableSlots: slots });
        } catch (error) {
          console.error('Failed to refetch slots after payment failure:', error);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    prevStep();
  };

  const isFormValid = appointmentSchedule.selectedDate && appointmentSchedule.selectedTimeSlot;

  // Format currency display
  const formatCurrency = (amount: number, currency: string): string => {
    const currencySymbols: { [key: string]: string } = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'AUD': 'A$',
    };

    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Book Appointment</h2>
      
      <div className="space-y-6">
        {/* Date Selection */}
        <div>
          <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              id="appointmentDate"
              value={appointmentSchedule.selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Time Slot Selection */}
        {appointmentSchedule.selectedDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Clock className="inline w-4 h-4 mr-1" />
              Select Available Slots
            </label>
            {loadingSlots ? (
              <div>Loading available slots...</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {appointmentSchedule.availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => handleTimeSlotChange(slot.time)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      appointmentSchedule.selectedTimeSlot === slot.time
                        ? 'bg-blue-600 text-white border-blue-600'
                        : slot.available
                        ? 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{slot.time}</span>
                      {appointmentSchedule.selectedTimeSlot === slot.time && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Appointment Summary */}
        {appointmentSchedule.selectedDate && appointmentSchedule.selectedTimeSlot && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Selected Appointment</h3>
            <div className="text-sm text-blue-800">
              <p><strong>Date:</strong> {new Date(appointmentSchedule.selectedDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {appointmentSchedule.selectedTimeSlot}</p>
              <p><strong>Consultation Fee:</strong> {formatCurrency(convertedAmount || getBaseAmount(), selectedCurrency)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Currency Selection and Form Buttons */}
      <div className="mt-6 space-y-4">
        {personalInfo?.is_inr === false && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <label htmlFor="currency" className="text-sm font-medium text-gray-700">
                Payment Currency:
              </label>
              <div className="relative">
                <select
                  id="currency"
                  value={selectedCurrency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  disabled={isConverting}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {isConverting && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  Fetching real-time rates...
                </div>
              )}
            </div>
          </div>
        )}

        <FormButtons
          onCancel={() => window.history.back()}
          onNext={handleFinish}
          onPrevious={handlePrevious}
          nextLabel="Finish"
          previousLabel="Previous"
          showPrevious={true}
          isLoading={isSubmitting || isRedirecting}
          loadingText={isRedirecting ? "Redirecting..." : "Processing Payment..."}
          disabled={!isFormValid || isRedirecting || isConverting}
        />
      </div>
    </div>
  );
};

export default AppointmentScheduleForm;