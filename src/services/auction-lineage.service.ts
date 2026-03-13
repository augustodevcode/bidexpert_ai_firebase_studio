/**
 * @fileoverview Service for building the auction lineage (value chain) graph data.
 * Queries all related entities of an auction and transforms them into
 * LineageNodeData[] and LineageEdge[] for ReactFlow visualization.
 */

import { prisma } from '@/lib/prisma';
import type {
  AuctionLineageData,
  LineageNodeData,
  LineageEdge,
} from '@/types/auction-lineage';

/**
 * Builds the complete lineage graph for a given auction.
 * Fetches auction with all related entities and converts to node/edge format.
 */
export async function getAuctionLineage(
  auctionId: bigint | number,
  tenantId: bigint | number
): Promise<AuctionLineageData> {
  const auction = await prisma.auction.findFirst({
    where: {
      id: BigInt(auctionId),
      tenantId: BigInt(tenantId),
    },
    include: {
      Seller: true,
      Auctioneer: true,
      LotCategory: true,
      City: { include: { State: true } },
      State: true,
      JudicialProcess: {
        include: {
          JudicialBranch: true,
          Court: true,
        },
      },
      AuctionStage: true,
      AuctionHabilitation: {
        include: { User: { select: { id: true, fullName: true, email: true } } },
      },
      Lot: {
        include: {
          LotCategory: true,
          Subcategory: true,
          AssetsOnLots: {
            include: {
              Asset: { select: { id: true, publicId: true, title: true, status: true } },
            },
          },
        },
      },
    },
  });

  if (!auction) {
    return {
      auctionId: Number(auctionId),
      auctionTitle: '',
      isJudicial: false,
      nodes: [],
      edges: [],
    };
  }

  const nodes: LineageNodeData[] = [];
  const edges: LineageEdge[] = [];

  // Root: Auction node
  const auctionNodeId = `auction-${auction.id}`;
  nodes.push({
    id: auctionNodeId,
    nodeType: 'auction',
    label: auction.title,
    subtitle: auction.status,
    status: auction.status,
    entityId: Number(auction.id),
  });

  // Seller
  if (auction.Seller) {
    const nodeId = `seller-${auction.Seller.id}`;
    nodes.push({
      id: nodeId,
      nodeType: 'seller',
      label: auction.Seller.name,
      subtitle: auction.Seller.isJudicial ? 'Judicial' : 'Extrajudicial',
      entityId: Number(auction.Seller.id),
    });
    edges.push({ id: `e-${auctionNodeId}-${nodeId}`, source: auctionNodeId, target: nodeId, label: 'Vendedor' });
  }

  // Auctioneer
  if (auction.Auctioneer) {
    const nodeId = `auctioneer-${auction.Auctioneer.id}`;
    nodes.push({
      id: nodeId,
      nodeType: 'auctioneer',
      label: auction.Auctioneer.name,
      subtitle: auction.Auctioneer.registrationNumber || undefined,
      entityId: Number(auction.Auctioneer.id),
    });
    edges.push({ id: `e-${auctionNodeId}-${nodeId}`, source: auctionNodeId, target: nodeId, label: 'Leiloeiro' });
  }

  // Category
  if (auction.LotCategory) {
    const nodeId = `category-${auction.LotCategory.id}`;
    nodes.push({
      id: nodeId,
      nodeType: 'category',
      label: auction.LotCategory.name,
      entityId: Number(auction.LotCategory.id),
    });
    edges.push({ id: `e-${auctionNodeId}-${nodeId}`, source: auctionNodeId, target: nodeId, label: 'Categoria' });
  }

  // City/State
  if (auction.City) {
    const cityNodeId = `city-${auction.City.id}`;
    nodes.push({
      id: cityNodeId,
      nodeType: 'city',
      label: auction.City.name,
      entityId: Number(auction.City.id),
    });
    edges.push({ id: `e-${auctionNodeId}-${cityNodeId}`, source: auctionNodeId, target: cityNodeId, label: 'Cidade' });

    if (auction.City.State) {
      const stateNodeId = `state-${auction.City.State.id}`;
      if (!nodes.find(n => n.id === stateNodeId)) {
        nodes.push({
          id: stateNodeId,
          nodeType: 'state',
          label: `${auction.City.State.name} (${auction.City.State.uf})`,
          entityId: Number(auction.City.State.id),
        });
      }
      edges.push({ id: `e-${cityNodeId}-${stateNodeId}`, source: cityNodeId, target: stateNodeId, label: 'Estado' });
    }
  } else if (auction.State) {
    const stateNodeId = `state-${auction.State.id}`;
    if (!nodes.find(n => n.id === stateNodeId)) {
      nodes.push({
        id: stateNodeId,
        nodeType: 'state',
        label: `${auction.State.name} (${auction.State.uf})`,
        entityId: Number(auction.State.id),
      });
    }
    edges.push({ id: `e-${auctionNodeId}-${stateNodeId}`, source: auctionNodeId, target: stateNodeId, label: 'Estado' });
  }

  // Judicial Process (only when present)
  const isJudicial = !!auction.JudicialProcess;
  if (auction.JudicialProcess) {
    const jp = auction.JudicialProcess;
    const jpNodeId = `judicial-process-${jp.id}`;
    nodes.push({
      id: jpNodeId,
      nodeType: 'judicial-process',
      label: jp.processNumber,
      subtitle: jp.actionType || undefined,
      entityId: Number(jp.id),
    });
    edges.push({ id: `e-${auctionNodeId}-${jpNodeId}`, source: auctionNodeId, target: jpNodeId, label: 'Processo Judicial' });

    if (jp.JudicialBranch) {
      const branchNodeId = `judicial-branch-${jp.JudicialBranch.id}`;
      nodes.push({
        id: branchNodeId,
        nodeType: 'judicial-branch',
        label: jp.JudicialBranch.name,
        entityId: Number(jp.JudicialBranch.id),
      });
      edges.push({ id: `e-${jpNodeId}-${branchNodeId}`, source: jpNodeId, target: branchNodeId, label: 'Vara' });
    }

    if (jp.Court) {
      const courtNodeId = `court-${jp.Court.id}`;
      nodes.push({
        id: courtNodeId,
        nodeType: 'court',
        label: jp.Court.name,
        entityId: Number(jp.Court.id),
      });
      edges.push({ id: `e-${jpNodeId}-${courtNodeId}`, source: jpNodeId, target: courtNodeId, label: 'Tribunal' });
    }
  }

  // Stages
  for (const stage of auction.AuctionStage) {
    const stageNodeId = `stage-${stage.id}`;
    nodes.push({
      id: stageNodeId,
      nodeType: 'stage',
      label: stage.name,
      status: stage.status,
      subtitle: stage.status,
      entityId: Number(stage.id),
    });
    edges.push({ id: `e-${auctionNodeId}-${stageNodeId}`, source: auctionNodeId, target: stageNodeId, label: 'Praça' });
  }

  // Habilitations (grouped as count node)
  if (auction.AuctionHabilitation.length > 0) {
    const habNodeId = `habilitation-group`;
    nodes.push({
      id: habNodeId,
      nodeType: 'habilitation',
      label: 'Habilitações',
      count: auction.AuctionHabilitation.length,
      subtitle: `${auction.AuctionHabilitation.length} habilitados`,
    });
    edges.push({ id: `e-${auctionNodeId}-${habNodeId}`, source: auctionNodeId, target: habNodeId, label: 'Habilitações' });
  }

  // Lots and their assets
  for (const lot of auction.Lot) {
    const lotNodeId = `lot-${lot.id}`;
    nodes.push({
      id: lotNodeId,
      nodeType: 'lot',
      label: lot.title,
      subtitle: `Lote ${lot.number || ''}`,
      status: lot.status,
      entityId: Number(lot.id),
      metadata: {
        price: lot.price ? Number(lot.price) : null,
      },
    });
    edges.push({ id: `e-${auctionNodeId}-${lotNodeId}`, source: auctionNodeId, target: lotNodeId, label: `Lote ${lot.number || ''}` });

    // Assets in lot
    for (const aol of lot.AssetsOnLots) {
      const assetNodeId = `asset-${aol.Asset.id}`;
      if (!nodes.find(n => n.id === assetNodeId)) {
        nodes.push({
          id: assetNodeId,
          nodeType: 'asset',
          label: aol.Asset.title,
          status: aol.Asset.status,
          subtitle: aol.Asset.publicId,
          entityId: Number(aol.Asset.id),
        });
      }
      edges.push({ id: `e-${lotNodeId}-${assetNodeId}`, source: lotNodeId, target: assetNodeId, label: 'Ativo' });
    }
  }

  return {
    auctionId: Number(auction.id),
    auctionTitle: auction.title,
    isJudicial,
    nodes,
    edges,
  };
}
