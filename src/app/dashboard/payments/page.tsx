// src/app/dashboard/payments/page.tsx
/**
 * @fileoverview Redirect page for /dashboard/payments → /dashboard/wins.
 * Payments are managed inside the wins (arrematação) flow (GAP-003).
 */
import { redirect } from 'next/navigation';

export default function PaymentsRedirectPage() {
  redirect('/dashboard/wins');
}
