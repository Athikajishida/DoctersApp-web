// hooks/Registrations/useRegistrationForm.tsx

import { useState, useCallback } from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { registrationApi } from '../../services/registrationApi';
import { ValidationErrors } from '../../types/registration';

export const useRegistrationForm = () => {
  const { state, setErrors, clearErrors } = useRegistration();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validatePersonalInfo = useCallback(() => {
    const errors: ValidationErrors = {};
    const { personalInfo } = state.formData;

    if (!personalInfo.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!personalInfo.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(personalInfo.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!personalInfo.age.trim()) {
      errors.age = 'Age is required';
    } else if (parseInt(personalInfo.age) < 0 || parseInt(personalInfo.age) > 120) {
      errors.age = 'Please enter a valid age';
    }

    if (!personalInfo.gender.trim()) {
      errors.gender = 'Gender is required';
    }

    if (!personalInfo.address.trim()) {
      errors.address = 'Address is required';
    }

    return errors;
  }, [state.formData.personalInfo]);

  const validateMedicalHistory = useCallback(() => {
    const errors: ValidationErrors = {};
    const { medicalHistory } = state.formData;

    if (!medicalHistory.clinicalSummary.trim()) {
      errors.clinicalSummary = 'Clinical summary is required';
    }

    // Optional: Validate file uploads
    // if (medicalHistory.pathologyFiles.length === 0) {
    //   errors.pathologyFiles = 'At least one pathology file is required';
    // }

    return errors;
  }, [state.formData.medicalHistory]);

  const validateAppointmentSchedule = useCallback(() => {
    const errors: ValidationErrors = {};
    const { appointmentSchedule } = state.formData;

    if (!appointmentSchedule.selectedDate) {
      errors.selectedDate = 'Please select an appointment date';
    }

    if (!appointmentSchedule.selectedTimeSlot) {
      errors.selectedTimeSlot = 'Please select a time slot';
    }

    return errors;
  }, [state.formData.appointmentSchedule]);

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    let errors: ValidationErrors = {};

    switch (state.currentStep) {
      case 1:
        errors = validatePersonalInfo();
        break;
      case 2:
        errors = validateMedicalHistory();
        break;
      case 3:
        // Additional details are optional
        break;
      case 4:
        errors = validateAppointmentSchedule();
        break;
      default:
        break;
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return false;
    } else {
      clearErrors();
      return true;
    }
  }, [state.currentStep, validatePersonalInfo, validateMedicalHistory, validateAppointmentSchedule, setErrors, clearErrors]);

  // Submit registration
  const submitRegistration = useCallback(async () => {
    setIsSubmitting(true);
    
    try {
      // Validate all steps
      const personalInfoErrors = validatePersonalInfo();
      const medicalHistoryErrors = validateMedicalHistory();
      const appointmentErrors = validateAppointmentSchedule();

      const allErrors = {
        ...personalInfoErrors,
        ...medicalHistoryErrors,
        ...appointmentErrors
      };

      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        setIsSubmitting(false);
        return { success: false, errors: allErrors };
      }

      // Submit to API
      const result = await registrationApi.submitRegistration(state.formData);
      
      return { success: true, data: result };
      
    } catch (error) {
      console.error('Registration submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setErrors({ submit: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [state.formData, validatePersonalInfo, validateMedicalHistory, validateAppointmentSchedule, setErrors]);

  return {
    validateCurrentStep,
    submitRegistration,
    isSubmitting,
    errors: state.errors
  };
};

// File upload hook
export const useFileUpload = () => {
  const { state, dispatch } = useRegistration();

  const uploadFiles = useCallback(async (files: File[], category: string) => {
    dispatch({ 
      type: 'UPDATE_FILE_UPLOAD_STATE', 
      payload: { isUploading: true, progress: 0, error: null } 
    });

    try {
      const result = await registrationApi.uploadFiles(files, category);
      
      dispatch({ 
        type: 'UPDATE_FILE_UPLOAD_STATE', 
        payload: { 
          isUploading: false, 
          progress: 100, 
          uploadedFiles: (result as any).files 
        } 
      });

      return { success: true, files: (result as any).files };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      dispatch({ 
        type: 'UPDATE_FILE_UPLOAD_STATE', 
        payload: { 
          isUploading: false, 
          progress: 0, 
          error: errorMessage 
        } 
      });

      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  return {
    uploadFiles,
    fileUploadState: state.fileUploadState
  };
};

// Appointment slots hook
export const useAppointmentSlots = () => {
  const [loading, setLoading] = useState(false);
  const { updateAppointmentSchedule } = useRegistration();

  const loadAvailableSlots = useCallback(async (date: string) => {
    setLoading(true);
    
    try {
      const slots = await registrationApi.getAvailableSlots(date);
      updateAppointmentSchedule({ availableSlots: slots });
      return { success: true, slots };
      
    } catch (error) {
      console.error('Failed to load appointment slots:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load slots' };
    } finally {
      setLoading(false);
    }
  }, [updateAppointmentSchedule]);

  const checkDateAvailability = useCallback(async (date: string) => {
    try {
      const isAvailable = await registrationApi.checkDateAvailability(date);
      return { success: true, available: isAvailable };
      
    } catch (error) {
      console.error('Failed to check date availability:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to check availability' };
    }
  }, []);

  return {
    loadAvailableSlots,
    checkDateAvailability,
    loading
  };
};