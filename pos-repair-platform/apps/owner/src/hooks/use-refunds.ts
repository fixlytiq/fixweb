import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundsApi, salesApi } from '@/lib/api';
import type { Refund, Sale } from '@/lib/types';
import { toast } from 'sonner';

// Query keys
export const refundKeys = {
  all: ['refunds'] as const,
  lists: () => [...refundKeys.all, 'list'] as const,
  list: () => [...refundKeys.lists()] as const,
  details: () => [...refundKeys.all, 'detail'] as const,
  detail: (id: string) => [...refundKeys.details(), id] as const,
};

export const saleKeys = {
  all: ['sales'] as const,
  lists: () => [...saleKeys.all, 'list'] as const,
  list: (filters?: { status?: string }) => [...saleKeys.lists(), filters] as const,
};

// Fetch refunds
export function useRefunds() {
  return useQuery({
    queryKey: refundKeys.list(),
    queryFn: () => refundsApi.findAll(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch single refund
export function useRefund(id: string) {
  return useQuery({
    queryKey: refundKeys.detail(id),
    queryFn: () => refundsApi.findOne(id),
    enabled: !!id,
  });
}

// Fetch available sales for refund (PAID or AUTHORIZED status)
export function useAvailableSales() {
  return useQuery({
    queryKey: saleKeys.list({ status: 'available' }),
    queryFn: async () => {
      const allSales = await salesApi.findAll();
      return allSales.filter(
        (sale) => sale.paymentStatus === 'PAID' || sale.paymentStatus === 'AUTHORIZED'
      );
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Create refund mutation
export function useCreateRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { saleId: string; amount: number; reason?: string }) =>
      refundsApi.create(data),
    onMutate: async (newRefund) => {
      await queryClient.cancelQueries({ queryKey: refundKeys.lists() });
      const previousRefunds = queryClient.getQueriesData({ queryKey: refundKeys.lists() });

      queryClient.setQueriesData<Refund[]>({ queryKey: refundKeys.lists() }, (old = []) => {
        const optimisticRefund: Refund = {
          id: `temp-${Date.now()}`,
          saleId: newRefund.saleId,
          amount: newRefund.amount,
          reason: newRefund.reason,
          createdAt: new Date().toISOString(),
        } as Refund;
        return [...old, optimisticRefund];
      });

      return { previousRefunds };
    },
    onError: (error: any, _, context) => {
      if (context?.previousRefunds) {
        context.previousRefunds.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to process refund');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      toast.success('Refund processed successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.lists() });
    },
  });
}

