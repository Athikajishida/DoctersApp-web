// hooks/usePrescriptionValidation.ts
import { useState, useCallback } from 'react';
import { PrescriptionFormData } from '../types/prescription.types';

interface ValidationErrors {
  [key: string]: string;
}

export const usePrescriptionValidation = () => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateSection = useCallback((sectionId: string, value: string) => {
    const newErrors = { ...errors };

    // Clear existing error for this section
    delete newErrors[sectionId];

    // Add validation rules as needed
    if (sectionId === 'treatmentHistory' && value.trim() !== '' && value.length < 10) {
      newErrors[sectionId] = 'Treatment history must be at least 10 characters long';
    }

    if (sectionId === 'finalDiagnosis' && value.trim() !== '' && value.length < 5) {
      newErrors[sectionId] = 'Final diagnosis must be at least 5 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [errors]);

  const validateForm = useCallback((data: PrescriptionFormData) => {
    const newErrors: ValidationErrors = {};

    // Check if at least one section is filled
    const hasContent = Object.values(data).some(value => value.trim() !== '');
    if (!hasContent) {
      newErrors.general = 'At least one section must be filled';
    }

    // Validate individual sections
    Object.entries(data).forEach(([key, value]) => {
      if (value.trim() !== '') {
        validateSection(key, value);
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validateSection]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getError = useCallback((sectionId: string) => {
    return errors[sectionId];
  }, [errors]);

  const hasErrors = useCallback(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  return {
    errors,
    validateSection,
    validateForm,
    clearErrors,
    getError,
    hasErrors
  };
};

// hooks/usePrescriptionAutoSave.ts
import { useEffect, useRef } from 'react';
import { usePrescription } from '../context/PrescriptionContext';

export const usePrescriptionAutoSave = (
  appointmentId: number | undefined,
  enabled: boolean = true,
  delay: number = 5000 // 5 seconds
) => {
  const { prescriptionData, savePrescription, isLoading } = usePrescription();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !appointmentId || isLoading) {
      return;
    }

    const currentData = JSON.stringify(prescriptionData);
    
    // Only auto-save if data has changed
    if (currentData !== lastSaveRef.current) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        try {
          await savePrescription(appointmentId);
          lastSaveRef.current = currentData;
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, delay);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [prescriptionData, appointmentId, enabled, delay, savePrescription, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};