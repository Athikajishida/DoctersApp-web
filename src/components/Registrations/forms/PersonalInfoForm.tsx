// components/Registrations/forms/PersonalInfoForm.tsx

import React, { useState } from 'react';
import { useRegistration } from '../../../context/RegistrationContext';
import FormButtons from '../common/FormButtons';
import { patientService } from '../../../services/patientService';
import { useToast } from '../../../context/ToastContext';
import { EMAIL_REGEX } from '../../../constants/common';

const PersonalInfoForm: React.FC = () => {
  const { state, updatePersonalInfo, nextStep, setErrors, clearErrors } = useRegistration();
  const { personalInfo } = state.formData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    updatePersonalInfo({ [field]: value });
  };

  const handleNext = async () => {
    // Clear previous errors
    clearErrors();
    
    // Basic validation
    const errors: Record<string, string> = {};
    if (!personalInfo.name) errors.name = 'Name is required';
    if (!personalInfo.email) errors.email = 'Email is required';
    if (!personalInfo.phone) errors.phone = 'Phone is required';
    if (!personalInfo.date_of_birth) errors.date_of_birth = 'Date of birth is required';
    if (!personalInfo.gender) errors.gender = 'Gender is required';
    if (!personalInfo.address) errors.address = 'Address is required';
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    // Email validation
    if (!EMAIL_REGEX.test(personalInfo.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Split name into first and last name
      const nameParts = personalInfo.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Register patient
      const result = await patientService.registerPatient({
        first_name: firstName,
        last_name: lastName,
        email: personalInfo.email,
        phone_number: personalInfo.phone,
        date_of_birth: personalInfo.date_of_birth,
        gender: personalInfo.gender,
        address: personalInfo.address
      });

      // Store patient info in context for later use
      updatePersonalInfo({ 
        patientId: result.patient.id.toString(),
        isAlreadyRegistered: result.isAlreadyRegistered,
        consultation_price: result.consultation_price,
        slot_duration_minutes: result.slot_duration_minutes,
        is_inr: result.patient.is_inr
      });

      // Show success message if patient was already registered
      if (result.isAlreadyRegistered) {
        showToast('Patient already exists. Proceeding with existing patient data.', 'info', 4000);
      }

      // Proceed to next step
      nextStep();
    } catch (error: unknown) {      
      let errorMsg = 'Failed to register patient. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { data?: { errors?: string[]; error?: string } } };
        if (err.response?.data) {
          if (Array.isArray(err.response.data.errors)) {
            errorMsg = err.response.data.errors.join(' ');
          } else if (typeof err.response.data.error === 'string') {
            errorMsg = err.response.data.error;
          }
        }
      }
      
      setErrors({ general: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Book Appointment</h2>
      
      {/* Error display */}
      {state.errors.general && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {state.errors.general}
        </div>
      )}
      
      <div className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={personalInfo.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              state.errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
          {state.errors.name && (
            <p className="mt-1 text-sm text-red-600">{state.errors.name}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="phone"
            value={personalInfo.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              state.errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your phone number"
          />
          {state.errors.phone && (
            <p className="mt-1 text-sm text-red-600">{state.errors.phone}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={personalInfo.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              state.errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email address"
            required
          />
          {state.errors.email && (
            <p className="mt-1 text-sm text-red-600">{state.errors.email}</p>
          )}
        </div>

        {/* Date of Birth and Gender Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="date"
                id="date_of_birth"
                value={personalInfo.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  state.errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Select your date of birth"
                max={new Date().toISOString().split('T')[0]}
              />
              {state.errors.date_of_birth && (
                <p className="mt-1 text-sm text-red-600">{state.errors.date_of_birth}</p>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              value={personalInfo.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                state.errors.gender ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
            {state.errors.gender && (
              <p className="mt-1 text-sm text-red-600">{state.errors.gender}</p>
            )}
          </div>
        </div>

        {/* Address Field */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            value={personalInfo.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              state.errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full address"
          />
          {state.errors.address && (
            <p className="mt-1 text-sm text-red-600">{state.errors.address}</p>
          )}
        </div>
      </div>

      <FormButtons
        onCancel={() => window.history.back()}
        onNext={handleNext}
        nextLabel="Next"
        showPrevious={false}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default PersonalInfoForm;