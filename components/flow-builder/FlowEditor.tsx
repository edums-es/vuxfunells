import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  NodeMouseHandler,
  ReactFlowInstance,
  NodeChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '../../lib/utils';
import { FunnelDefinition } from '../../types';
import { FlowToolbar } from './FlowToolbar';
import { nodeTypes } from './CustomNodes';

// Wrapper component to provide ReactFlow context
export const FlowEditor: React.FC<{
  funnelDefinition: FunnelDefinition;
  onSave: (def: FunnelDefinition) => void;
  onNodeClick?: (type: string, data: any, id: string) => void;
  onAddNode?: (type: string, data: any, position?: { x: number, y: number }) => void;
  onRegisterGetDefinition?: (getDef: (() => FunnelDefinition) | null) => void;
}> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowEditorContent {...props} />
    </ReactFlowProvider>
  );
};

const FlowEditorContent: React.FC<{
  funnelDefinition: FunnelDefinition;
  onSave: (def: FunnelDefinition) => void;
  onNodeClick?: (type: string, data: any, id: string) => void;
  onAddNode?: (type: string, data: any, position?: { x: number, y: number }) => void;
  onRegisterGetDefinition?: (getDef: (() => FunnelDefinition) | null) => void;
}> = ({ funnelDefinition, onSave, onNodeClick, onAddNode, onRegisterGetDefinition }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const latestRef = useRef<{ funnelDefinition: FunnelDefinition; nodes: Node[]; edges: Edge[] }>({
    funnelDefinition,
    nodes: [],
    edges: []
  });

  useEffect(() => {
    latestRef.current = { funnelDefinition, nodes, edges };
  }, [funnelDefinition, nodes, edges]);

  useEffect(() => {
    if (!onRegisterGetDefinition) return;
    const getDef = () => {
      const latest = latestRef.current;
      return {
        ...latest.funnelDefinition,
        nodes: latest.nodes as any,
        edges: latest.edges as any,
        layout: latest.nodes.reduce((acc, n) => ({ ...acc, [n.id]: n.position }), {})
      };
    };
    onRegisterGetDefinition(getDef);
    return () => onRegisterGetDefinition(null);
  }, [onRegisterGetDefinition]);

  // Helper to get position from layout or default
  const getPosition = (id: string, defaultX: number, defaultY: number) => {
      if (funnelDefinition.layout && funnelDefinition.layout[id]) {
          return funnelDefinition.layout[id];
      }
      return { x: defaultX, y: defaultY };
  };

  // Helper to check if node should be visible (if layout exists, must be in layout, otherwise default)
  // If we are in "Free Mode" (layout exists), we only show nodes that are in layout or explicitly added.
  // Exception: Start Node and Configs are always shown?
  const shouldShowNode = (id: string, isEssential = false) => {
      // If we are using the new Graph Mode (nodes exist), we rely on the nodes array, not this helper.
      if (funnelDefinition.nodes && funnelDefinition.nodes.length > 0) return true;

      if (!funnelDefinition.layout) return true; // Legacy mode: show all
      if (isEssential) return true;
      return !!funnelDefinition.layout[id];
  };

  // Função para converter FunnelDefinition em Nodes e Edges
  const generateGraph = useCallback(() => {
      // 1. New Graph Mode: Use stored nodes/edges directly
      if (funnelDefinition.nodes && funnelDefinition.nodes.length > 0) {
          return { 
              nodes: funnelDefinition.nodes as Node[], 
              edges: (funnelDefinition.edges || []) as Edge[] 
          };
      }

      // 2. Check if it's a completely new/empty funnel
      const hasLegacyContent = (funnelDefinition.chat.part1 && funnelDefinition.chat.part1.length > 0) || 
                               (funnelDefinition.chat.part2 && funnelDefinition.chat.part2.length > 0) ||
                               funnelDefinition.incomingCall?.duration > 0 ||
                               funnelDefinition.videoCall?.duration > 0;

      if (!hasLegacyContent) {
          // Initialize with just a Start Node for new funnels
          return {
              nodes: [{
                  id: 'start',
                  type: 'start',
                  data: { label: 'Início do Tráfego' },
                  position: { x: 400, y: 300 }
              }],
              edges: []
          };
      }

      // 3. Legacy Migration Mode (Existing funnels without nodes)
      const initialNodes: Node[] = [];
      const initialEdges: Edge[] = [];
      let yPos = 50;
      const xPos = 400;

      // 1. Nó de Início (Start) - Always Mandatory
      initialNodes.push({
          id: 'start',
          type: 'start',
          data: { label: 'Início do Tráfego' },
          position: getPosition('start', xPos, yPos),
      });
      yPos += 120;

      // 2. Configurações Globais (Doctor & Audio)
      if (shouldShowNode('config-doctor')) {
          initialNodes.push({
              id: 'config-doctor',
              type: 'doctor',
              data: {
                label: funnelDefinition.doctor.name,
                name: funnelDefinition.doctor.name,
                role: funnelDefinition.doctor.role,
                avatarUrl: funnelDefinition.doctor.avatarUrl,
                wallpaperUrl: funnelDefinition.doctor.wallpaperUrl,
                preview: true
              },
              position: getPosition('config-doctor', xPos - 220, yPos),
          });
      }
      
      if (shouldShowNode('config-audio')) {
          initialNodes.push({
              id: 'config-audio',
              type: 'config-audio',
              data: {
                label: 'Configurações de Áudio',
                backgroundMusicUrl: funnelDefinition.audio?.backgroundMusicUrl || '',
                backgroundMusicVolume: funnelDefinition.audio?.backgroundMusicVolume ?? 0.1,
                messageSoundEnabled: funnelDefinition.audio?.messageSoundEnabled ?? true,
                loop: funnelDefinition.audio?.loop ?? true
              },
              position: getPosition('config-audio', xPos + 220, yPos),
          });
      }

      // Conecta Start às configs (apenas visual, lógica é global)
      // Only generate these edges if we are in legacy mode (no layout)
      if (!funnelDefinition.edges && !funnelDefinition.layout) {
          initialEdges.push({ id: 'e-start-doctor', source: 'start', target: 'config-doctor', animated: true, style: { stroke: '#4b5563', strokeDasharray: '5,5' } });
          initialEdges.push({ id: 'e-start-audio', source: 'start', target: 'config-audio', animated: true, style: { stroke: '#4b5563', strokeDasharray: '5,5' } });
      }

      yPos += 150;

      // 3. Incoming Call
      if (shouldShowNode('step-incoming-call')) {
          initialNodes.push({
              id: 'step-incoming-call',
              type: 'incoming-call',
              data: { label: 'Tela de Chamada', content: `Duração: ${funnelDefinition.incomingCall?.duration || 0}s` },
              position: getPosition('step-incoming-call', xPos, yPos),
          });
          if (!funnelDefinition.edges) {
             initialEdges.push({ id: 'e-start-incoming', source: 'start', target: 'step-incoming-call', animated: true });
          }
      }
      
      yPos += 180;

      // 4. Chat Part 1
      let lastNodeId = shouldShowNode('step-incoming-call') ? 'step-incoming-call' : 'start'; // Default link if legacy
      
      funnelDefinition.chat.part1.forEach((msg, idx) => {
          // Try to use stable ID if possible (we will patch AdminFunnels to use ID)
          // For legacy compatibility, check if msg.id exists
          const nodeId = msg.id || `msg-p1-${idx}`;
          
          if (shouldShowNode(nodeId, !funnelDefinition.layout)) { // Show if legacy or in layout
            const contentPreview = msg.content ? (msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content) : '[Mídia]';
            initialNodes.push({
                id: nodeId,
                type: 'chat-message',
                data: { 
                    label: msg.sender === 'doctor' ? 'Doutora' : 'Usuário',
                    content: msg.content, // FIX: Use full content for data, only preview for UI if needed in custom node
                    previewText: contentPreview, // New field for UI preview
                    icon: msg.type === 'audio' ? 'Mic' : (msg.type === 'video' ? 'Video' : 'MessageSquare'),
                    fullMessage: msg,
                    part: 'part1',
                    index: idx
                },
                position: getPosition(nodeId, xPos, yPos),
            });
            if (!funnelDefinition.edges) {
                initialEdges.push({ id: `e-${lastNodeId}-${nodeId}`, source: lastNodeId, target: nodeId });
            }
            lastNodeId = nodeId;
            yPos += 140;
          }
      });

      // 5. Video Call
      const videoNodeId = 'step-video-call';
      const hasVideoConfig = (funnelDefinition.videoCall?.duration || 0) > 0 || !!funnelDefinition.videoCall?.videoUrl;
      
      if (shouldShowNode(videoNodeId) && hasVideoConfig) {
          initialNodes.push({
              id: videoNodeId,
              type: 'video-call',
              data: { label: 'Chamada de Vídeo (VSL)', content: `Duração: ${funnelDefinition.videoCall?.duration || 0}s` },
              position: getPosition(videoNodeId, xPos, yPos),
          });
          if (!funnelDefinition.edges) {
             initialEdges.push({ id: `e-${lastNodeId}-${videoNodeId}`, source: lastNodeId, target: videoNodeId, animated: true, label: 'Atender' });
          }
          lastNodeId = videoNodeId;
      }
      yPos += 180;

      // 6. Chat Part 2
      funnelDefinition.chat.part2.forEach((msg, idx) => {
          const nodeId = msg.id || `msg-p2-${idx}`;
          
          if (shouldShowNode(nodeId, !funnelDefinition.layout)) {
            const contentPreview = msg.content ? (msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content) : '[Mídia]';
            initialNodes.push({
                id: nodeId,
                type: 'chat-message',
                data: { 
                    label: msg.sender === 'doctor' ? 'Doutora' : 'Usuário',
                    content: msg.content, // FIX: Use full content
                    previewText: contentPreview,
                    icon: msg.type === 'audio' ? 'Mic' : (msg.type === 'video' ? 'Video' : 'MessageSquare'),
                    fullMessage: msg,
                    part: 'part2',
                    index: idx
                },
                position: getPosition(nodeId, xPos, yPos),
            });
            if (!funnelDefinition.edges) {
                initialEdges.push({ id: `e-${lastNodeId}-${nodeId}`, source: lastNodeId, target: nodeId });
            }
            lastNodeId = nodeId;
            yPos += 140;
          }
      });

      // 7. Reviews
      const reviewsId = 'step-reviews';
      if (shouldShowNode(reviewsId)) {
          initialNodes.push({
              id: reviewsId,
              type: 'reviews',
              data: { label: 'Reviews', content: `${funnelDefinition.reviews.items.length} avaliações cadastradas` },
              position: getPosition(reviewsId, xPos, yPos),
          });
          if (!funnelDefinition.edges) {
             initialEdges.push({ id: `e-${lastNodeId}-${reviewsId}`, source: lastNodeId, target: reviewsId, animated: true });
          }
          lastNodeId = reviewsId;
      }
      yPos += 180;

      // 8. Checkout
      const checkoutId = 'step-checkout';
      if (shouldShowNode(checkoutId)) {
          initialNodes.push({
              id: checkoutId,
              type: 'checkout',
              data: { label: 'Checkout', content: `Produto: ${funnelDefinition.checkout.productName} - ${funnelDefinition.checkout.price}` },
              position: getPosition(checkoutId, xPos, yPos),
          });
          if (!funnelDefinition.edges) {
             initialEdges.push({ id: `e-${lastNodeId}-${checkoutId}`, source: lastNodeId, target: checkoutId, animated: true });
          }
          lastNodeId = checkoutId;
      }
      yPos += 180;

      // 9. Upsell
      const upsellId = 'step-upsell';
      if (shouldShowNode(upsellId)) {
          initialNodes.push({
              id: upsellId,
              type: 'upsell',
              data: { label: 'Upsell / Downsell', content: `${funnelDefinition.offers.upsells.length} upsells, ${funnelDefinition.offers.downsells.length} downsells` },
              position: getPosition(upsellId, xPos, yPos),
          });
          if (!funnelDefinition.edges) {
             initialEdges.push({ id: `e-${lastNodeId}-${upsellId}`, source: lastNodeId, target: upsellId, animated: true });
          }
      }

      // USE STORED EDGES IF AVAILABLE
      const finalEdges = funnelDefinition.edges && funnelDefinition.edges.length > 0 
          ? funnelDefinition.edges 
          : initialEdges;

      return { nodes: initialNodes, edges: finalEdges };
  }, [funnelDefinition]);

  // Initial load
  useEffect(() => {
     const { nodes: newNodes, edges: newEdges } = generateGraph();
     
     setNodes((currentNodes) => {
         // If we are in Graph Mode, strictly follow definition
         if (funnelDefinition.nodes && funnelDefinition.nodes.length > 0) {
             return funnelDefinition.nodes as Node[];
         }

         if (currentNodes.length === 0) {
             // MIGRATION: If we generated nodes but definition doesn't have them, SAVE THEM.
             // This ensures AdminFunnels receives the full graph structure immediately.
             if ((!funnelDefinition.nodes || funnelDefinition.nodes.length === 0) && newNodes.length > 0) {
                 setTimeout(() => {
                     onSave({
                         ...funnelDefinition,
                         nodes: newNodes as any,
                         edges: newEdges as any,
                         layout: newNodes.reduce((acc, n) => ({ ...acc, [n.id]: n.position }), {})
                     });
                 }, 50);
             }
             return newNodes;
         }

         return newNodes.map(newNode => {
             const existingNode = currentNodes.find(n => n.id === newNode.id);
             
             if (existingNode) {
                 const layoutPos = funnelDefinition.layout?.[newNode.id];
                 if (layoutPos) {
                     return { ...newNode, position: layoutPos };
                 }
                 return { ...newNode, position: existingNode.position };
             }
             return newNode;
         });
     });
     
     setEdges((currentEdges) => {
         if (funnelDefinition.edges && funnelDefinition.edges.length > 0) {
             return funnelDefinition.edges as Edge[];
         }
         if (currentEdges.length === 0) return newEdges;
         return currentEdges; 
     });

  }, [generateGraph, funnelDefinition.layout, funnelDefinition.edges, funnelDefinition.nodes, onSave]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
        setNodes((nds) => {
            const updated = applyNodeChanges(changes, nds);
            // Detect deletions to save immediately
            const hasDeletion = changes.some(c => c.type === 'remove');
            if (hasDeletion) {
                // We need to schedule a save. Since we can't call onSave in reducer, use effect or timeout?
                // Better: Trigger a save effect via a flag or just use the debounced effect below.
            }
            return updated;
        });
    },
    [],
  );

  // Unified Debounced Save
  useEffect(() => {
      // Skip initial load or empty state
      if (nodes.length === 0) return;

      const timer = setTimeout(() => {
          const currentDefNodes = funnelDefinition.nodes || [];
          const currentDefEdges = funnelDefinition.edges || [];

          // Check if anything actually changed to avoid infinite loops
          const nodesChanged = JSON.stringify(nodes) !== JSON.stringify(currentDefNodes);
          const edgesChanged = JSON.stringify(edges) !== JSON.stringify(currentDefEdges);

          if (nodesChanged || edgesChanged) {
              onSave({
                  ...funnelDefinition,
                  nodes: nodes as any,
                  edges: edges as any,
                  // Sync layout for hybrid/legacy compatibility
                  layout: nodes.reduce((acc, n) => ({ ...acc, [n.id]: n.position }), {})
              });
          }
      }, 1000);

      return () => clearTimeout(timer);
  }, [nodes, edges, onSave]); // We exclude funnelDefinition to avoid re-triggering on parent updates

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
      // Update local state to trigger the save effect
      setNodes((nds) => nds.map(n => n.id === node.id ? { ...n, position: node.position } : n));
  }, []);

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [],
    );

  const onConnect: OnConnect = useCallback(
    (params) => {
        setEdges((eds) => addEdge(params, eds));
    },
    [],
  );

  const handleNodeClick: NodeMouseHandler = (event, node) => {
      if (onNodeClick) {
          onNodeClick(node.type || 'default', node.data, node.id);
      }
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const payloadStr = event.dataTransfer.getData('application/payload');
      const payload = payloadStr ? JSON.parse(payloadStr) : {};

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (onAddNode && position) {
          onAddNode(type, payload, position);
      }
    },
    [reactFlowInstance, onAddNode]
  );

  return (
    <div className="h-full w-full bg-neutral-950 flex overflow-hidden">
      {/* Toolkit Sidebar */}
      <FlowToolbar />

      {/* Main Canvas */}
      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onNodeDragStop={onNodeDragStop}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            colorMode="dark"
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{
                animated: true,
                style: { stroke: '#4b5563', strokeWidth: 2 },
                type: 'smoothstep'
            }}
        >
            <Background gap={24} size={1} color="#333" />
            <Controls />
            <MiniMap 
                style={{ height: 120, backgroundColor: '#171717', border: '1px solid #333', borderRadius: 8 }} 
                zoomable 
                pannable 
                nodeColor={(n) => {
                    const type = n.type || 'default';
                    if (type === 'start') return '#10b981';
                    if (type === 'chat-message') return '#8b5cf6';
                    if (type === 'checkout') return '#14b8a6';
                    return '#64748b';
                }}
            />
            
            <Panel position="top-center" className="bg-neutral-900/80 backdrop-blur p-2 rounded-full border border-white/10 flex gap-4 shadow-xl pointer-events-none">
                <div className="flex items-center gap-2 px-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Modo Livre (Beta)</span>
                </div>
            </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};
