'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Store,
  Users,
  UserCircle,
  Package,
  Ticket,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  Bell,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
  { name: 'Stores', href: '/owner/stores', icon: Store },
  { name: 'Team', href: '/owner/team', icon: Users },
  { name: 'Customers', href: '/owner/customers', icon: UserCircle },
  { name: 'Inventory', href: '/owner/inventory', icon: Package },
  { name: 'Tickets', href: '/owner/tickets', icon: Ticket },
  { name: 'POS Insights', href: '/owner/pos-insights', icon: CreditCard },
  { name: 'Refunds', href: '/owner/refunds', icon: Receipt },
  { name: 'Reports', href: '/owner/reports', icon: BarChart3 },
  { name: 'Settings', href: '/owner/settings', icon: Settings },
  { name: 'Notifications', href: '/owner/notifications', icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-lg font-bold text-foreground">Owner Portal</h1>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="mb-2 px-3 text-xs font-medium text-muted-foreground">
          {user?.role || 'User'}
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

