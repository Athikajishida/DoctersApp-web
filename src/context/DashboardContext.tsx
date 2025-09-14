import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import type { TabType, Appointment } from '../types/dashboard.types';

interface DashboardContextType {
  // State
  activeTab: TabType;
  searchTerm: string;
  appointments: {
    today: Appointment[];
    future: Appointment[];
    past: Appointment[];
  };
  currentAppointments: Appointment[];
  filteredAppointments: Appointment[];
  appointmentCounts: {
    today: number;
    future: number;
    past: number;
  };
  loading: boolean;
  error: string | null;
  isSearching: boolean;
  
  // Actions
  setActiveTab: (tab: TabType) => void;
  setSearchTerm: (term: string) => void;
  addAppointment: (appointment: Omit<Appointment, 'id'>, tab: TabType) => Promise<any>;
  updateAppointment: (appointmentId: number, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (appointmentId: number) => Promise<void>;
  moveAppointment: (appointmentId: number, fromTab: TabType, toTab: TabType) => Promise<void>;
  refreshAppointments: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const dashboardState = useDashboard();

  return (
    <DashboardContext.Provider value={dashboardState}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
};

export default DashboardContext;