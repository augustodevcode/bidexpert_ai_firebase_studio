// src/app/admin/auctions/[auctionId]/auction-control-center/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AuctionPreparationDashboard } from '@/components/admin/auction-preparation/auction-preparation-dashboard';
import { getAuctionPreparationData } from '@/app/admin/auctions/actions';
import { Loader2 } from 'lucide-react';

interface AuctionControlCenterPageProps {
  params: { auctionId: string };
}

export default async function AuctionControlCenterPage({ params }: AuctionControlCenterPageProps) {
  const auctionIdentifier = params.auctionId;
  const data = await getAuctionPreparationData(auctionIdentifier);

  if (!data) {
    notFound();
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] min-w-0 w-full flex-col">
      <Suspense
        fallback={
          <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <AuctionPreparationDashboard data={data} />
      </Suspense>
    </div>
  );
}
