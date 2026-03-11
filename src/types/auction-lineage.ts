/**
 * @fileoverview Types for the Auction Lineage (value chain) visualization.
 * Defines the data structures for nodes, edges, and theme configuration
 * used by ReactFlow in the Lineage tab of the Auction Control Center.
 */

/** Possible node types in the lineage graph */
export type LineageNodeType =
  | 'auction'
  | 'seller'
  | 'auctioneer'
  | 'category'
  | 'city'
  | 'state'
  | 'lot'
  | 'stage'
  | 'habilitation'
  | 'asset'
  | 'judicial-process'
  | 'judicial-branch'
  | 'court';

/** Data payload for each lineage node */
export interface LineageNodeData {
  id: string;
  nodeType: LineageNodeType;
  label: string;
  subtitle?: string;
  status?: string;
  count?: number;
  metadata?: Record<string, string | number | boolean | null>;
  /** DB entity ID for edit/navigation */
  entityId?: bigint | number;
}

/** Complete lineage data returned from the server */
export interface AuctionLineageData {
  auctionId: number;
  auctionTitle: string;
  isJudicial: boolean;
  nodes: LineageNodeData[];
  edges: LineageEdge[];
}

/** Edge definition for ReactFlow */
export interface LineageEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/** Color scheme for a lineage node type */
export interface LineageNodeColorScheme {
  bg: string;
  border: string;
  text: string;
  iconColor: string;
}

/** Full theme config for lineage visualization */
export interface LineageThemeConfig {
  id: string;
  name: string;
  colors: Record<LineageNodeType, LineageNodeColorScheme>;
}

/** Props for the LineageNode ReactFlow custom component */
export interface LineageNodeProps {
  data: LineageNodeData;
  selected?: boolean;
}
