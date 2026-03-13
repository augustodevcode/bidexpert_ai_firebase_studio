/**
 * @fileoverview Main Lineage tab component for the Auction Control Center.
 * Renders a ReactFlow canvas with automatic dagre layout, hover popover,
 * edit modal, theme customization panel, export functionality, and layout reset.
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type Node,
  type NodeMouseHandler,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { RotateCcw, Loader2, AlertTriangle, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { LineageNode } from './lineage/LineageNode';
import { LineageHoverCard } from './lineage/LineageHoverCard';
import { LineageEditModal } from './lineage/LineageEditModal';
import { LineageThemePanel } from './lineage/LineageThemePanel';
import { LineageExportButton } from './lineage/LineageExportButton';
import { useLineageGraph } from './lineage/useLineageGraph';
import { useLineageTheme } from './lineage/useLineageTheme';
import { fetchAuctionLineageAction } from '@/app/admin/auctions/lineage-actions';
import type { AuctionLineageData, LineageNodeData } from '@/types/auction-lineage';

interface LineageTabProps {
  auctionId: number;
}

const CANVAS_ID = 'lineage-canvas-wrapper';
const PANEL_CLASS_NAME = 'flex h-full min-h-0 w-full flex-1 flex-col';

export function LineageTab({ auctionId }: LineageTabProps) {
  const [lineageData, setLineageData] = useState<AuctionLineageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hover / Edit state
  const [hoveredNode, setHoveredNode] = useState<LineageNodeData | null>(null);
  const [hoverAnchorEl, setHoverAnchorEl] = useState<HTMLElement | null>(null);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [editNode, setEditNode] = useState<LineageNodeData | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Theme
  const { getColorScheme, setNodeColor, resetColors, overrides } = useLineageTheme();

  // Graph
  const { nodes: layoutNodes, edges: layoutEdges, onNodeDragStop, resetLayout } = useLineageGraph(lineageData);
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  // Sync layout changes
  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  // Node types registration
  const nodeTypes: NodeTypes = useMemo(
    () => ({ lineageNode: LineageNode }),
    []
  );

  // Load lineage on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchAuctionLineageAction(auctionId);
        if (!cancelled) {
          setLineageData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar linhagem');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [auctionId]);

  // Hover handlers
  const onNodeMouseEnter: NodeMouseHandler = useCallback((_event, node) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      const el = document.querySelector(`[data-id="${node.id}"]`) as HTMLElement | null;
      if (el) {
        setHoveredNode(node.data as LineageNodeData);
        setHoverAnchorEl(el);
        setHoverOpen(true);
      }
    }, 400);
  }, []);

  const onNodeMouseLeave: NodeMouseHandler = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    // Delay close to allow moving to popover
    hoverTimerRef.current = setTimeout(() => {
      setHoverOpen(false);
    }, 300);
  }, []);

  // Double click to open edit
  const onNodeDoubleClick: NodeMouseHandler = useCallback((_event, node) => {
    setHoverOpen(false);
    setEditNode(node.data as LineageNodeData);
  }, []);

  // Handle reset: resets layout + clears drag positions
  const handleResetLayout = useCallback(() => {
    resetLayout();
    // Re-trigger layout nodes
    setNodes(layoutNodes);
  }, [resetLayout, layoutNodes, setNodes]);

  // Loading state
  if (loading) {
    return (
      <Card className={PANEL_CLASS_NAME} data-ai-id="lineage-tab-loading">
        <CardContent className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando linhagem...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={PANEL_CLASS_NAME} data-ai-id="lineage-tab-error">
        <CardContent className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!lineageData || lineageData.nodes.length === 0) {
    return (
      <Card className={PANEL_CLASS_NAME} data-ai-id="lineage-tab-empty">
        <CardContent className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <GitBranch className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum dado de linhagem encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={PANEL_CLASS_NAME} data-ai-id="lineage-tab-container">
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="h-5 w-5" aria-hidden="true" />
            Linhagem — {lineageData.auctionTitle}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <LineageThemePanel
              overrides={overrides}
              onSetColor={setNodeColor}
              onReset={resetColors}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetLayout}
              data-ai-id="lineage-reset-layout-button"
              aria-label="Restaurar layout original"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Resetar Layout
            </Button>
            <LineageExportButton
              canvasSelector={`#${CANVAS_ID}`}
              fileName={`linhagem-${lineageData.auctionId}`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div
          id={CANVAS_ID}
          className="flex min-h-0 flex-1 w-full border-t"
          data-ai-id="lineage-canvas"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable
            proOptions={{ hideAttribution: true }}
            minZoom={0.2}
            maxZoom={2}
          >
            <Background gap={16} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeStrokeWidth={3}
              pannable
              zoomable
              style={{ height: 100, width: 150 }}
            />
          </ReactFlow>
        </div>

        {/* Hover popover — rendered as portal via Popover */}
        {hoverAnchorEl && (
          <LineageHoverCard
            node={hoveredNode}
            open={hoverOpen}
            onOpenChange={setHoverOpen}
          >
            <span />
          </LineageHoverCard>
        )}

        {/* Edit modal */}
        <LineageEditModal
          node={editNode}
          isOpen={!!editNode}
          onClose={() => setEditNode(null)}
        />
      </CardContent>
    </Card>
  );
}
