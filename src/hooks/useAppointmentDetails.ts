import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export const useAppointmentDetails = (appointmentId: number | null) => {
  return useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      const response = await apiClient.get(`/admin/consultations/${appointmentId}`);
      return response.data;
    },
    enabled: !!appointmentId,
    refetchOnWindowFocus: false,
  });
}; 