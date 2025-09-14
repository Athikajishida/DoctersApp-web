import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { MAX_VISIBLE_PAGES, ITEMS_PER_PAGE_OPTIONS } from '../../constants/pagination';
import Header from '../layouts/Header';
import OverwriteSpecificDays from './forms/OverwriteSpecificDaysForm';
import EditTimeOnly from './forms/EditTimeOnlyForm';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { useScheduleContext } from '../../context/ScheduleContext';
import type { Schedule } from '../../types/schedule';

// Define the SpecificDaySchedule interface locally
interface SpecificDaySchedule {
  id: string;
  date: string;
  timings: {
    start: string;
    end: string;
  };
}

const AppointmentScheduler: React.FC = () => {
  const {
    generalSchedules,
    customSchedules,
    loading,
    error,
    refreshSchedules,
    deleteSchedule,
    toggleScheduleStatus,
    customCurrentPage,
    customTotalPages,
    customTotalCount,
    customPerPage,
    setCustomCurrentPage,
    setCustomPerPage,
  } = useScheduleContext();

  const [activeTab, setActiveTab] = useState<'general' | 'custom'>('general');
  const [showOverwriteForm, setShowOverwriteForm] = useState(false);
  const [showEditTimeForm, setShowEditTimeForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | SpecificDaySchedule | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);

  // Get filtered schedules based on active tab
  const filteredSchedules = activeTab === 'general' ? generalSchedules : customSchedules;

  const handleEdit = (schedule: Schedule) => {
    if (activeTab === 'general') {
      // For general tab, show time-only edit form
      setEditingSchedule(schedule);
      setShowEditTimeForm(true);
    } else {
      // For custom tab, transform Schedule to SpecificDaySchedule format
      const transformedSchedule: SpecificDaySchedule = {
        id: schedule.id.toString(),
        date: schedule.scheduled_date || '',
        timings: {
          start: schedule.start_time,
          end: schedule.end_time
        },
      };
      setEditingSchedule(transformedSchedule);
      setShowOverwriteForm(true);
    }
  };

  const handleDelete = (id: number) => {
    setScheduleToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (scheduleToDelete) {
      await deleteSchedule(scheduleToDelete);
      setShowDeleteConfirm(false);
      setScheduleToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setScheduleToDelete(null);
  };

  const handleToggleStatus = async (id: number) => {
    await toggleScheduleStatus(id);
  };

  // Handler for OverwriteSpecificDays component
  const handleSaveOverwrite = async (scheduleData: any) => {
    // The OverwriteSpecificDays component handles the API call internally
    // This handler will be called after successful save
    closeAllForms();
  };

  // Handler for EditTimeOnly component
  const handleSaveTimeEdit = async (scheduleData: any) => {
    // The EditTimeOnly component handles the API call internally using updateScheduleByDay
    // This handler will be called after successful save
    closeAllForms();
  };

  const formatDays = (day: string | undefined, scheduledDate?: string) => {
    if (scheduledDate) {
      const date = new Date(scheduledDate);
      return date.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }).toUpperCase();
    }
    
    // Handle single day string
    if (typeof day === 'string') {
      return day;
    }
    
    return '';
  };

  const formatTime = (time: any) => {
    if (!time) return '';
    
    // Extract time portion from datetime string
    let timeStr;
    if (time.includes('T')) {
      // Handle datetime format like "2000-01-01T08:00:00.000+05:30"
      timeStr = time.split('T')[1].split('.')[0]; // Gets "08:00:00"
    } else {
      // Handle simple time format like "08:00"
      timeStr = time;
    }
    
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: boolean) => {
    if (status) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Inactive
        </span>
      );
    }
  };

  const closeAllForms = () => {
    setShowOverwriteForm(false);
    setShowEditTimeForm(false);
    setEditingSchedule(undefined);
  };

  const handleAddNew = () => {
    setEditingSchedule(undefined);
    setShowOverwriteForm(true);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= customTotalPages && !loading) {
      setCustomCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    setCustomPerPage(newLimit);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = MAX_VISIBLE_PAGES;
    const totalPages = customTotalPages;
    
    let startPage = Math.max(1, customCurrentPage - Math.floor(maxVisiblePages / 2));
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
            i === customCurrentPage
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

  useEffect(() => {
    refreshSchedules();
  }, [refreshSchedules, customCurrentPage, customPerPage]);

  // Loading skeleton
  if (loading && filteredSchedules.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm">
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
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
                onClick={refreshSchedules}
                className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header Section */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-1">Schedule Times</h2>
                <p className="text-sm text-gray-500">
                  {activeTab === 'custom' 
                    ? `Showing ${customTotalCount} Schedules`
                    : `Showing ${filteredSchedules.length} Schedules`
                  }
                  {loading && (
                    <span className="ml-2">
                      <div className="inline-block animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {activeTab === 'custom' && (
                  <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add New
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'general'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'custom'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Custom
              </button>
            </div>

            {activeTab === 'custom' && (
              <div className="flex items-center justify-end gap-2 mt-4">
                <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Show:
                </label>
                <select
                  id="itemsPerPage"
                  value={customPerPage}
                  onChange={handleItemsPerPageChange}
                  className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-700 whitespace-nowrap">per page</span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'general' ? 'Days' : 'Date'}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timings
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredSchedules.map((schedule, index) => (
                  <tr
                    key={schedule.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index !== filteredSchedules.length - 1 ? 'border-b border-gray-100' : ''
                    } ${loading ? 'opacity-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">
                        {formatDays(schedule.day, schedule.scheduled_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(schedule.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-3">
                        {/* Edit Icon - Show for both General and Custom tabs */}
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="group relative p-2 rounded-full hover:bg-blue-100 transition-colors"
                        >
                          <Edit3 className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-black bg-opacity-80 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                            {activeTab === 'general' ? 'Edit Time' : 'Edit Schedule'}
                            {/* Tooltip Arrow */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black border-opacity-80"></div>
                          </div>
                        </button>

                        {/* Toggle Status Switch */}
                        <div className="group relative">
                          <button
                            onClick={() => handleToggleStatus(schedule.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              schedule.status
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                schedule.status ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-black bg-opacity-80 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                            {schedule.status ? 'Deactivate' : 'Activate'}
                            {/* Tooltip Arrow */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black border-opacity-80"></div>
                          </div>
                        </div>

                        {/* Delete Icon - Only for Custom tab */}
                        {activeTab === 'custom' && (
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="group relative p-2 rounded-full hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-black bg-opacity-80 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                              Delete Schedule
                              {/* Tooltip Arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black border-opacity-80"></div>
                            </div>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activeTab === 'custom' && customTotalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                {customTotalCount > 0 ? (
                  <>Showing {((customCurrentPage - 1) * customPerPage) + 1} to {Math.min(customCurrentPage * customPerPage, customTotalCount)} of {customTotalCount} results</>
                ) : (
                  <>No results found</>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, customCurrentPage - 1))}
                  disabled={customCurrentPage === 1 || loading}
                  className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex gap-1">
                  {renderPaginationButtons()}
                </div>
                
                <button
                  onClick={() => handlePageChange(Math.min(customTotalPages, customCurrentPage + 1))}
                  disabled={customCurrentPage === customTotalPages || loading}
                  className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredSchedules.length === 0 && !loading && (
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No {activeTab} schedules found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new {activeTab} schedule.
              </p>
            </div>
          )}
        </div>

        {/* Overwrite Specific Days Form Modal */}
        {showOverwriteForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-brightness-50 bg-opacity-10">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-xl relative flex flex-col" style={{ minHeight: 480, maxHeight: 540 }}>
              <OverwriteSpecificDays
                onClose={closeAllForms}
                onSave={handleSaveOverwrite}
                editingSchedule={editingSchedule && 'timings' in editingSchedule ? editingSchedule : undefined}
              />
            </div>
          </div>
        )}

        {/* Edit Time Only Form Modal - for General tab */}
        {showEditTimeForm && editingSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-brightness-50 bg-opacity-10">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-xl relative flex flex-col" style={{ minHeight: 480, maxHeight: 540 }}>
              <EditTimeOnly
                onClose={closeAllForms}
                onSave={handleSaveTimeEdit}
                editingSchedule={'start_time' in editingSchedule ? {
                  id: editingSchedule.id.toString(),
                  day: editingSchedule.day || '',
                  start_time: editingSchedule.start_time || '',
                  end_time: editingSchedule.end_time || ''
                } : undefined}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteConfirm}
          title="Delete Schedule"
          message="Are you sure you want to delete this schedule? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          type="danger"
        />
      </main>
    </div>
  );
};

export default AppointmentScheduler;