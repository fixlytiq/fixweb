import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import type { Notification } from '@/lib/types';
import { toast } from 'sonner';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (read?: boolean) => [...notificationKeys.lists(), { read }] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

// Fetch notifications
export function useNotifications(read?: boolean, limit?: number) {
  return useQuery({
    queryKey: notificationKeys.list(read),
    queryFn: () => notificationsApi.findAll(read, limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch unread count
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

// Mark notification as read mutation
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      await queryClient.cancelQueries({ queryKey: notificationKeys.unreadCount() });

      const previousNotifications = queryClient.getQueriesData({ queryKey: notificationKeys.lists() });
      const previousUnreadCount = queryClient.getQueryData<{ count: number }>(notificationKeys.unreadCount());

      // Optimistically update notification
      queryClient.setQueriesData<Notification[]>({ queryKey: notificationKeys.lists() }, (old = []) =>
        old.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );

      // Optimistically update unread count
      if (previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), {
          count: Math.max(0, previousUnreadCount.count - 1),
        });
      }

      return { previousNotifications, previousUnreadCount };
    },
    onError: (error: any, _, context) => {
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount);
      }
      toast.error(error.message || 'Failed to mark notification as read');
    },
    onSuccess: () => {
      toast.success('Notification marked as read');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

// Mark all notifications as read mutation
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      await queryClient.cancelQueries({ queryKey: notificationKeys.unreadCount() });

      const previousNotifications = queryClient.getQueriesData({ queryKey: notificationKeys.lists() });
      const previousUnreadCount = queryClient.getQueryData<{ count: number }>(notificationKeys.unreadCount());

      // Optimistically mark all as read
      queryClient.setQueriesData<Notification[]>({ queryKey: notificationKeys.lists() }, (old = []) =>
        old.map((notification) => ({ ...notification, read: true }))
      );

      // Optimistically set unread count to 0
      queryClient.setQueryData(notificationKeys.unreadCount(), { count: 0 });

      return { previousNotifications, previousUnreadCount };
    },
    onError: (error: any, _, context) => {
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount);
      }
      toast.error(error.message || 'Failed to mark all notifications as read');
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

