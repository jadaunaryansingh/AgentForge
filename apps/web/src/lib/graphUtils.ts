import { GraphDefinition, NodeDefinition } from '../types/project';

/** Align API graph JSON with UI expectations (model_config vs model_config_data). */
export const normalizeGraphDefinition = (graph: GraphDefinition | null | undefined): GraphDefinition | null => {
  if (!graph) return null;

  const nodes: NodeDefinition[] = (graph.nodes || []).map((node, index) => {
    const modelConfig = node.model_config_data || (node as NodeDefinition & { model_config?: Record<string, unknown> }).model_config;
    return {
      ...node,
      id: node.id || `node_${index}`,
      name: node.name || node.id,
      type: node.type || 'agent',
      description: node.description || '',
      tools: node.tools || [],
      system_prompt: node.system_prompt || '',
      model_config_data: modelConfig || {},
    };
  });

  return {
    ...graph,
    nodes,
    edges: graph.edges || [],
    entry_point: graph.entry_point || nodes[0]?.id || '',
    state_schema: graph.state_schema || {},
    memory_type: graph.memory_type || 'thread',
  };
};

export const normalizeArchitecture = <T extends { graph_definition?: GraphDefinition | null }>(arch: T): T => {
  if (!arch.graph_definition) return arch;
  return {
    ...arch,
    graph_definition: normalizeGraphDefinition(arch.graph_definition) ?? arch.graph_definition,
  };
};
