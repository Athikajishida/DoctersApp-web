import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, Calendar, Video, FileText } from 'lucide-react';
import RescheduleModal from './RescheduleModal';
import { MAX_VISIBLE_PAGES, ITEMS_PER_PAGE_OPTIONS } from '../../../constants/pagination';
import type { Appointment } from '../../../types/dashboard.types';

interface AppointmentTableProps {
  appointments: Appointment[];
  onViewAppointment?: (appointmentId: number) => void;
  onRescheduleSuccess?: () => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
  };
  onPaginationChange: (page: number, itemsPerPage?: number) => void;
  onSearch?: (searchTerm: string) => void;
  onSort?: (field: SortField, order: SortOrder) => void;
  loading?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

type SortField = 'patientName' | 'gender' | 'diseases' | 'status' | 'date';
type SortOrder = 'asc' | 'desc';

const AppointmentTable: React.FC<AppointmentTableProps> = ({
  appointments = [],
  onViewAppointment,
  onRescheduleSuccess,
  pagination,
  onPaginationChange,
  onSearch,
  onSort,
  loading = false,
  searchTerm = '',
  onSearchChange
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{
    appointmentId: number;
    patientId: string;
    slotId: number;
    isAlreadyRegistered: boolean;
  } | null>(null);



  // Handle sorting
  const handleSort = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    onSort?.(field, newOrder);
  };

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    onSearchChange?.(value);
  };

  // Calculate pagination info
  const displayTotalItems = pagination.totalCount;
  const startIndex = displayTotalItems > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0;
  const endIndex = Math.min(pagination.currentPage * pagination.itemsPerPage, displayTotalItems);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages && !loading) {
      onPaginationChange(page);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    onPaginationChange(1, newLimit);
  };

  // Handle reschedule
  const handleReschedule = (appointmentId: number, patientId: string, slotId: number, isAlreadyRegistered: boolean) => {
    setRescheduleData({ appointmentId, patientId, slotId, isAlreadyRegistered });
    setShowRescheduleModal(true);
  };

  // Handle reschedule success
  const handleRescheduleSuccess = () => {
    setShowRescheduleModal(false);
    setRescheduleData(null);
    onRescheduleSuccess?.();
  };

  // Handle reschedule close
  const handleRescheduleClose = () => {
    setShowRescheduleModal(false);
    setRescheduleData(null);
  };

  // Render pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = MAX_VISIBLE_PAGES;
    const totalPages = pagination.totalPages;
    
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          disabled={loading}
          className={`px-3 py-2 text-sm rounded-md transition-colors ${
            i === pagination.currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return buttons;
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <div className="flex flex-col ml-1">
          <ChevronUp className="w-3 h-3 text-gray-400" />
          <ChevronDown className="w-3 h-3 text-gray-400 -mt-1" />
        </div>
      );
    }
    
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 ml-1 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 text-blue-600" />
    );
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Search Bar and Items Per Page */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={localSearchTerm}
              onChange={handleSearchChange}
              placeholder="Search appointments..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Show:
            </label>
            <select
              id="itemsPerPage"
              value={pagination.itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            >
              {ITEMS_PER_PAGE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <span className="text-sm text-gray-700 whitespace-nowrap">per page</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 text-sm ml-3">Loading appointments...</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('patientName')}
                >
                  <div className="flex items-center">
                    Patient Name
                    {renderSortIcon('patientName')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile Number
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('gender')}
                >
                  <div className="flex items-center">
                    Gender
                    {renderSortIcon('gender')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('diseases')}
                >
                  <div className="flex items-center">
                    Diseases
                    {renderSortIcon('diseases')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date & Time
                    {renderSortIcon('date')}
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <tr 
                  key={appointment.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onViewAppointment?.(appointment.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium hover:text-blue-800 cursor-pointer">
                    {appointment.patientName || 'Unknown Patient'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {appointment.mobileNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {appointment.gender}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {appointment.age || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="max-w-xs truncate" title={appointment.diseases}>
                      {appointment.diseases || 'General Consultation'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {appointment.status || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex flex-col">
                      <span className="font-medium">{appointment.date || 'No date'}</span>
                      <span className="text-gray-500 text-xs">{appointment.time || 'No time'}</span>
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                    onClick={(e) => e.stopPropagation()} 
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => {
                          if (appointment.patientId && appointment.bookedSlots?.[0]?.id) {
                            handleReschedule(appointment.id, appointment.patientId.toString(), appointment.bookedSlots[0].id, appointment.isAlreadyRegistered);
                          }
                        }}
                        disabled={!appointment.patientId || !appointment.bookedSlots?.[0]?.id}
                        className="group relative p-2 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Calendar className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-black bg-opacity-80 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                          Reschedule Appointment
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black border-opacity-80"></div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          if (appointment.meetLink) {
                            window.open(appointment.meetLink, '_blank', 'noopener,noreferrer');
                          } else {
                            console.log('No meeting link available for appointment:', appointment.id);
                          }
                        }}
                        disabled={!appointment.meetLink}
                        className={`group relative p-2 rounded-full transition-colors ${
                          appointment.meetLink 
                            ? 'hover:bg-green-200 cursor-pointer' 
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                        title={appointment.meetLink ? 'Start Meeting' : 'No meeting link available'}
                      >
                        <Video className={`w-4 h-4 ${
                          appointment.meetLink 
                            ? 'text-green-600 group-hover:text-green-700' 
                            : 'text-gray-400'
                        }`} />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-black bg-opacity-80 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                          {appointment.meetLink ? 'Start Meeting' : 'No meeting link'}
                          {/* Tooltip Arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black border-opacity-80"></div>
                        </div>
                      </button>

                      {/* Edit Prescription Icon */}
                      <button
                        onClick={() => {
                          // Handle edit prescription action
                          console.log('Edit prescription for appointment:', appointment.id);
                        }}
                        className="group relative p-2 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-black bg-opacity-80 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                          Edit Prescription
                          {/* Tooltip Arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black border-opacity-80"></div>
                        </div>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && displayTotalItems === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {localSearchTerm ? 'No appointments match your search criteria.' : 'No appointments scheduled for this period.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            {displayTotalItems > 0 ? (
              <>Showing {startIndex} to {endIndex} of {displayTotalItems} results</>
            ) : (
              <>No results found</>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1 || loading}
              className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex gap-1">
              {renderPaginationButtons()}
            </div>
            
            <button
              onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage === pagination.totalPages || loading}
              className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && rescheduleData && (
        <RescheduleModal
          appointmentId={rescheduleData.appointmentId}
          patientId={rescheduleData.patientId.toString()}
          slotId={rescheduleData.slotId}
          isAlreadyRegistered={rescheduleData.isAlreadyRegistered}
          onClose={handleRescheduleClose}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </div>
  );
};

export default AppointmentTable;