import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import serviceGraphData from './data/serviceGraphData.json';

// Component type definitions with colors and icons
const componentTypes = {
  'api-gateway': { color: '#fbbf24', icon: '🌐', name: 'API Gateway' },
  'redis': { color: '#dc2626', icon: '🔴', name: 'Redis' },
  'pulsar': { color: '#ea580c', icon: '🟠', name: 'Pulsar' },
  'kestrel': { color: '#16a34a', icon: '🟢', name: 'Kestrel' },
  'oracle': { color: '#2563eb', icon: '🔵', name: 'Oracle' },
  'clickhouse': { color: '#7c3aed', icon: '🟣', name: 'ClickHouse' },
  'mongodb': { color: '#a16207', icon: '🟤', name: 'MongoDB' },
  'service': { color: '#6b7280', icon: '⚪', name: 'Service' },
  'database': { color: '#1e40af', icon: '🔵', name: 'Database' },
  'cache': { color: '#dc2626', icon: '🔴', name: 'Cache' }
};

// Custom node with multiple invisible connection handles around the perimeter
const CircularNodeWithHandles = ({ data, selected }) => {
  const componentType = componentTypes[data.componentType] || componentTypes[data.kind] || componentTypes['service'];
  const isEntryPoint = data.componentType === 'api-gateway';

  return (
    <div style={{ position: 'relative' }}>
      {/* Main Node */}
      <div style={{
        background: '#1e40af',
        color: 'white',
        border: selected ? '3px dashed #3b82f6' : '2px solid #1e40af',
        borderRadius: '50%',
        padding: '4px',
        width: isEntryPoint ? '30px' : '25px',
        height: isEntryPoint ? '30px' : '25px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected ? '0 0 0 2px white, 0 0 0 4px #3b82f6' : 'none',
        position: 'relative'
      }}>

        {/* Connection handles at 4 cardinal points (X/Y axis intersections) */}
        <Handle
          type="target"
          position={Position.Top}
          id="t1"
          style={{
            background: 'transparent',
            border: 'none',
            width: '2px',
            height: '2px',
            top: '0px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="r1"
          style={{
            background: 'transparent',
            border: 'none',
            width: '2px',
            height: '2px',
            right: '0px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="b1"
          style={{
            background: 'transparent',
            border: 'none',
            width: '2px',
            height: '2px',
            bottom: '0px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="l1"
          style={{
            background: 'transparent',
            border: 'none',
            width: '2px',
            height: '2px',
            left: '0px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />

        {/* Source handles at same 4 cardinal points */}
        <Handle
          type="source"
          position={Position.Top}
          id="t2"
          style={{
            background: 'transparent',
            border: 'none',
            width: '2px',
            height: '2px',
            top: '0px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="r2"
          style={{
            background: 'transparent',
            border: 'none',
            width: '2px',
            height: '2px',
            right: '0px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="b2"
          style={{
            background: 'transparent',
            border: 'none',
            width: '2px',
            height: '2px',
            bottom: '0px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="l2"
          style={{
            background: 'transparent',
            border: 'none',
            width: '2px',
            height: '2px',
            left: '0px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
      </div>

      {/* Component Type Label */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '8px',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '10px',
        fontWeight: '500',
        color: '#374151',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        {componentType.name}
      </div>
    </div>
  );
};

const nodeTypes = {
  circularWithHandles: CircularNodeWithHandles,
};

// Convert data to React Flow format
const convertToReactFlowData = () => {
  // Create hierarchical layout with clear layers
  const centerX = 500;
  const layerSpacing = 200;
  const nodeSpacing = 180;

  // Define hierarchical positions by layers
  const nodePositions = {
    // Layer 1: Entry Points (Top)
    'api-gateway': { x: centerX, y: 100 },

    // Layer 2: Business Logic Services (Middle)
    'users': { x: centerX - nodeSpacing, y: 100 + layerSpacing },
    'orders': { x: centerX, y: 100 + layerSpacing },
    'payments': { x: centerX + nodeSpacing, y: 100 + layerSpacing },

    // Layer 3: Supporting Services (Lower Middle)
    'notifications': { x: centerX, y: 100 + layerSpacing * 2 },

    // Layer 4: Data Layer (Bottom)
    'database': { x: centerX - nodeSpacing/2, y: 100 + layerSpacing * 3 },
    'cache': { x: centerX + nodeSpacing/2, y: 100 + layerSpacing * 3 }
  };

  // Create nodes with strategic positions using custom node type
  const nodes = serviceGraphData.nodes.map((node) => ({
    id: node.id,
    type: 'circularWithHandles',
    position: nodePositions[node.id] || { x: centerX, y: 300 },
    data: {
      label: node.id,
      kind: node.kind,
      componentType: node.componentType
    }
  }));

  // Create edges with distributed handles
  const edges = serviceGraphData.edges.map((edge, index) => {
    // Find all edges going to the same target to distribute connection points
    const edgesToSameTarget = serviceGraphData.edges.filter(e => e.target === edge.target);
    const targetIndex = edgesToSameTarget.findIndex(e => e.source === edge.source);

    // Use different handles for distribution: t1, r1, b1, l1 for targets
    const targetHandles = ['t1', 'r1', 'b1', 'l1'];
    const sourceHandles = ['t2', 'r2', 'b2', 'l2'];

    const targetHandle = targetHandles[targetIndex % targetHandles.length];
    const sourceHandle = sourceHandles[index % sourceHandles.length];

    return {
      id: `${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      sourceHandle: sourceHandle,
      targetHandle: targetHandle,
      type: 'straight',
      animated: false,
      style: {
        stroke: edge.errorRate > 0.01 ? '#ef4444' : '#8B5CF6',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.errorRate > 0.01 ? '#ef4444' : '#8B5CF6',
        width: 18,
        height: 18
      },
      data: edge
    };
  });

  return { nodes, edges };
};

export default function FlowTab() {
  const [theme] = useState('light'); // Fixed to light theme
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [editingNodeName, setEditingNodeName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState('service');
  const [selectedDestinationNode, setSelectedDestinationNode] = useState('');

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => convertToReactFlowData(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setEditingNodeName(node.data.label);
    setIsEditingName(false);
    setSelectedDestinationNode(''); // Reset destination selection
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setIsEditingName(false);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setIsEditingName(false);
  }, []);

  // Handle node name update
  const handleUpdateNodeName = useCallback(() => {
    if (!selectedNode || !editingNodeName.trim()) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, label: editingNodeName.trim() } }
          : node
      )
    );
    setIsEditingName(false);
    // Update selected node to reflect the change
    setSelectedNode(prev => ({
      ...prev,
      data: { ...prev.data, label: editingNodeName.trim() }
    }));
  }, [selectedNode, editingNodeName, setNodes]);

  // Handle node deletion
  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return;

    const nodeId = selectedNode.id;

    // Remove the node
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));

    // Remove all edges connected to this node
    setEdges((eds) => eds.filter((edge) =>
      edge.source !== nodeId && edge.target !== nodeId
    ));

    // Clear selection
    setSelectedNode(null);
    setIsEditingName(false);
  }, [selectedNode, setNodes, setEdges]);

  // Handle edit mode toggle
  const handleStartEditing = useCallback(() => {
    setIsEditingName(true);
  }, []);

  const handleCancelEditing = useCallback(() => {
    setIsEditingName(false);
    setEditingNodeName(selectedNode?.data?.label || '');
  }, [selectedNode]);

  // Handle adding new node
  const handleAddNode = useCallback(() => {
    if (!newNodeName.trim()) return;

    // Generate a unique ID
    const nodeId = newNodeName.toLowerCase().replace(/\s+/g, '-');

    // Check if ID already exists
    const existingNode = nodes.find(n => n.id === nodeId);
    if (existingNode) {
      alert('A node with this name already exists!');
      return;
    }

    // Calculate position for new node (center with slight offset)
    const offset = nodes.length * 30; // Slight offset for each new node

    const newNode = {
      id: nodeId,
      type: 'circularWithHandles',
      position: {
        x: 500 + offset,
        y: centerY + offset
      },
      data: {
        label: newNodeName.trim(),
        kind: ['redis', 'pulsar', 'oracle', 'clickhouse', 'mongodb', 'database', 'cache'].includes(newNodeType) ? 'database' : 'service',
        componentType: newNodeType
      }
    };

    setNodes((nds) => [...nds, newNode]);

    // Reset form
    setNewNodeName('');
    setNewNodeType('service');
    setShowAddNodeModal(false);
  }, [newNodeName, newNodeType, nodes, setNodes]);

  const handleOpenAddNodeModal = useCallback(() => {
    setShowAddNodeModal(true);
    setNewNodeName('');
    setNewNodeType('service');
  }, []);

  const handleCloseAddNodeModal = useCallback(() => {
    setShowAddNodeModal(false);
    setNewNodeName('');
    setNewNodeType('service');
  }, []);

  // Handle adding new relationship/edge
  const handleAddRelationship = useCallback(() => {
    if (!selectedNode || !selectedDestinationNode) return;

    // Check if relationship already exists
    const existingEdge = edges.find(edge =>
      edge.source === selectedNode.id && edge.target === selectedDestinationNode
    );

    if (existingEdge) {
      alert('Relationship already exists between these nodes!');
      return;
    }

    // Find all edges going to the same target to distribute connection points
    const edgesToSameTarget = edges.filter(e => e.target === selectedDestinationNode);
    const targetIndex = edgesToSameTarget.length; // Use length as index for new edge

    // Use different handles for distribution
    const targetHandles = ['t1', 'r1', 'b1', 'l1'];
    const sourceHandles = ['t2', 'r2', 'b2', 'l2'];

    const targetHandle = targetHandles[targetIndex % targetHandles.length];
    const sourceHandle = sourceHandles[edges.length % sourceHandles.length];

    const newEdge = {
      id: `${selectedNode.id}-${selectedDestinationNode}-${Date.now()}`,
      source: selectedNode.id,
      target: selectedDestinationNode,
      sourceHandle: sourceHandle,
      targetHandle: targetHandle,
      type: 'straight',
      animated: false,
      style: {
        stroke: '#8B5CF6',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#8B5CF6',
        width: 18,
        height: 18
      },
      data: {
        rps: 50,
        errorRate: 0.001,
        p95ms: 25
      }
    };

    setEdges((eds) => [...eds, newEdge]);
    setSelectedDestinationNode(''); // Reset selection
  }, [selectedNode, selectedDestinationNode, edges, setEdges]);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setIsEditingName(false);
    setEditingNodeName('');
  }, []);

  // Reset view function - will be implemented in the ReactFlow wrapper
  const [resetTrigger, setResetTrigger] = useState(0);

  const resetView = useCallback(() => {
    setResetTrigger(prev => prev + 1);
    setSelectedNode(null);
    setSelectedEdge(null);
    setIsEditingName(false);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      color: "#111827",
      fontFamily: "Inter, system-ui, sans-serif",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid #e5e7eb",
        background: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h1 style={{
            fontSize: "24px",
            fontWeight: "600",
            margin: 0,
            marginBottom: "4px"
          }}>
            NexusFlow
          </h1>
          <p style={{
            fontSize: "14px",
            color: "#6b7280",
            margin: 0
          }}>
            Interactive Flow visualization
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={handleOpenAddNodeModal}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "#10b981",
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            ➕ Add Node
          </button>

          <button
            onClick={resetView}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "#3b82f6",
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            🔄 Reset View
          </button>

          
          <div style={{
            padding: "8px 12px",
            borderRadius: "8px",
            background: theme === 'light' ? "#f3f4f6" : "#374151",
            fontSize: "12px",
            color: theme === 'light' ? "#6b7280" : "#9ca3af"
          }}>
            Nodes: {nodes.length} | Edges: {edges.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: "flex",
        position: "relative"
      }}>
        {/* React Flow Container */}
        <div style={{
          flex: 1,
          position: "relative",
          background: "#ffffff"
        }}>


          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            fitView
            fitViewOptions={{
              padding: 0.2,
              minZoom: 0.1,
              maxZoom: 1.5
            }}
            attributionPosition="bottom-left"
            style={{
              background: "#ffffff"
            }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            key={resetTrigger} // This will force re-render and trigger fitView
          >
            <Controls
              style={{
                background: theme === 'light' ? "#ffffff" : "#374151",
                border: "1px solid " + (theme === 'light' ? "#e5e7eb" : "#4b5563")
              }}
            />
            <MiniMap
              style={{
                background: theme === 'light' ? "#f9fafb" : "#374151",
                border: "1px solid " + (theme === 'light' ? "#e5e7eb" : "#4b5563")
              }}
              nodeColor={theme === 'light' ? "#2563eb" : "#60a5fa"}
            />
            <Background
              color={theme === 'light' ? "#f8fafc" : "#1a1a1a"}
            />
          </ReactFlow>
        </div>
        
        {/* Change Node Panel */}
        {selectedNode && (
          <div style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: theme === 'light' ? "rgba(255, 255, 255, 0.95)" : "rgba(45, 45, 45, 0.95)",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "16px",
            minWidth: "280px",
            maxWidth: "320px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px"
            }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                margin: 0
              }}>
                Change Node
              </h3>
              <button
                onClick={clearSelection}
                style={{
                  padding: "4px 8px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                ✕
              </button>
            </div>

            {/* Node Info */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{
                padding: "12px",
                background: theme === 'light' ? "#f9fafb" : "#374151",
                borderRadius: "8px",
                fontSize: "14px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px"
                }}>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: selectedNode.data?.kind === 'database' ? '#7c3aed' : '#2563eb'
                    }}
                  ></div>
                  <div style={{ fontWeight: "600" }}>{selectedNode.data?.label}</div>
                </div>
                <div style={{
                  fontSize: "12px",
                  color: theme === 'light' ? "#6b7280" : "#9ca3af",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px"
                }}>
                  <div><strong>ID:</strong> {selectedNode.id}</div>
                  <div><strong>Kind:</strong> {selectedNode.data?.kind || 'service'}</div>
                </div>
              </div>
            </div>

            {/* Name Editing */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: theme === 'light' ? "#374151" : "#d1d5db"
              }}>
                Node Name:
              </label>
              {isEditingName ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={editingNodeName}
                    onChange={(e) => setEditingNodeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateNodeName();
                      if (e.key === 'Escape') handleCancelEditing();
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: theme === 'light' ? 'white' : '#374151',
                      color: theme === 'light' ? '#1f2937' : '#f9fafb'
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateNodeName}
                    style={{
                      padding: '8px 12px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelEditing}
                    style={{
                      padding: '8px 12px',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: theme === 'light' ? '#f9fafb' : '#374151',
                    border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: theme === 'light' ? '#1f2937' : '#f9fafb'
                  }}>
                    {selectedNode.data.label}
                  </div>
                  <button
                    onClick={handleStartEditing}
                    style={{
                      padding: '8px 12px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Add Relationship Section */}
            <div style={{
              marginBottom: '16px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                margin: '0 0 12px 0',
                color: '#374151'
              }}>
                Add Relationship
              </h4>

              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Destination Node
                </label>
                <select
                  value={selectedDestinationNode}
                  onChange={(e) => setSelectedDestinationNode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#fff'
                  }}
                >
                  <option value="">Select destination...</option>
                  {nodes
                    .filter(node => node.id !== selectedNode?.id) // Exclude current node
                    .map(node => (
                      <option key={node.id} value={node.id}>
                        {node.data.label} ({node.data.kind})
                      </option>
                    ))
                  }
                </select>
              </div>

              <button
                onClick={handleAddRelationship}
                disabled={!selectedDestinationNode}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: selectedDestinationNode ? '#3b82f6' : '#d1d5db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: selectedDestinationNode ? 'pointer' : 'not-allowed'
                }}
              >
                🔗 Add Relationship
              </button>
            </div>

            {/* Delete Button */}
            <button
              onClick={handleDeleteNode}
              style={{
                width: '100%',
                padding: '12px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#dc2626'}
              onMouseOut={(e) => e.target.style.background = '#ef4444'}
            >
              🗑️ Delete Node
            </button>
          </div>
        )}

        {/* Edge Details Panel */}
        {selectedEdge && !selectedNode && (
          <div style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: theme === 'light' ? "rgba(255, 255, 255, 0.95)" : "rgba(45, 45, 45, 0.95)",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "16px",
            minWidth: "280px",
            maxWidth: "320px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px"
            }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                margin: 0
              }}>
                Edge Details
              </h3>
              <button
                onClick={clearSelection}
                style={{
                  padding: "4px 8px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                ✕
              </button>
            </div>

            <div>
              <h4 style={{
                fontSize: "14px",
                fontWeight: "500",
                margin: "0 0 8px 0",
                color: theme === 'light' ? "#374151" : "#d1d5db"
              }}>
                Edge Information:
              </h4>
              <div style={{
                padding: "12px",
                background: theme === 'light' ? "#f9fafb" : "#374151",
                borderRadius: "8px",
                fontSize: "14px"
              }}>
                <div style={{
                  fontWeight: "600",
                  marginBottom: "8px"
                }}>
                  {nodes.find(n => n.id === selectedEdge.source)?.data?.label || selectedEdge.source}
                  <span style={{ margin: "0 8px", color: theme === 'light' ? "#6b7280" : "#9ca3af" }}>→</span>
                  {nodes.find(n => n.id === selectedEdge.target)?.data?.label || selectedEdge.target}
                </div>
                <div style={{
                  fontSize: "12px",
                  color: theme === 'light' ? "#6b7280" : "#9ca3af"
                }}>
                  <div><strong>RPS:</strong> {selectedEdge.data?.rps || 'N/A'}</div>
                  <div><strong>Error Rate:</strong> {selectedEdge.data?.errorRate ? (selectedEdge.data.errorRate * 100).toFixed(2) + '%' : 'N/A'}</div>
                  <div><strong>p95 Latency:</strong> {selectedEdge.data?.p95ms ? selectedEdge.data.p95ms + 'ms' : 'N/A'}</div>
                  <div><strong>ID:</strong> {selectedEdge.id}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Node Modal */}
        {showAddNodeModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
              maxWidth: '90vw',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Add New Node
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Node Name
                </label>
                <input
                  type="text"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="Enter node name..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNode();
                    if (e.key === 'Escape') handleCloseAddNodeModal();
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Component Type
                </label>
                <select
                  value={newNodeType}
                  onChange={(e) => setNewNodeType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#fff'
                  }}
                >
                  <option value="service">Service</option>
                  <option value="api-gateway">API Gateway</option>
                  <option value="kestrel">Kestrel</option>
                  <option value="redis">Redis</option>
                  <option value="pulsar">Pulsar</option>
                  <option value="oracle">Oracle</option>
                  <option value="clickhouse">ClickHouse</option>
                  <option value="mongodb">MongoDB</option>
                  <option value="database">Database</option>
                  <option value="cache">Cache</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={handleCloseAddNodeModal}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNode}
                  disabled={!newNodeName.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: newNodeName.trim() ? '#10b981' : '#d1d5db',
                    color: '#fff',
                    cursor: newNodeName.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Add Node
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div style={{
        padding: "12px 24px",
        borderTop: "1px solid #e5e7eb",
        background: theme === 'light' ? "#f9fafb" : "#2d2d2d",
        fontSize: "12px",
        color: theme === 'light' ? "#6b7280" : "#9ca3af",
        textAlign: "center"
      }}>
        💡 Click nodes and edges to explore | Pan to move | Scroll to zoom | 2D static visualization
      </div>
    </div>
  );
}