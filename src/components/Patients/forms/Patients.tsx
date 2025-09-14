import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../../layouts/Header';
import PatientTable from '../patient/PatientTable';
import PatientDetails from '../patient/PatientDetails';
import NewPatientModal from '../patient/NewPatientModal';
import { usePatientContext } from '../../../context/PatientContext';
import type { Patient } from '../../../types/patient.types';

const Patients: React.FC = () => {
  const { 
    patients, 
    loading, 
    error, 
    pagination, 
    fetchPatients,
    setFilters,
    setPagination,
    clearError 
  } = usePatientContext();

  // Local state with reduced re-renders
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []); // Empty dependency array - run only once

  // Memoized handlers to prevent unnecessary re-renders
  const handlePaginationChange = useCallback((page: number, itemsPerPage: number = 10) => {
    setPagination(page, itemsPerPage);
  }, [setPagination]);

  const handlePatientSelect = useCallback((patient: Patient) => {
    setIsTransitioning(true);
    setSelectedPatient(patient);
    
    // Clear transition state after a brief delay
    setTimeout(() => {
      setIsTransitioning(false);
    }, 100);
  }, []);

  const handlePatientUpdate = useCallback(async (id: string, data: Partial<Patient>) => {
    try {
      console.log('Updating patient:', id, data);
      // The context will handle the actual update
    } catch (error) {
      console.error('Failed to update patient:', error);
    }
  }, []);

  const handleSearch = useCallback((searchTerm: string) => {
    setFilters({ search: searchTerm });
  }, [setFilters]);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setFilters({ sortBy: field, sortDir: order });
  }, [setFilters]);

  const handleBackToList = useCallback(() => {
    setIsTransitioning(true);
    setSelectedPatient(null);
    
    // Clear transition state after a brief delay
    setTimeout(() => {
      setIsTransitioning(false);
    }, 100);
  }, []);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Memoized Error Display Component
  const ErrorDisplay = useMemo(() => {
    if (!error) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <div>
              <p className="text-red-800 text-sm font-medium">Error</p>
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          </div>
          <button
            onClick={clearError}
            className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }, [error, clearError]);

  // Memoized main content to prevent unnecessary re-renders
  const MainContent = useMemo(() => {
    // Show loading state during transitions
    if (isTransitioning) {
      return (
        <div className="flex items-center justify-center h-64 transition-opacity duration-200 ease-in-out">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (selectedPatient) {
      return (
        <div className="transition-opacity duration-200 ease-in-out">
          <PatientDetails
            patient={selectedPatient}
            onBack={handleBackToList}
            onUpdate={handlePatientUpdate}
          />
        </div>
      );
    }

    return (
      <div className="transition-opacity duration-200 ease-in-out">
        <PatientTable
          patients={patients}
          onPatientSelect={handlePatientSelect}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          onSearch={handleSearch}
          onSort={handleSort}
          loading={loading}
        />
      </div>
    );
  }, [
    selectedPatient,
    patients,
    pagination,
    loading,
    isTransitioning,
    handlePatientSelect,
    handlePaginationChange,
    handleSearch,
    handleSort,
    handleBackToList,
    handlePatientUpdate,
  ]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {ErrorDisplay}

        {/* Main content */}
        {MainContent}

        {/* Modal for adding a new patient */}
        <NewPatientModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </main>
    </div>
  );
};

export default Patients;