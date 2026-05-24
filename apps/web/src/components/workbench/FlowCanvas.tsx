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

    // 1. Map positions dynamically using simple grid column sorting
    const flowNodes: Node[] = graph.nodes.map((n, index) => {
      // Calculate column index based on node type
      let col = 1;
      if (n.id === graph.entry_point || n.type === 'input') {
        col = 0;
      } else if (n.type === 'tool') {
        col = 2;
      } else if (n.type === 'output') {
        col = 3;
      } else {
        // Distribute agents across columns
        col = 1 + (index % 2);
      }

      const row = Math.floor(index / 2);
      
      return {
        id: n.id,
        type: n.type === 'tool' ? 'toolNode' : 'agentNode',
        position: {
          x: 40 + col * 320,
          y: 80 + row * 220,
        },
        data: {
          ...n,
          is_active: selectedNodeId === n.id,
        },
      };
    });

    // 2. Add structural START/END nodes if they are used as sources or targets
    const edgeSources = new Set(graph.edges.map(e => e.source));
    const edgeTargets = new Set(graph.edges.map(e => e.target));

    if (edgeSources.has('START')) {
      flowNodes.push({
        id: 'START',
        type: 'agentNode',
        position: { x: 30, y: 180 },
        data: { name: 'Start', type: 'input', description: 'Flow Entry Point' }
      });
    }

    if (edgeTargets.has('END')) {
      flowNodes.push({
        id: 'END',
        type: 'agentNode',
        position: { x: 40 + 4 * 320, y: 180 },
        data: { name: 'End', type: 'output', description: 'Flow Terminal' }
      });
    }

    // 3. Map edges
    const flowEdges: Edge[] = graph.edges.map((e, idx) => ({
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
            background: 'rgba(15, 10, 25, 0.75)',
            border: '1px solid rgba(129, 140, 248, 0.2)',
            borderRadius: '6px',
            color: '#fff',
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
          color="rgba(129, 140, 248, 0.05)"
        />
      </ReactFlow>
    </div>
  );
};
export default FlowCanvas;
