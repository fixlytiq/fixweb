import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, categoriesApi } from '@/lib/api';
import type { StockItem, Category } from '@/lib/types';
import { toast } from 'sonner';

// Query keys
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (categoryId?: string) => [...inventoryKeys.lists(), { categoryId }] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: () => [...categoryKeys.lists()] as const,
};

// Fetch inventory items
export function useInventory(categoryId?: string) {
  return useQuery({
    queryKey: inventoryKeys.list(categoryId),
    queryFn: () => inventoryApi.findAll(categoryId),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch single inventory item
export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => inventoryApi.findOne(id),
    enabled: !!id,
  });
}

// Fetch categories
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoriesApi.findAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create inventory item mutation
export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<StockItem>) => inventoryApi.create(data),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.lists() });
      const previousItems = queryClient.getQueriesData({ queryKey: inventoryKeys.lists() });

      queryClient.setQueriesData<StockItem[]>({ queryKey: inventoryKeys.lists() }, (old = []) => {
        const optimisticItem: StockItem = {
          id: `temp-${Date.now()}`,
          storeId: '',
          sku: newItem.sku || '',
          name: newItem.name || '',
          quantityOnHand: newItem.quantityOnHand || 0,
          ...newItem,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as StockItem;
        return [...old, optimisticItem];
      });

      return { previousItems };
    },
    onError: (error: any, _, context) => {
      if (context?.previousItems) {
        context.previousItems.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to create inventory item');
    },
    onSuccess: () => {
      toast.success('Inventory item created successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

// Update inventory item mutation
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StockItem> }) =>
      inventoryApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.lists() });
      await queryClient.cancelQueries({ queryKey: inventoryKeys.detail(id) });

      const previousItems = queryClient.getQueriesData({ queryKey: inventoryKeys.lists() });
      const previousItem = queryClient.getQueryData<StockItem>(inventoryKeys.detail(id));

      queryClient.setQueriesData<StockItem[]>({ queryKey: inventoryKeys.lists() }, (old = []) =>
        old.map((item) => (item.id === id ? { ...item, ...data } : item))
      );

      if (previousItem) {
        queryClient.setQueryData<StockItem>(inventoryKeys.detail(id), {
          ...previousItem,
          ...data,
        });
      }

      return { previousItems, previousItem };
    },
    onError: (error: any, _, context) => {
      if (context?.previousItems) {
        context.previousItems.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousItem) {
        queryClient.setQueryData(inventoryKeys.detail(context.previousItem.id), context.previousItem);
      }
      toast.error(error.message || 'Failed to update inventory item');
    },
    onSuccess: () => {
      toast.success('Inventory item updated successfully');
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.id) });
    },
  });
}

// Adjust stock mutation
export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantityChange, reason, note }: { id: string; quantityChange: number; reason?: string; note?: string }) =>
      inventoryApi.adjustStock(id, quantityChange, reason, note),
    onMutate: async ({ id, quantityChange }) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.lists() });
      await queryClient.cancelQueries({ queryKey: inventoryKeys.detail(id) });

      const previousItems = queryClient.getQueriesData({ queryKey: inventoryKeys.lists() });
      const previousItem = queryClient.getQueryData<StockItem>(inventoryKeys.detail(id));

      // Optimistically update quantity
      queryClient.setQueriesData<StockItem[]>({ queryKey: inventoryKeys.lists() }, (old = []) =>
        old.map((item) =>
          item.id === id
            ? { ...item, quantityOnHand: (item.quantityOnHand || 0) + quantityChange }
            : item
        )
      );

      if (previousItem) {
        queryClient.setQueryData<StockItem>(inventoryKeys.detail(id), {
          ...previousItem,
          quantityOnHand: (previousItem.quantityOnHand || 0) + quantityChange,
        });
      }

      return { previousItems, previousItem };
    },
    onError: (error: any, _, context) => {
      if (context?.previousItems) {
        context.previousItems.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousItem) {
        queryClient.setQueryData(inventoryKeys.detail(context.previousItem.id), context.previousItem);
      }
      toast.error(error.message || 'Failed to adjust stock');
    },
    onSuccess: () => {
      toast.success('Stock adjusted successfully');
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.id) });
    },
  });
}

// Delete inventory item mutation
export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.lists() });
      const previousItems = queryClient.getQueriesData({ queryKey: inventoryKeys.lists() });

      queryClient.setQueriesData<StockItem[]>({ queryKey: inventoryKeys.lists() }, (old = []) =>
        old.filter((item) => item.id !== id)
      );

      return { previousItems };
    },
    onError: (error: any, _, context) => {
      if (context?.previousItems) {
        context.previousItems.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to delete inventory item');
    },
    onSuccess: () => {
      toast.success('Inventory item deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

