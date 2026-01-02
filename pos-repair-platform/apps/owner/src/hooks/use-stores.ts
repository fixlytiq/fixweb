import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storesApi } from '@/lib/api';
import type { Store } from '@/lib/types';
import { toast } from 'sonner';

// Query keys
export const storeKeys = {
  all: ['stores'] as const,
  lists: () => [...storeKeys.all, 'list'] as const,
  list: () => [...storeKeys.lists()] as const,
  details: () => [...storeKeys.all, 'detail'] as const,
  detail: (id: string) => [...storeKeys.details(), id] as const,
};

// Fetch stores
export function useStores() {
  return useQuery({
    queryKey: storeKeys.list(),
    queryFn: () => storesApi.findAll(),
    staleTime: 60 * 1000, // 1 minute
  });
}

// Fetch single store
export function useStore(id: string) {
  return useQuery({
    queryKey: storeKeys.detail(id),
    queryFn: () => storesApi.findOne(id),
    enabled: !!id,
  });
}

// Create store mutation
export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; storeEmail: string; storePhone?: string; notificationEmail?: string; timezone?: string }) =>
      storesApi.create(data),
    onMutate: async (newStore) => {
      await queryClient.cancelQueries({ queryKey: storeKeys.lists() });
      const previousStores = queryClient.getQueriesData({ queryKey: storeKeys.lists() });

      queryClient.setQueriesData<Store[]>({ queryKey: storeKeys.lists() }, (old = []) => {
        const optimisticStore: Store = {
          id: `temp-${Date.now()}`,
          ...newStore,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Store;
        return [...old, optimisticStore];
      });

      return { previousStores };
    },
    onError: (error: any, _, context) => {
      if (context?.previousStores) {
        context.previousStores.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to create store');
    },
    onSuccess: () => {
      toast.success('Store created successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
    },
  });
}

// Update store mutation
export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Store> }) =>
      storesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: storeKeys.lists() });
      await queryClient.cancelQueries({ queryKey: storeKeys.detail(id) });

      const previousStores = queryClient.getQueriesData({ queryKey: storeKeys.lists() });
      const previousStore = queryClient.getQueryData<Store>(storeKeys.detail(id));

      queryClient.setQueriesData<Store[]>({ queryKey: storeKeys.lists() }, (old = []) =>
        old.map((store) => (store.id === id ? { ...store, ...data } : store))
      );

      if (previousStore) {
        queryClient.setQueryData<Store>(storeKeys.detail(id), {
          ...previousStore,
          ...data,
        });
      }

      return { previousStores, previousStore };
    },
    onError: (error: any, _, context) => {
      if (context?.previousStores) {
        context.previousStores.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousStore) {
        queryClient.setQueryData(storeKeys.detail(context.previousStore.id), context.previousStore);
      }
      toast.error(error.message || 'Failed to update store');
    },
    onSuccess: () => {
      toast.success('Store updated successfully');
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storeKeys.detail(variables.id) });
    },
  });
}

// Delete store mutation
export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storesApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: storeKeys.lists() });
      const previousStores = queryClient.getQueriesData({ queryKey: storeKeys.lists() });

      queryClient.setQueriesData<Store[]>({ queryKey: storeKeys.lists() }, (old = []) =>
        old.filter((store) => store.id !== id)
      );

      return { previousStores };
    },
    onError: (error: any, _, context) => {
      if (context?.previousStores) {
        context.previousStores.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to delete store');
    },
    onSuccess: () => {
      toast.success('Store deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
    },
  });
}

