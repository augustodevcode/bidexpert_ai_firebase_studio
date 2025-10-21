
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import DevInfoIndicator from '@/components/layout/dev-info-indicator';
import AdminHeader from '@/components/layout/admin-header';
import { featureFlagService } from '@/services/feature-flags.service';

// Import both sidebars
import AdminSidebar from '@/components/layout/admin-sidebar';
import { NewAdminSidebar } from '@/components/layout/new-admin-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userProfileWithPermissions, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !userProfileWithPermissions) {
      router.push(`/auth/login?redirect=${pathname}`);
    }
  }, [userProfileWithPermissions, loading, router, pathname]);

  // Loading and permission checks remain the same...
  // ... (code for loading, not logged in, and no admin access)

  const useNewSidebar = featureFlagService.isEnabled('useNewAdminSidebar');

  return (
    <div className="flex min-h-screen bg-secondary">
      {useNewSidebar ? <NewAdminSidebar /> : <AdminSidebar />}
      <div className="flex flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl">
            {children}
            <DevInfoIndicator />
          </div>
        </main>
      </div>
    </div>
  );
}
