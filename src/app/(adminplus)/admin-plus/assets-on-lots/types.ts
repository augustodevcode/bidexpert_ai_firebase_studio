/**
 * Row type for AssetsOnLots junction entity.
 * Composite key: lotId + assetId.
 */
export interface AssetsOnLotsRow {
  lotId: string;
  lotTitle: string;
  assetId: string;
  assetTitle: string;
  assignedAt: string;
  assignedBy: string;
}
