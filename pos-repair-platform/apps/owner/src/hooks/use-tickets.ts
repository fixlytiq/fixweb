import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/lib/api';
import type { Ticket, TicketStatus } from '@/lib/types';
import { toast } from 'sonner';

// Query keys
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (filters?: { status?: TicketStatus; technicianId?: string }) =>
    [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
  notes: (id: string) => [...ticketKeys.detail(id), 'notes'] as const,
};

// Fetch tickets
export function useTickets(status?: TicketStatus, technicianId?: string) {
  return useQuery({
    queryKey: ticketKeys.list({ status, technicianId }),
    queryFn: () => ticketsApi.findAll(status, technicianId),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch single ticket
export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => ticketsApi.findOne(id),
    enabled: !!id,
  });
}

// Fetch ticket notes
export function useTicketNotes(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.notes(ticketId),
    queryFn: () => ticketsApi.getNotes(ticketId),
    enabled: !!ticketId,
  });
}

// Create ticket mutation
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Ticket>) => ticketsApi.create(data),
    onMutate: async (newTicket) => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.lists() });
      const previousTickets = queryClient.getQueriesData({ queryKey: ticketKeys.lists() });

      queryClient.setQueriesData<Ticket[]>({ queryKey: ticketKeys.lists() }, (old = []) => {
        const optimisticTicket: Ticket = {
          id: `temp-${Date.now()}`,
          storeId: '',
          status: (newTicket.status as TicketStatus) || 'RECEIVED',
          ...newTicket,
          createdAt: new Date().toISOString(),
        } as Ticket;
        return [...old, optimisticTicket];
      });

      return { previousTickets };
    },
    onError: (error: any, _, context) => {
      if (context?.previousTickets) {
        context.previousTickets.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to create ticket');
    },
    onSuccess: () => {
      toast.success('Ticket created successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

// Update ticket mutation
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ticket> }) =>
      ticketsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.lists() });
      await queryClient.cancelQueries({ queryKey: ticketKeys.detail(id) });

      const previousTickets = queryClient.getQueriesData({ queryKey: ticketKeys.lists() });
      const previousTicket = queryClient.getQueryData<Ticket>(ticketKeys.detail(id));

      queryClient.setQueriesData<Ticket[]>({ queryKey: ticketKeys.lists() }, (old = []) =>
        old.map((ticket) => (ticket.id === id ? { ...ticket, ...data } : ticket))
      );

      if (previousTicket) {
        queryClient.setQueryData<Ticket>(ticketKeys.detail(id), {
          ...previousTicket,
          ...data,
        });
      }

      return { previousTickets, previousTicket };
    },
    onError: (error: any, _, context) => {
      if (context?.previousTickets) {
        context.previousTickets.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousTicket) {
        queryClient.setQueryData(ticketKeys.detail(context.previousTicket.id), context.previousTicket);
      }
      toast.error(error.message || 'Failed to update ticket');
    },
    onSuccess: () => {
      toast.success('Ticket updated successfully');
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
    },
  });
}

// Add note mutation
export function useAddTicketNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, body, visibility }: { ticketId: string; body: string; visibility?: 'INTERNAL' | 'CUSTOMER' }) =>
      ticketsApi.addNote(ticketId, body, visibility),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.notes(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.ticketId) });
      toast.success('Note added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add note');
    },
  });
}

