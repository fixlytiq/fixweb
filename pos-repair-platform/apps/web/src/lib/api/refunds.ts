import { apiClient } from '../api-client';

export interface Refund {
  id: string;
  storeId: string;
  saleId: string;
  refundedById: string;
  amount: number;
  reason?: string;
  refundedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRefundDto {
  saleId: string;
  amount: number;
  reason?: string;
}

export const refundsApi = {
  findAll: async (): Promise<Refund[]> => {
    // Store ID is automatically taken from JWT token
    return apiClient.get<Refund[]>('/refunds');
  },

  findOne: async (id: string): Promise<Refund> => {
    return apiClient.get<Refund>(`/refunds/${id}`);
  },

  create: async (data: CreateRefundDto): Promise<Refund> => {
    // Store ID and refundedById are automatically taken from JWT token
    return apiClient.post<Refund>('/refunds', data);
  },
};

