// src/app/admin/auctions/[auctionId]/auction-control-center/layout.tsx
import type { ReactNode } from 'react';

interface AuctionControlCenterLayoutProps {
  children: ReactNode;
}

// Layout especial para a central de gerenciamento - full width
export default function AuctionControlCenterLayout({ children }: AuctionControlCenterLayoutProps) {
  return <div className="w-full">{children}</div>;
}
