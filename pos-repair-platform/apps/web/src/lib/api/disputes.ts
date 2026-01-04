import { apiClient } from '../api-client';

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
export type DisputeEvidenceType = 'NOTE' | 'DOCUMENT' | 'IMAGE' | 'AUDIO' | 'OTHER';

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  type: DisputeEvidenceType;
  url?: string;
  description?: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  storeId: string;
  ticketId?: string;
  raisedById?: string;
  assignedToId?: string;
  status: DisputeStatus;
  summary: string;
  resolution?: string;
  openedAt: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  Ticket?: {
    id: string;
    title: string;
    status: string;
    description?: string;
  };
  DisputeEvidence?: DisputeEvidence[];
  _count?: {
    DisputeEvidence: number;
  };
}

export interface CreateDisputeDto {
  ticketId?: string;
  raisedById?: string;
  assignedToId?: string;
  status?: DisputeStatus;
  summary: string;
  resolution?: string;
}

export interface UpdateDisputeDto {
  ticketId?: string;
  raisedById?: string;
  assignedToId?: string;
  status?: DisputeStatus;
  summary?: string;
  resolution?: string;
  resolvedAt?: string;
}

export interface CreateDisputeEvidenceDto {
  type: DisputeEvidenceType;
  url?: string;
  description?: string;
}

export const disputesApi = {
  findAll: async (status?: DisputeStatus, ticketId?: string): Promise<Dispute[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (ticketId) params.ticketId = ticketId;
    return apiClient.get<Dispute[]>('/disputes', params);
  },

  findOne: async (id: string): Promise<Dispute> => {
    return apiClient.get<Dispute>(`/disputes/${id}`);
  },

  create: async (dto: CreateDisputeDto): Promise<Dispute> => {
    return apiClient.post<Dispute>('/disputes', dto);
  },

  update: async (id: string, dto: UpdateDisputeDto): Promise<Dispute> => {
    return apiClient.patch<Dispute>(`/disputes/${id}`, dto);
  },

  resolve: async (id: string, resolution: string): Promise<Dispute> => {
    return apiClient.post<Dispute>(`/disputes/${id}/resolve`, { resolution });
  },

  dismiss: async (id: string): Promise<Dispute> => {
    return apiClient.post<Dispute>(`/disputes/${id}/dismiss`, {});
  },

  addEvidence: async (disputeId: string, dto: CreateDisputeEvidenceDto): Promise<DisputeEvidence> => {
    return apiClient.post<DisputeEvidence>(`/disputes/${disputeId}/evidence`, dto);
  },

  removeEvidence: async (disputeId: string, evidenceId: string): Promise<void> => {
    return apiClient.delete(`/disputes/${disputeId}/evidence/${evidenceId}`);
  },

  remove: async (id: string): Promise<void> => {
    return apiClient.delete(`/disputes/${id}`);
  },
};

