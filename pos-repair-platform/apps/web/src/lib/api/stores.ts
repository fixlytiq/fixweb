import { apiClient } from '../api-client';

export interface Store {
  id: string;
  name: string;
  storeEmail: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreDto {
  name: string;
  storeEmail: string;
  timezone?: string;
}

export interface UpdateStoreDto {
  name?: string;
  timezone?: string;
}

export const storesApi = {
  findAll: async (): Promise<Store[]> => {
    // Backend returns array but users can only see their own store
    return apiClient.get<Store[]>('/stores');
  },

  findOne: async (id: string): Promise<Store> => {
    return apiClient.get<Store>(`/stores/${id}`);
  },

  // Note: Store creation happens during registration (POST /auth/register)
  // This endpoint is not available as each registration creates one store

  update: async (id: string, data: UpdateStoreDto): Promise<Store> => {
    return apiClient.patch<Store>(`/stores/${id}`, data);
  },

  remove: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/stores/${id}`);
  },
};
