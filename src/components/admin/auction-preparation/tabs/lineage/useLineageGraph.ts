/**
 * @fileoverview Hook for building and managing the ReactFlow graph from lineage data.
 * Uses dagre for automatic vertical bottom-to-top layout, supporting drag and
 * reset layout functionality.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Node, Edge } from 'reactflow';
import dagre from 'dagre';
import type { AuctionLineageData, LineageNodeData } from '@/types/auction-lineage';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 90;

/** Applies dagre auto-layout to a set of nodes/edges, bottom-to-top */
function applyDagreLayout(
  nodes: Node<LineageNodeData>[],
  edges: Edge[]
): Node<LineageNodeData>[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80, marginx: 20, marginy: 20 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });
}

/** Converts lineage data to ReactFlow nodes and edges with layout */
export function useLineageGraph(lineageData: AuctionLineageData | null) {
  const [draggedPositions, setDraggedPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const { layoutNodes, rfEdges } = useMemo(() => {
    if (!lineageData || lineageData.nodes.length === 0) {
      return { layoutNodes: [], rfEdges: [] };
    }

    const rawNodes: Node<LineageNodeData>[] = lineageData.nodes.map((n) => ({
      id: n.id,
      type: 'lineageNode',
      data: n,
      position: { x: 0, y: 0 },
      draggable: true,
    }));

    const rawEdges: Edge[] = lineageData.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: 'smoothstep',
      animated: false,
      style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
      labelBgStyle: { fill: 'hsl(var(--background))', fillOpacity: 0.8 },
    }));

    const arranged = applyDagreLayout(rawNodes, rawEdges);
    return { layoutNodes: arranged, rfEdges: rawEdges };
  }, [lineageData]);

  // Merge dragged positions with layout
  const nodes = useMemo(() => {
    return layoutNodes.map((node) => {
      const dragPos = draggedPositions[node.id];
      return dragPos ? { ...node, position: dragPos } : node;
    });
  }, [layoutNodes, draggedPositions]);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node<LineageNodeData>) => {
      setDraggedPositions((prev) => ({
        ...prev,
        [node.id]: node.position,
      }));
    },
    []
  );

  const resetLayout = useCallback(() => {
    setDraggedPositions({});
  }, []);

  return {
    nodes,
    edges: rfEdges,
    onNodeDragStop,
    resetLayout,
  };
}
