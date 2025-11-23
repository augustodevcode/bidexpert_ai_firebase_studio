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
    <div className="h-full">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <AuctionPreparationDashboard data={data} />
      </Suspense>
    </div>
  );
}
