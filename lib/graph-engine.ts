import { FunnelDefinition, FlowNode, FlowEdge } from '../types';

export class GraphEngine {
  definition: FunnelDefinition;
  currentNodeId: string | null = null;
  history: string[] = []; // Node ID history
  variables: Record<string, any> = {};

  constructor(definition: FunnelDefinition) {
    this.definition = definition;
    this.currentNodeId = definition.startNodeId || 'start';
    
    // Normalize Graph if needed (Legacy Support handled externally or here?)
    // Assuming definition is already normalized or we use legacy fallback logic
  }

  public start(): FlowNode | null {
    if (!this.definition.nodes || this.definition.nodes.length === 0) {
      // Legacy Fallback: If no nodes, we can't start a graph execution.
      // The App.tsx should handle legacy conversion before initializing engine
      return null;
    }

    // Find start node
    let startNode = this.definition.nodes.find(n => n.id === this.definition.startNodeId);
    
    // Fallback to 'start' id if defined
    if (!startNode) {
        startNode = this.definition.nodes.find(n => n.type === 'start' || n.id === 'start');
    }

    // Fallback to first node if no start found (unsafe but practical)
    if (!startNode && this.definition.nodes.length > 0) {
        startNode = this.definition.nodes[0];
    }

    this.currentNodeId = startNode?.id || null;
    return startNode || null;
  }

  public getCurrentNode(): FlowNode | null {
    if (!this.currentNodeId) return null;
    return this.definition.nodes?.find(n => n.id === this.currentNodeId) || null;
  }

  public next(output?: string): FlowNode | null {
    if (!this.currentNodeId) return null;
    const allEdges = this.definition.edges || [];

    // Find edges originating from current node
    const edges = allEdges.filter(e => e.source === this.currentNodeId);

    const getNodeType = (nodeId: string) => this.definition.nodes?.find((n) => n.id === nodeId)?.type || null;
    const currentType = getNodeType(this.currentNodeId);
    const isConfigNode = (t: string | null) => t === 'doctor' || t === 'config-audio';

    if (edges.length === 0) {
      if (isConfigNode(currentType)) {
        const startId = this.definition.startNodeId || 'start';
        const startEdges = allEdges.filter((e) => e.source === startId);
        const candidate = startEdges.find((e) => !isConfigNode(getNodeType(e.target))) || startEdges[0];
        if (candidate) {
          this.currentNodeId = candidate.target;
          this.history.push(this.currentNodeId);
          return this.getCurrentNode();
        }
      }
      const current = this.getCurrentNode();
      const currentPosY = (current as any)?.position?.y;
      const currentPosX = (current as any)?.position?.x;
      const hasPos = Number.isFinite(currentPosY) && Number.isFinite(currentPosX);
      const sorted = (this.definition.nodes || [])
        .filter((n) => !isConfigNode(n.type))
        .slice()
        .sort((a: any, b: any) => (a.position?.y ?? 0) - (b.position?.y ?? 0) || (a.position?.x ?? 0) - (b.position?.x ?? 0));

      if (!hasPos) return null;
      const idx = sorted.findIndex((n) => n.id === this.currentNodeId);
      if (idx !== -1 && sorted[idx + 1]) {
        this.currentNodeId = sorted[idx + 1].id;
        this.history.push(this.currentNodeId);
        return this.getCurrentNode();
      }

      return null;
    }

    let targetEdge: FlowEdge | undefined;

    if (output) {
      // Try to match specific handle or label (conditional logic)
      // Assuming 'output' matches 'sourceHandle' or 'label'
      targetEdge = edges.find(e => e.sourceHandle === output || e.label === output);
    }

    // Fallback to default edge (first one or unlabelled)
    if (!targetEdge) {
        const preferred = edges.find((e) => !isConfigNode(getNodeType(e.target)));
        targetEdge = preferred || edges[0];
    }

    if (targetEdge) {
        this.currentNodeId = targetEdge.target;
        this.history.push(this.currentNodeId);
        return this.getCurrentNode();
    }

    return null;
  }

  public setVariable(key: string, value: any) {
    this.variables[key] = value;
  }

  public getVariable(key: string) {
    return this.variables[key];
  }
}
