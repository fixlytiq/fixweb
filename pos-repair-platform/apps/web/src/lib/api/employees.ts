import { apiClient } from '../api-client';

export interface Employee {
  id: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'CASHIER' | 'VIEWER';
}

export interface CreateEmployeeDto {
  name: string;
  pin: string;
  role: 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'CASHIER' | 'VIEWER';
}

export const employeesApi = {
  findAll: async (): Promise<Employee[]> => {
    return apiClient.get<Employee[]>('/employees');
  },

  create: async (data: CreateEmployeeDto): Promise<Employee> => {
    return apiClient.post<Employee>('/employees', data);
  },

  remove: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/employees/${id}`);
  },
};
