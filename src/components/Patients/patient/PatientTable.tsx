// src/components/Patients/patient/PatientTable.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Patient } from '../../../types/patient.types';
import PatientStatusBadge from '../common/PatientStatusBadge';
import { formatPhoneNumber } from '../../../utils/patientUtils';
import { useSearchDebounce } from '../../../hooks/useDebounce';
import { ITEMS_PER_PAGE_OPTIONS, MAX_VISIBLE_PAGES } from '../../../constants/pagination';

interface PatientTableProps {
  patients: Patient[];
  onPatientSelect: (patient: Patient) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  onPaginationChange: (page: number, itemsPerPage?: number) => void;
  onSearch?: (searchTerm: string) => void;
  onSort?: (field: SortField, order: SortOrder) => void;
  loading?: boolean;
}

type SortField = 'name' | 'mobileNumber' | 'gender' | 'age' | 'lastAppointment';
type SortOrder = 'asc' | 'desc';

const PatientTable: React.FC<PatientTableProps> = ({
  patients = [], // Add default empty array
  onPatientSelect,
  pagination,
  onPaginationChange,
  onSearch,
  onSort,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Use debounced search term to reduce API calls
  const { debouncedSearchTerm, isSearching } = useSearchDebounce(
    searchTerm,
    500, // 500ms delay
    1    // Minimum 1 character to trigger search
  );

  // Debug: Log patients data
  console.log('PatientTable received patients:', patients);
  console.log('Total patients:', patients?.length);

  // Handle search with debouncing
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  // Format gender display
  const formatGender = (gender: string): string => {
    if (!gender) return 'N/A';
    
    // Handle both API formats
    const genderLower = (gender || '').toLowerCase();
    if (genderLower === 'male' || genderLower === 'm') return 'Male';
    if (genderLower === 'female' || genderLower === 'f') return 'Female';
    
    return gender; // Return as-is if not matching expected values
  };

  // Format mobile number with fallback
  const formatMobileDisplay = (mobileNumber: string): string => {
    if (!mobileNumber) return 'N/A';
    
    // Add +91 prefix if not present and number looks like Indian mobile
    if (mobileNumber.length === 10 && /^\d{10}$/.test(mobileNumber)) {
      return `+91 ${mobileNumber}`;
    }
    
    // If already has country code, format it
    if (mobileNumber.startsWith('91') && mobileNumber.length === 12) {
      return `+91 ${mobileNumber.slice(2)}`;
    }
    
    return mobileNumber;
  };

  // Sort and filter patients with validation
  const processedPatients = useMemo(() => {
    // Ensure patients is always an array
    const validPatients = Array.isArray(patients) ? patients : [];
    let filteredPatients = [...validPatients];
        
    // Apply search filter if no external search handler
    if (!onSearch && searchTerm) {
      filteredPatients = validPatients.filter(patient =>
        (patient?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (patient?.mobileNumber || '').includes(searchTerm) ||
        ((patient?.gender || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
        (patient?.age?.toString() || '').includes(searchTerm)
      );
    }
    
    // Apply sorting
    filteredPatients.sort((a, b) => {
      if (!a || !b) return 0; // Handle null/undefined patients
      
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'mobileNumber':
          aValue = a.mobileNumber || '';
          bValue = b.mobileNumber || '';
          break;
        case 'gender':
          aValue = a.gender || '';
          bValue = b.gender || '';
          break;
        case 'age':
          aValue = a.age || 0;
          bValue = b.age || 0;
          break;
        case 'lastAppointment':
          aValue = a.lastAppointment ? new Date(a.lastAppointment).getTime() : 0;
          bValue = b.lastAppointment ? new Date(b.lastAppointment).getTime() : 0;
          break;
        default:
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filteredPatients;
  }, [patients, searchTerm, sortField, sortOrder, onSearch]);

  const handleSort = (field: SortField) => {
    let newOrder: SortOrder = 'asc';
    if (sortField === field) {
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    
    setSortField(field);
    setSortOrder(newOrder);
    
    // Call external sort handler if provided
    if (onSort) {
      onSort(field, newOrder);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page: number) => {
    onPaginationChange(page);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    onPaginationChange(1, newLimit);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-4 h-4 opacity-30" />;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = MAX_VISIBLE_PAGES;
    
    if (pagination.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= pagination.totalPages; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            disabled={loading}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              i === pagination.currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50'
            }`}
          >
            {i}
          </button>
        );
      }
    } else {
      let startPage, endPage;
      if (pagination.currentPage <= 3) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (pagination.currentPage >= pagination.totalPages - 2) {
        startPage = pagination.totalPages - maxVisiblePages + 1;
        endPage = pagination.totalPages;
      } else {
        startPage = pagination.currentPage - 2;
        endPage = pagination.currentPage + 2;
      }

      for (let i = startPage; i <= endPage; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            disabled={loading}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              i === pagination.currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50'
            }`}
          >
            {i}
          </button>
        );
      }
    }

    return buttons;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
  const endIndex = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);

  // Use processed patients for display
  const displayPatients = onSearch ? (Array.isArray(patients) ? patients : []) : processedPatients;
  const displayTotalItems = onSearch ? pagination.totalItems : processedPatients.length;

  console.log('Display patients:', displayPatients);
  console.log('Display total items:', displayTotalItems);

  // Loading skeleton
  if (loading && displayPatients.length === 0) {
    return (
      <div className="bg-white">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-2 w-32"></div>
            <div className="h-4 bg-gray-100 rounded w-48"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Appointment, Patient or etc.."
              value={searchTerm}
              onChange={handleSearch}
              className="w-80 px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  disabled={loading}
                >
                  PATIENT NAME
                  <SortIcon field="name" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('mobileNumber')}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  disabled={loading}
                >
                  MOBILE NUMBER
                  <SortIcon field="mobileNumber" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('gender')}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  disabled={loading}
                >
                  GENDER
                  <SortIcon field="gender" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('age')}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  disabled={loading}
                >
                  AGE
                  <SortIcon field="age" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('lastAppointment')}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  disabled={loading}
                >
                  LAST APPOINTMENTS DAY
                  <SortIcon field="lastAppointment" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DATE
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {displayPatients.map((patient, index) => {
              return (
                <tr
                  key={patient?.id || index}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    index !== displayPatients.length - 1 ? 'border-b border-gray-100' : ''
                  } ${loading ? 'opacity-50' : ''}`}
                  onClick={() => patient && onPatientSelect(patient)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-blue-600 font-medium hover:text-blue-800 cursor-pointer">
                      {patient?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatMobileDisplay(patient?.mobileNumber)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatGender(patient?.gender)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient?.age || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(patient?.lastAppointment)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(patient?.created_at)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {displayTotalItems === 0 && !loading && (
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No patients match your search criteria.' : 'Get started by adding a new patient.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            {displayTotalItems > 0 ? (
              <>Showing {startIndex} to {endIndex} of {displayTotalItems} results</>
            ) : (
              <>No results found</>
            )}
            {loading && (
              <span className="ml-2 text-blue-600">
                <div className="inline-block animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
              </span>
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
    </div>
  );
};

export default PatientTable;