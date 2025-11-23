import { apiClient } from '../api-client';

export interface PinLoginDto {
  storeEmail: string;
  pin: string;
}

export interface RegisterDto {
  ownerName: string;
  storeName: string;
  storeEmail: string;
  storePhone?: string;
  notificationEmail?: string;
  pin: string;
}

export interface LoginResponse {
  token: string;
  user: {
    employeeId: string;
    storeId: string;
    role: 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'CASHIER' | 'VIEWER';
  };
}

export interface RegisterResponse {
  token: string;
  store: {
    id: string;
    name: string;
    storeEmail: string;
  };
  employee: {
    id: string;
    name: string;
    role: 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'CASHIER' | 'VIEWER';
  };
}

export const authApi = {
  login: async (data: PinLoginDto): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/login', data);
  },

  register: async (data: RegisterDto): Promise<RegisterResponse> => {
    return apiClient.post<RegisterResponse>('/auth/register', data);
  },
};

