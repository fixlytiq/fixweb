import { apiClient } from '../api-client';
import { Category } from './inventory';

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
}

export const categoriesApi = {
  findAll: async (): Promise<Category[]> => {
    return apiClient.get<Category[]>('/categories');
  },

  findOne: async (id: string): Promise<Category> => {
    return apiClient.get<Category>(`/categories/${id}`);
  },

  create: async (data: CreateCategoryDto): Promise<Category> => {
    return apiClient.post<Category>('/categories', data);
  },

  update: async (id: string, data: UpdateCategoryDto): Promise<Category> => {
    return apiClient.patch<Category>(`/categories/${id}`, data);
  },

  remove: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/categories/${id}`);
  },
};

