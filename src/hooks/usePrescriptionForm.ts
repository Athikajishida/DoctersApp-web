// hooks/usePrescriptionForm.ts
import { useState, useCallback, useEffect } from 'react';
import { usePrescription } from '../context/PrescriptionContext';
import { PrescriptionFormData, PRESCRIPTION_SECTIONS } from '../types/prescription.types';

export const usePrescriptionForm = (appointmentId?: number) => {
  const {
    prescriptionData,
    prescriptionNotes,
    isLoading,
    error,
    updatePrescriptionData,
    savePrescription,
    loadPrescription,
    clearPrescription
  } = usePrescription();

  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load prescription data when appointment ID changes
  useEffect(() => {
    if (appointmentId && appointmentId > 0) {
      loadPrescription(appointmentId).catch(console.error);
    }
  }, [appointmentId, loadPrescription]);

  // Mark form as dirty when data changes
  useEffect(() => {
    setIsDirty(true);
  }, [prescriptionData]);

  const handleSectionChange = useCallback((sectionId: string, value: string) => {
    updatePrescriptionData({ [sectionId]: value });
  }, [updatePrescriptionData]);

  const handleSave = useCallback(async () => {
    if (!appointmentId) {
      throw new Error('No appointment ID provided');
    }

    try {
      await savePrescription(appointmentId);
      setIsDirty(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving prescription:', error);
      throw error;
    }
  }, [appointmentId, savePrescription]);

  const handleClear = useCallback(() => {
    clearPrescription();
    setIsDirty(false);
    setLastSaved(null);
  }, [clearPrescription]);

  const getSectionValue = useCallback((sectionId: string) => {
    return prescriptionData[sectionId as keyof PrescriptionFormData] || '';
  }, [prescriptionData]);

  const getFilledSections = useCallback(() => {
    return PRESCRIPTION_SECTIONS.filter(section => 
      getSectionValue(section.id).trim() !== ''
    );
  }, [getSectionValue]);

  const getEmptySections = useCallback(() => {
    return PRESCRIPTION_SECTIONS.filter(section => 
      getSectionValue(section.id).trim() === ''
    );
  }, [getSectionValue]);

  const isFormValid = useCallback(() => {
    return getFilledSections().length > 0;
  }, [getFilledSections]);

  return {
    prescriptionData,
    prescriptionNotes,
    isLoading,
    error,
    isDirty,
    lastSaved,
    handleSectionChange,
    handleSave,
    handleClear,
    getSectionValue,
    getFilledSections,
    getEmptySections,
    isFormValid
  };
};

