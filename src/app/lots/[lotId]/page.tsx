// src/app/lots/[lotId]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { getLot, getLots } from '@/app/admin/lots/actions';
import { Loader2 } from 'lucide-react';

export default async function LotRedirectPage({ params }: { params: { lotId: string } }) {
  const lotId = params.lotId;

  if (!lotId) {
    notFound();
  }

  // Fetch the lot using the provided ID (could be publicId or internal ID)
  const lot = await getLot(lotId);

  if (lot && lot.auctionId) {
    // If lot is found, redirect to its canonical URL
    const canonicalUrl = `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`;
    console.log(`[LotRedirectPage] Lot ${lotId} found. Redirecting to: ${canonicalUrl}`);
    redirect(canonicalUrl);
  } else {
    // If lot is not found, render the notFound UI
    console.warn(`[LotRedirectPage] Lot with ID ${lotId} not found.`);
    notFound();
  }
  
  // This part is technically unreachable due to redirect/notFound, but good practice.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecionando para o lote...</p>
    </div>
  );
}

// Optional: Pre-build some of these redirect pages at build time for performance
// This helps with SEO and faster loads for known lots.
export async function generateStaticParams() {
  try {
    const lots = await getLots(); 
    // Limit to a reasonable number for build time, e.g., the first 50 lots
    return lots.slice(0, 50).map((lot) => ({ 
      lotId: lot.publicId || lot.id,
    }));
  } catch (error) {
    console.error("Failed to generate static params for lot redirects:", error);
    return [];
  }
}
