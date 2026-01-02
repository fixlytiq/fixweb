'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/topbar';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Skip auth check for login and access-denied pages
  const isPublicPage = useMemo(
    () => pathname === '/owner/login' || pathname === '/owner/access-denied',
    [pathname]
  );

  useEffect(() => {
    if (!isLoading) {
      if (isPublicPage) {
        // Don't redirect on public pages
        return;
      }
      
      if (!isAuthenticated) {
        const loginUrl = `/owner/login?redirect=${encodeURIComponent(pathname)}`;
        router.replace(loginUrl);
      } else if (user && user.role !== 'OWNER' && user.role !== 'MANAGER') {
        router.replace('/owner/access-denied');
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname, isPublicPage]);

  // For public pages, just render children without layout
  if (isPublicPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user && user.role !== 'OWNER' && user.role !== 'MANAGER')) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

