// services/scheduleService.ts
import { apiClient } from './apiClient';
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest, ScheduleResponse } from '../types/schedule';

export class ScheduleService {
  private basePath = '/admin/schedules';

  async getSchedules(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    day?: string;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.day) queryParams.append('day', params.day);
    
    const queryString = queryParams.toString();
    const endpoint = `${this.basePath}/all_days${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<ScheduleResponse>(endpoint);
  }

  async getCustomSchedules(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    day?: string;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.day) queryParams.append('day', params.day);
    
    const queryString = queryParams.toString();
    const endpoint = `${this.basePath}/next_schedules${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<ScheduleResponse>(endpoint);
  }

  async getSchedule(id: number) {
    return apiClient.get<Schedule>(`${this.basePath}/${id}`);
  }

  async createSchedule(schedule: CreateScheduleRequest) {
    return apiClient.post<Schedule>(this.basePath, { schedule });
  }

  async updateSchedule(id: number, schedule: UpdateScheduleRequest) {
    return apiClient.put<Schedule>(`${this.basePath}/${id}`, { schedule });
  }

  // NEW: Update schedule by day (for general schedules)
  async updateScheduleByDay(day: string, schedule: UpdateScheduleRequest) {
    return apiClient.put<Schedule>(`${this.basePath}/update_by_day`, { 
      day, 
      schedule 
    });
  }

  // NEW: Update schedule by date (for custom schedules)
  async updateScheduleByDate(scheduledDate: string, schedule: UpdateScheduleRequest) {
    return apiClient.put<Schedule>(`${this.basePath}/update_by_date`, { 
      scheduled_date: scheduledDate, 
      schedule 
    });
  }

  async deleteSchedule(id: number) {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  async toggleScheduleStatus(id: number) {
    return apiClient.put<{ message: string; schedule: Schedule }>(`${this.basePath}/${id}/toggle_status`, {});
  }
}

export const scheduleService = new ScheduleService();