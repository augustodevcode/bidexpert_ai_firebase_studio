// src/app/admin/auctions/[auctionId]/auction-control-center/layout.tsx
import type { ReactNode } from 'react';

interface AuctionControlCenterLayoutProps {
  children: ReactNode;
}

// Layout especial para a central de gerenciamento - full width
export default function AuctionControlCenterLayout({ children }: AuctionControlCenterLayoutProps) {
  return <div className="flex h-full min-h-0 w-full flex-1 flex-col">{children}</div>;
}
