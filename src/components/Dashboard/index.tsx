// Updated Dashboard.tsx - Remove local state and use only DashboardContext
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Header from '../layouts/Header';
import TabNavigation from './layout/TabNavigation';
import TodayAppointments from './appointments/TodayAppointments';
import FutureAppointments from './appointments/FutureAppointments';
import PastAppointments from './appointments/PastAppointments';
import { DashboardProvider, useDashboardContext } from '../../context/DashboardContext';
import { adminAppointmentApi } from '../../services/adminAppointmentApi';
import { DEFAULT_ITEMS_PER_PAGE } from '../../constants/pagination';

const DashboardContent: React.FC = () => {
  const { activeTab, setActiveTab, searchTerm, setSearchTerm } = useDashboardContext();
  const queryClient = useQueryClient();

  // 🎯 Prefetch inactive tabs for instant switching
  React.useEffect(() => {
    const prefetchTabs = async () => {
      const tabs = ['today', 'past', 'future'] as const;
      const inactiveTabs = tabs.filter(tab => tab !== activeTab);
      
      // Prefetch data for inactive tabs in the background
      inactiveTabs.forEach(async (tab) => {
        const queryKey = ['tabAppointments', tab, 1, searchTerm || '', 'date', 'asc'];
        
        // Only prefetch if data doesn't exist or is stale
        if (!queryClient.getQueryData(queryKey)) {
          queryClient.prefetchQuery({
            queryKey,
            queryFn: async () => {
              const params: any = {
                date_filter: tab,
                page: 1,
                per_page: DEFAULT_ITEMS_PER_PAGE,
                sort_by: 'slot_date',
                sort_dir: 'asc' as 'asc'
              };
              
              if (searchTerm && searchTerm.length >= 1) {
                params.search = searchTerm;
              }
              
              const response = await adminAppointmentApi.getConsultations(params);
              
              // Transform data same as in useTabAppointments
              const appointments = (response.data || []).map((apiAppointment: any) => {
                const mapApiStatus = (status: string): 'Upcoming' | 'Completed' | 'Cancelled' | 'No Show' | 'InProgress' => {
                  switch ((status || '').toLowerCase()) {
                    case 'confirmed':
                    case 'scheduled':
                      return 'Upcoming';
                    case 'completed':
                      return 'Completed';
                    case 'cancelled':
                    case 'canceled':
                      return 'Cancelled';
                    case 'no_show':
                    case 'noshow':
                      return 'No Show';
                    case 'in_progress':
                    case 'inprogress':
                      return 'InProgress';
                    default:
                      return 'Upcoming';
                  }
                };

                // Capitalize first letter of gender
                const capitalizeGender = (gender: string): string => {
                  if (!gender) return 'Unknown';
                  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
                };

                return {
                  id: apiAppointment.id,
                  patientName: apiAppointment.patient_name || `${apiAppointment.patient?.first_name || ''} ${apiAppointment.patient?.last_name || ''}`.trim() || 'Unknown Patient',
                  mobileNumber: apiAppointment.patient_phone || apiAppointment.patient?.phone_number || 'N/A',
                  gender: capitalizeGender(apiAppointment.patient?.gender),
                  age: apiAppointment.patient?.age || 0,
                  diseases: apiAppointment.treatment_type || apiAppointment.treatment_history || 'General Consultation',
                  status: mapApiStatus(apiAppointment.appointment_status || apiAppointment.status || 'scheduled'),
                  date: apiAppointment.slot_date || apiAppointment.booked_slots?.[0]?.slot_date,
                  time: apiAppointment.slot_time || apiAppointment.booked_slots?.[0]?.slot_time,
                  patientId: apiAppointment.patient_id || apiAppointment.patient?.id,
                  bookedSlots: apiAppointment.booked_slots || [],
                };
              });

              return {
                appointments,
                totalCount: (response as any).meta?.total || (response as any).total_count || 0,
                currentPage: (response as any).meta?.current_page || (response as any).current_page || 1,
                totalPages: (response as any).meta?.total_pages || (response as any).total_pages || 1,
              };
            },
            staleTime: 2 * 60 * 1000,
          });
        }
      });
    };

    // Prefetch after a short delay to avoid blocking the current tab
    const timeoutId = setTimeout(prefetchTabs, 100);
    return () => clearTimeout(timeoutId);
  }, [activeTab, searchTerm, queryClient]);

  // 🎯 Render all tabs simultaneously to prevent unmounting/remounting
  // Only show the active tab via CSS display property
  const renderContent = () => {
    return (
      <>
        <div style={{ display: activeTab === 'today' ? 'block' : 'none' }}>
          <TodayAppointments searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        </div>
        <div style={{ display: activeTab === 'future' ? 'block' : 'none' }}>
          <FutureAppointments searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        </div>
        <div style={{ display: activeTab === 'past' ? 'block' : 'none' }}>
          <PastAppointments searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header />
      <div className="p-6">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        {renderContent()}
      </div>
    </div>
  );
};

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}