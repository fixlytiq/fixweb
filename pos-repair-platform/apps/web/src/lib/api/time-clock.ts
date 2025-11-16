import { apiClient } from '../api-client';

export interface TimeClock {
  id: string;
  storeId: string;
  employeeId: string;
  clockInAt: string;
  clockOutAt?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClockInDto {
  notes?: string;
}

export interface ClockOutDto {
  notes?: string;
}

export const timeClockApi = {
  clockIn: async (data: ClockInDto): Promise<TimeClock> => {
    // Store ID and Employee ID are automatically taken from JWT token
    return apiClient.post<TimeClock>('/time-clock/clock-in', data);
  },

  clockOut: async (data: ClockOutDto): Promise<TimeClock> => {
    // Store ID and Employee ID are automatically taken from JWT token
    return apiClient.post<TimeClock>('/time-clock/clock-out', data);
  },

  getMyTimeClocks: async (): Promise<TimeClock[]> => {
    // Store ID and Employee ID are automatically taken from JWT token
    return apiClient.get<TimeClock[]>('/time-clock/my-clocks');
  },

  getActiveClock: async (): Promise<TimeClock | null> => {
    // Store ID and Employee ID are automatically taken from JWT token
    return apiClient.get<TimeClock | null>('/time-clock/active');
  },
};

