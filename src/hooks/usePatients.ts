import { useEffect } from 'react';
import { usePatientContext } from '../context/PatientContext';

export const usePatients = () => {
  const context = usePatientContext();

  useEffect(() => {
    context.fetchPatients();
  }, [context.filters, context.pagination.currentPage, context.pagination.itemsPerPage]);

  return {
    ...context,
    refetch: context.fetchPatients,
  };
};

export const usePatientDetails = (patientId: string | null) => {
  const { fetchPatientDetails, currentPatient, loading, error, clearError } = usePatientContext();

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails(patientId);
    } else {
      // Clear current patient when patientId is null
      clearError();
    }
  }, [patientId, fetchPatientDetails, clearError]);

  return {
    patient: currentPatient,
    loading,
    error,
    refetch: () => patientId && fetchPatientDetails(patientId),
  };
};