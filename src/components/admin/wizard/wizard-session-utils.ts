import type { Asset } from '@/types';

function toStableId(value: unknown): string {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return `${value ?? ''}`;
}

export function appendSessionAssetId(currentIds: string[] | undefined, assetId?: string): string[] {
  if (!assetId) {
    return currentIds ?? [];
  }

  const nextIds = new Set((currentIds ?? []).map(toStableId));
  nextIds.add(toStableId(assetId));
  return Array.from(nextIds);
}

export function getSessionScopedAssets(availableAssets: Asset[], sessionAssetIds?: string[]): Asset[] {
  if (!sessionAssetIds || sessionAssetIds.length === 0) {
    return availableAssets;
  }

  const allowedIds = new Set(sessionAssetIds.map(toStableId));
  return availableAssets.filter((asset) => allowedIds.has(toStableId(asset.id)));
}