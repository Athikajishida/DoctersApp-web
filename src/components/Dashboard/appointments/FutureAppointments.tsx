import React, { useState } from 'react';
import AppointmentTable from './AppointmentTable';
import AppointmentView from './AppointmentView';
import SearchBar from '../common/SearchBar';
import AppointmentPagination from '../common/AppointmentPagination';
import { useTabAppointments } from '../../../hooks/useTabAppointments';
import { useAppointmentDetails } from '../../../hooks/useAppointmentDetails';
import { DEFAULT_ITEMS_PER_PAGE } from '../../../constants/pagination';

type SortField = 'patientName' | 'gender' | 'diseases' | 'status' | 'date';
type SortOrder = 'asc' | 'desc';

interface FutureAppointmentsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const FutureAppointments: React.FC<FutureAppointmentsProps> = ({ 
  searchTerm, 
  onSearchChange 
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc'); // Future appointments should default to earliest first
  
  const { 
    appointments, 
    loading, 
    error, 
    refresh, 
    totalCount,
    currentPage,
    totalPages,
    itemsPerPage,
    setPage 
  } = useTabAppointments('future', searchTerm, sortField, sortOrder);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const { data: detailedAppointment, isLoading: detailLoading, error: detailError, refetch } = useAppointmentDetails(selectedAppointmentId);

  const handleViewAppointment = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
  };

  const handleBackToList = () => {
    setSelectedAppointmentId(null);
  };

  const handleSort = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-red-600">
          <p>Error loading appointments: {error}</p>
          <button 
            onClick={refresh}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show appointment view if an appointment is selected
  if (selectedAppointmentId) {
    if (detailLoading) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-[#999999] text-sm ml-3">Loading appointment details...</p>
          </div>
        </div>
      );
    }

    if (detailError) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center text-red-600">
            <p>Error loading appointment details: {detailError?.toString()}</p>
            <button 
              onClick={handleBackToList}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <AppointmentView 
          appointment={detailedAppointment} 
          onBack={handleBackToList}
          refetchAppointment={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Future Appointments ({totalCount})
        </h2>
      </div>
      
      <AppointmentTable 
        appointments={appointments} 
        onViewAppointment={handleViewAppointment}
        onRescheduleSuccess={refresh}
        pagination={{
          currentPage,
          totalPages,
          totalCount,
          itemsPerPage
        }}
        onPaginationChange={setPage}
        onSort={handleSort}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />
    </div>
  );
};

export default FutureAppointments;