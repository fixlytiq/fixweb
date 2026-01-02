'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/use-notifications';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Calculate read filter
  const readFilter = useMemo(() => {
    return filter === 'unread' ? false : filter === 'read' ? true : undefined;
  }, [filter]);

  // React Query hooks
  const { data: notifications = [], isLoading } = useNotifications(readFilter, 100);
  const { data: unreadCountData, isLoading: loadingCount } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const unreadCount = unreadCountData?.count || 0;

  const [markingId, setMarkingId] = useState<string | null>(null);

  const handleMarkAsRead = (id: string) => {
    setMarkingId(id);
    markAsReadMutation.mutate(id, {
      onSettled: () => setMarkingId(null),
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getChannelBadgeColor = (channel: string) => {
    switch (channel) {
      case 'SMS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'EMAIL':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PUSH':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredNotifications = notifications;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            View and manage your notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark All Read'}
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">
            All {notifications.length > 0 && `(${notifications.length})`}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="read">
            Read
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                Recent notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    No notifications {filter === 'unread' ? 'unread' : filter === 'read' ? 'read' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground text-center max-w-md">
                    {filter === 'all'
                      ? 'Notifications will appear here when they are sent via SMS or Email.'
                      : filter === 'unread'
                      ? 'You have no unread notifications.'
                      : 'You have no read notifications.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start justify-between rounded-lg border p-4 ${
                        !notification.read ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{notification.title}</p>
                          {!notification.read && (
                            <Badge variant="default" className="h-2 w-2 rounded-full p-0" />
                          )}
                          <Badge variant="outline" className={getChannelBadgeColor(notification.channel)}>
                            {notification.channel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(notification.sentAt).toLocaleString()}</span>
                          {notification.Ticket && (
                            <span>Ticket: {notification.Ticket.title}</span>
                          )}
                          {notification.Sale && (
                            <span>Sale: ${notification.Sale.total?.toFixed(2) || '0.00'}</span>
                          )}
                        </div>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending && markingId === notification.id}
                          className="ml-4"
                        >
                          {markAsReadMutation.isPending && markingId === notification.id ? '...' : 'Mark Read'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notification preferences can be managed in Settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
