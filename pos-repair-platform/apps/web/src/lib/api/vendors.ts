import { apiClient } from '../api-client';

export interface Vendor {
  id: string;
  storeId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    PurchaseOrder: number;
  };
}

export interface CreateVendorDto {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
}

export interface UpdateVendorDto {
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
}

export const vendorsApi = {
  findAll: async (search?: string): Promise<Vendor[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    return apiClient.get<Vendor[]>('/vendors', params);
  },

  findOne: async (id: string): Promise<Vendor> => {
    return apiClient.get<Vendor>(`/vendors/${id}`);
  },

  create: async (dto: CreateVendorDto): Promise<Vendor> => {
    return apiClient.post<Vendor>('/vendors', dto);
  },

  update: async (id: string, dto: UpdateVendorDto): Promise<Vendor> => {
    return apiClient.patch<Vendor>(`/vendors/${id}`, dto);
  },

  remove: async (id: string): Promise<void> => {
    return apiClient.delete(`/vendors/${id}`);
  },
};

