import { apiClient } from '../api-client';

export interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    Ticket: number;
    Sale: number;
  };
}

export interface CreateCustomerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export const customersApi = {
  findAll: async (search?: string, limit?: number): Promise<Customer[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (limit) params.limit = limit.toString();
    return apiClient.get<Customer[]>('/customers', params);
  },

  findOne: async (id: string): Promise<Customer> => {
    return apiClient.get<Customer>(`/customers/${id}`);
  },

  create: async (dto: CreateCustomerDto): Promise<Customer> => {
    return apiClient.post<Customer>('/customers', dto);
  },

  update: async (id: string, dto: UpdateCustomerDto): Promise<Customer> => {
    return apiClient.patch<Customer>(`/customers/${id}`, dto);
  },

  remove: async (id: string): Promise<void> => {
    return apiClient.delete(`/customers/${id}`);
  },
};

