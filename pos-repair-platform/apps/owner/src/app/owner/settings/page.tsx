'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useStore, useUpdateStore } from '@/hooks/use-stores';

export default function SettingsPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    storeEmail: '',
    storePhone: '',
    notificationEmail: '',
    timezone: 'America/Chicago',
    taxRate: 0.08,
  });
  const [notifications, setNotifications] = useState({
    emailEnabled: true,
    smsEnabled: false,
  });

  // React Query hooks
  const { data: store, isLoading } = useStore(user?.storeId || '');
  const updateMutation = useUpdateStore();

  // Update form data when store loads
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        storeEmail: store.storeEmail,
        storePhone: store.storePhone || '',
        notificationEmail: store.notificationEmail || store.storeEmail,
        timezone: store.timezone,
        taxRate: store.taxRate || 0.08,
      });
    }
  }, [store]);

  const handleSave = () => {
    if (!user?.storeId) return;
    updateMutation.mutate(
      {
        id: user.storeId,
        data: formData,
      },
      {
        onSuccess: () => {
          // Form data will be updated automatically via React Query
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your store settings and preferences
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your store settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Settings</CardTitle>
          <CardDescription>
            Update your store information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Store Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter store name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storeEmail">Store Email *</Label>
            <Input
              id="storeEmail"
              type="email"
              value={formData.storeEmail}
              onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
              placeholder="store@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storePhone">Store Phone</Label>
            <Input
              id="storePhone"
              type="tel"
              value={formData.storePhone}
              onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
              placeholder="+1234567890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notificationEmail">Notification Email</Label>
            <Input
              id="notificationEmail"
              type="email"
              value={formData.notificationEmail}
              onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
              placeholder="notifications@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              placeholder="America/Chicago"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.taxRate ? (formData.taxRate * 100).toFixed(2) : '8.00'}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setFormData({ ...formData, taxRate: value / 100 });
              }}
              placeholder="8.00"
            />
            <p className="text-xs text-muted-foreground">
              Enter tax rate as percentage (e.g., 8 for 8%). Tax rates may vary by state.
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending || !formData.name || !formData.storeEmail}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={notifications.emailEnabled}
              onCheckedChange={(checked) => setNotifications({ ...notifications, emailEnabled: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium">SMS Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications via SMS
              </p>
            </div>
            <Switch
              checked={notifications.smsEnabled}
              onCheckedChange={(checked) => setNotifications({ ...notifications, smsEnabled: checked })}
            />
          </div>
          <Button variant="outline" onClick={() => toast.info('Notification preferences saved')}>
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
