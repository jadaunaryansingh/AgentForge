import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { GraphDefinition, NodeDefinition } from '../../context/ProjectContext';
import { AgentNode } from './AgentNode';
import { ToolNode } from './ToolNode';
import { RouterNode } from './RouterNode';
import { EdgeAnimated } from './EdgeAnimated';

interface FlowCanvasProps {
  graph: GraphDefinition;
  selectedNodeId: string | null;
  onSelectNode: (node: NodeDefinition) => void;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({ graph, selectedNodeId, onSelectNode }) => {
  // Register custom node types
  const nodeTypes = useMemo(
    () => ({
      agentNode: AgentNode,
      toolNode: ToolNode,
      routerNode: RouterNode,
    }),
    []
  );

  // Register custom edge types
  const edgeTypes = useMemo(
    () => ({
      animated: EdgeAnimated,
    }),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Re-generate nodes and edges whenever graph definition shifts
  useEffect(() => {
    if (!graph || !graph.nodes) return;

    // Column x-positions for a left-to-right flow layout
    const COL_X: Record<number, number> = {
      0: 40,    // START / entry
      1: 360,   // primary agents / routers (left lane)
      2: 680,   // secondary agents / routers (right lane)
      3: 1000,  // tools
      4: 1320,  // END / output
    };
    const COL_Y_STEP = 220;
    const COL_Y_START = 80;
    // Track how many nodes have been placed in each column
    const colRowCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

    type RawNode = string | { id?: string; name?: string; type?: string; description?: string; model_config_data?: Record<string, unknown>; model_config?: Record<string, unknown>; tools?: string[] };
    type RawEdge = { source: string; target: string; label?: string; condition?: string };

    const assignCol = (n: RawNode, index: number): number => {
      const id = typeof n === 'string' ? n : (n.id || '');
      const type = (typeof n === 'string' ? 'agent' : (n.type || 'agent')).toLowerCase();
      if (id === graph.entry_point || type === 'input') return 0;
      if (type === 'output') return 4;
      if (type === 'tool') return 3;
      return index % 2 === 0 ? 1 : 2;
    };

    const flowNodes: Node[] = (graph.nodes as RawNode[]).map((n: RawNode, index: number) => {
      const id = typeof n === 'string' ? n : (n.id || `node-${index}`);
      const name = typeof n === 'string' ? n : (n.name || n.id || `Node ${index}`);
      const type = (typeof n === 'string' ? 'agent' : (n.type || 'agent')).toLowerCase();
      const description = typeof n === 'string' ? '' : (n.description || '');

      const col = assignCol(n, index);
      const row = colRowCount[col] ?? 0;
      colRowCount[col] = row + 1;

      const x = Number(COL_X[col] ?? 40);
      const y = Number(COL_Y_START + row * COL_Y_STEP);

      const flowType =
        type === 'tool' ? 'toolNode' : type === 'router' ? 'routerNode' : 'agentNode';

      return {
        id,
        type: flowType,
        position: { x, y },
        data: {
          id,
          name,
          type,
          description,
          model_config_data: typeof n === 'string' ? {} : (n.model_config_data || n.model_config || {}),
          tools: typeof n === 'string' ? [] : (n.tools || []),
          is_active: selectedNodeId === id,
        },
      };
    });

    // Add structural START/END nodes if referenced in edges
    const edgeSources = new Set(graph.edges.map((e) => e.source));
    const edgeTargets = new Set(graph.edges.map((e) => e.target));

    if (edgeSources.has('START')) {
      const row = colRowCount[0] ?? 0;
      colRowCount[0] = row + 1;
      flowNodes.push({
        id: 'START',
        type: 'agentNode',
        position: { x: Number(COL_X[0]), y: Number(COL_Y_START + row * COL_Y_STEP) },
        data: { name: 'Start', type: 'input', description: 'Flow Entry Point' },
      });
    }

    if (edgeTargets.has('END')) {
      const row = colRowCount[4] ?? 0;
      colRowCount[4] = row + 1;
      flowNodes.push({
        id: 'END',
        type: 'agentNode',
        position: { x: Number(COL_X[4]), y: Number(COL_Y_START + row * COL_Y_STEP) },
        data: { name: 'End', type: 'output', description: 'Flow Terminal' },
      });
    }

    // Map edges — guard source/target against undefined
    const flowEdges: Edge[] = (graph.edges as RawEdge[])
      .filter((e: RawEdge) => e.source && e.target)
      .map((e: RawEdge, idx: number) => ({
        id: `edge-${e.source}-${e.target}-${idx}`,
        source: e.source,
        target: e.target,
        type: 'animated',
        label: e.label || e.condition,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: '#4f46e5',
        },
      }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [graph, selectedNodeId]);

  // Handle click node event
  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    // START/END terminal blocks are not inspectable details
    if (node.id === 'START' || node.id === 'END') return;
    
    // Find matching NodeDefinition from graph list
    const nodeDef = graph.nodes.find(n => n.id === node.id);
    if (nodeDef) {
      onSelectNode(nodeDef);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        maxZoom={1.5}
        minZoom={0.5}
      >
        <Controls 
          position="bottom-left" 
          showZoom={true} 
          showFitView={true} 
          showInteractive={false} 
          style={{
            background: '#ffffff',
            border: '1.5px solid rgba(99, 102, 241, 0.15)',
            borderRadius: '10px',
            boxShadow: '0 2px 12px rgba(99,102,241,0.1)',
            display: 'flex',
            flexDirection: 'row',
            gap: '2px',
            padding: '2px',
          }}
        />
        <Background
          variant={BackgroundVariant.Lines}
          gap={40}
          size={0.8}
          color="rgba(99, 102, 241, 0.07)"
        />
      </ReactFlow>
    </div>
  );
};
export default FlowCanvas;
