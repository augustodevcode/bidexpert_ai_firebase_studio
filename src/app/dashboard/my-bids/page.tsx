// src/app/dashboard/my-bids/page.tsx
/**
 * @fileoverview Redirect page for /dashboard/my-bids → /dashboard/bids.
 * Ensures legacy or external links pointing to /dashboard/my-bids still work (GAP-001).
 */
import { redirect } from 'next/navigation';

export default function MyBidsRedirectPage() {
  redirect('/dashboard/bids');
}
