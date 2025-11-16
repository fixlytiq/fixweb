import { apiClient } from '../api-client';

export interface StockItem {
  id: string;
  storeId: string;
  sku: string;
  name: string;
  description?: string;
  unitCost?: number;
  unitPrice?: number;
  reorderPoint?: number;
  quantityOnHand: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockItemDto {
  sku: string;
  name: string;
  description?: string;
  unitCost?: number;
  unitPrice?: number;
  reorderPoint?: number;
  initialQuantity?: number;
}

export interface UpdateStockItemDto {
  sku?: string;
  name?: string;
  description?: string;
  unitCost?: number;
  unitPrice?: number;
  reorderPoint?: number;
  quantityOnHand?: number;
}

export interface AdjustStockDto {
  quantityChange: number;
  reason?: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'TRANSFER' | 'RESERVATION' | 'RELEASE';
  note?: string;
}

export const inventoryApi = {
  findAll: async (): Promise<StockItem[]> => {
    // Store ID is automatically taken from JWT token
    return apiClient.get<StockItem[]>('/inventory');
  },

  findOne: async (id: string): Promise<StockItem> => {
    return apiClient.get<StockItem>(`/inventory/${id}`);
  },

  create: async (data: CreateStockItemDto): Promise<StockItem> => {
    // Store ID is automatically taken from JWT token
    return apiClient.post<StockItem>('/inventory', data);
  },

  update: async (id: string, data: UpdateStockItemDto): Promise<StockItem> => {
    return apiClient.patch<StockItem>(`/inventory/${id}`, data);
  },

  adjustStock: async (id: string, data: AdjustStockDto): Promise<StockItem> => {
    return apiClient.post<StockItem>(`/inventory/${id}/adjust`, data);
  },

  remove: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/inventory/${id}`);
  },
};
