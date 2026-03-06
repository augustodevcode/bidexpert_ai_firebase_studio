// src/app/dashboard/won-lots/page.tsx
/**
 * @fileoverview Redirect page for /dashboard/won-lots → /dashboard/wins.
 * Ensures legacy or external links pointing to /dashboard/won-lots still work (GAP-002).
 */
import { redirect } from 'next/navigation';

export default function WonLotsRedirectPage() {
  redirect('/dashboard/wins');
}
