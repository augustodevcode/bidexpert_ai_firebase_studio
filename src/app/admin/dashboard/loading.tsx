/**
 * Loading state for the admin dashboard route.
 * Shows a skeleton/spinner while the dashboard data is being fetched,
 * providing immediate visual feedback after navigation.
 */
import { Loader2 } from 'lucide-react';

export default function AdminDashboardLoading() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
      data-ai-id="admin-dashboard-loading"
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando dashboard…</p>
    </div>
  );
}
