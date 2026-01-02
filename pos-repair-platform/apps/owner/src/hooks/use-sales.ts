import { useQuery } from '@tanstack/react-query';
import { salesApi } from '@/lib/api';
import type { Sale } from '@/lib/types';

// Query keys
export const saleKeys = {
  all: ['sales'] as const,
  lists: () => [...saleKeys.all, 'list'] as const,
  list: (ticketId?: string) => [...saleKeys.lists(), { ticketId }] as const,
  details: () => [...saleKeys.all, 'detail'] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
};

// Fetch sales
export function useSales(ticketId?: string) {
  return useQuery({
    queryKey: saleKeys.list(ticketId),
    queryFn: () => salesApi.findAll(ticketId),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch single sale
export function useSale(id: string) {
  return useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: () => salesApi.findOne(id),
    enabled: !!id,
  });
}

