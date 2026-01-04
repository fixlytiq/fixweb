import { apiClient } from '../api-client';

export type PurchaseOrderStatus = 'DRAFT' | 'SUBMITTED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  stockItemId?: string;
  sku: string;
  description?: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  StockItem?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface PurchaseOrder {
  id: string;
  storeId: string;
  vendorId?: string;
  status: PurchaseOrderStatus;
  reference?: string;
  notes?: string;
  expectedAt?: string;
  orderedAt?: string;
  receivedAt?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  createdAt: string;
  updatedAt: string;
  Vendor?: {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
  };
  PurchaseOrderItem: PurchaseOrderItem[];
  _count?: {
    PurchaseOrderItem: number;
  };
}

export interface CreatePurchaseOrderItemDto {
  stockItemId?: string;
  sku: string;
  description?: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  metadata?: Record<string, any>;
}

export interface CreatePurchaseOrderDto {
  vendorId?: string;
  status?: PurchaseOrderStatus;
  reference?: string;
  notes?: string;
  expectedAt?: string;
  items: CreatePurchaseOrderItemDto[];
}

export interface UpdatePurchaseOrderDto {
  vendorId?: string;
  status?: PurchaseOrderStatus;
  reference?: string;
  notes?: string;
  expectedAt?: string;
  orderedAt?: string;
  receivedAt?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
}

export const purchaseOrdersApi = {
  findAll: async (status?: PurchaseOrderStatus, vendorId?: string): Promise<PurchaseOrder[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (vendorId) params.vendorId = vendorId;
    return apiClient.get<PurchaseOrder[]>('/purchase-orders', params);
  },

  findOne: async (id: string): Promise<PurchaseOrder> => {
    return apiClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
  },

  create: async (dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> => {
    return apiClient.post<PurchaseOrder>('/purchase-orders', dto);
  },

  update: async (id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrder> => {
    return apiClient.patch<PurchaseOrder>(`/purchase-orders/${id}`, dto);
  },

  submit: async (id: string): Promise<PurchaseOrder> => {
    return apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/submit`, {});
  },

  approve: async (id: string): Promise<PurchaseOrder> => {
    return apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/approve`, {});
  },

  receive: async (id: string): Promise<PurchaseOrder> => {
    return apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/receive`, {});
  },

  cancel: async (id: string): Promise<PurchaseOrder> => {
    return apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/cancel`, {});
  },

  remove: async (id: string): Promise<void> => {
    return apiClient.delete(`/purchase-orders/${id}`);
  },
};

