import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/lib/api';
import type { Customer } from '@/lib/types';
import { toast } from 'sonner';

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (search?: string) => [...customerKeys.lists(), { search }] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

// Fetch customers
export function useCustomers(search?: string, limit?: number) {
  return useQuery({
    queryKey: customerKeys.list(search),
    queryFn: () => customersApi.findAll(search, limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch single customer
export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.findOne(id),
    enabled: !!id,
  });
}

// Create customer mutation
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; email?: string; phone?: string; notes?: string }) =>
      customersApi.create(data),
    onMutate: async (newCustomer) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: customerKeys.lists() });

      // Snapshot the previous value
      const previousCustomers = queryClient.getQueriesData({ queryKey: customerKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData<Customer[]>({ queryKey: customerKeys.lists() }, (old = []) => {
        const optimisticCustomer: Customer = {
          id: `temp-${Date.now()}`,
          ...newCustomer,
          createdAt: new Date().toISOString(),
          _count: { Ticket: 0, Sale: 0 },
        };
        return [...old, optimisticCustomer];
      });

      return { previousCustomers };
    },
    onError: (error: any, _, context) => {
      // Rollback on error
      if (context?.previousCustomers) {
        context.previousCustomers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to create customer');
    },
    onSuccess: () => {
      toast.success('Customer created successfully');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

// Update customer mutation
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      customersApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: customerKeys.lists() });
      await queryClient.cancelQueries({ queryKey: customerKeys.detail(id) });

      // Snapshot the previous values
      const previousCustomers = queryClient.getQueriesData({ queryKey: customerKeys.lists() });
      const previousCustomer = queryClient.getQueryData<Customer>(customerKeys.detail(id));

      // Optimistically update the list
      queryClient.setQueriesData<Customer[]>({ queryKey: customerKeys.lists() }, (old = []) =>
        old.map((customer) => (customer.id === id ? { ...customer, ...data } : customer))
      );

      // Optimistically update the detail
      if (previousCustomer) {
        queryClient.setQueryData<Customer>(customerKeys.detail(id), {
          ...previousCustomer,
          ...data,
        });
      }

      return { previousCustomers, previousCustomer };
    },
    onError: (error: any, _, context) => {
      // Rollback on error
      if (context?.previousCustomers) {
        context.previousCustomers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousCustomer) {
        queryClient.setQueryData(customerKeys.detail(context.previousCustomer.id), context.previousCustomer);
      }
      toast.error(error.message || 'Failed to update customer');
    },
    onSuccess: () => {
      toast.success('Customer updated successfully');
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
    },
  });
}

// Delete customer mutation
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: customerKeys.lists() });

      // Snapshot the previous value
      const previousCustomers = queryClient.getQueriesData({ queryKey: customerKeys.lists() });

      // Optimistically remove from the list
      queryClient.setQueriesData<Customer[]>({ queryKey: customerKeys.lists() }, (old = []) =>
        old.filter((customer) => customer.id !== id)
      );

      return { previousCustomers };
    },
    onError: (error: any, _, context) => {
      // Rollback on error
      if (context?.previousCustomers) {
        context.previousCustomers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to delete customer');
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

