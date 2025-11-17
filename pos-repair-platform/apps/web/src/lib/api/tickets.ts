import { apiClient } from '../api-client';

export type TicketStatus = 'RECEIVED' | 'IN_PROGRESS' | 'AWAITING_PARTS' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface Employee {
  id: string;
  name: string;
  role: string;
}

export interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface Ticket {
  id: string;
  storeId: string;
  customerId?: string;
  technicianId?: string;
  title: string;
  description?: string;
  status: TicketStatus;
  estimatedCost?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  technician?: Employee;
  store?: {
    id: string;
    name: string;
    storeEmail?: string;
  };
  notes?: TicketNote[];
  waivers?: any[];
  _count?: {
    notes: number;
    waivers: number;
  };
}

export interface CreateTicketDto {
  title: string;
  description?: string;
  customerId?: string;
  technicianId?: string;
  status?: TicketStatus;
  estimatedCost?: number;
  scheduledAt?: string;
}

export interface UpdateTicketDto {
  title?: string;
  description?: string;
  customerId?: string;
  technicianId?: string | null;
  status?: TicketStatus;
  estimatedCost?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  scheduledAt?: string;
}

export interface TicketNote {
  id: string;
  ticketId: string;
  authorId: string;
  visibility: 'INTERNAL' | 'CUSTOMER';
  body: string;
  createdAt: string;
  updatedAt: string;
  author?: Employee;
}

export interface CreateTicketNoteDto {
  body: string;
  visibility?: 'INTERNAL' | 'CUSTOMER';
}

export const ticketsApi = {
  findAll: async (status?: TicketStatus, technicianId?: string): Promise<Ticket[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (technicianId) params.append('technicianId', technicianId);
    const query = params.toString();
    return apiClient.get<Ticket[]>(`/tickets${query ? `?${query}` : ''}`);
  },

  findOne: async (id: string): Promise<Ticket> => {
    return apiClient.get<Ticket>(`/tickets/${id}`);
  },

  create: async (dto: CreateTicketDto): Promise<Ticket> => {
    return apiClient.post<Ticket>('/tickets', dto);
  },

  update: async (id: string, dto: UpdateTicketDto): Promise<Ticket> => {
    return apiClient.patch<Ticket>(`/tickets/${id}`, dto);
  },

  remove: async (id: string): Promise<void> => {
    return apiClient.delete(`/tickets/${id}`);
  },

  addNote: async (ticketId: string, dto: CreateTicketNoteDto): Promise<TicketNote> => {
    return apiClient.post<TicketNote>(`/tickets/${ticketId}/notes`, dto);
  },

  getNotes: async (ticketId: string): Promise<TicketNote[]> => {
    return apiClient.get<TicketNote[]>(`/tickets/${ticketId}/notes`);
  },
};

