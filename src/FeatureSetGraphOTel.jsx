import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import serviceGraphData from './data/serviceGraphData.json';

/**
 * Feature‑Set Graph UI (OTel‑powered)
 * Zero‑dep Preview Build — no Cytoscape required.
 * Includes: Edit Mode, Sync, New Map, Import/Export, and E2E Flow.
 */

// ---------- Visual helpers --------------------------------------------------
const EDGE_COLOR = (verb) => ({
  calls: "#2563eb",
  proxies_to: "#0ea5e9",
  publishes_to: "#059669",
  consumes_from: "#16a34a",
  has_subscription: "#10b981",
  reads_from: "#dc2626",
  writes_to: "#ef4444",
  maps_to: "#7c3aed",
  caches: "#ca8a04",
  exposes: "#9333ea",
  has_tenant: "#0891b2",
  has_namespace: "#0ea5e9",
  has_topic: "#22c55e",
  dlq_of: "#f59e0b",
  schema_of: "#8b5cf6",
}[verb] || "#64748b");

const NODE_COLOR = (type) => ({
  service: "#dbeafe",
  route: "#f1f9ff",
  endpoint: "#eef2ff",
  topic: "#dcfce7",
  subscription: "#e0f2fe",
  table: "#fee2e2",
  collection: "#ffedd5",
  keyspace: "#fef9c3",
  entity: "#f5f3ff",
  cache: "#f0fdf4",
  operation: "#e9d5ff",
  cluster: "#e0f2fe",
  tenant: "#cffafe",
  namespace: "#ccfbf1",
  schema: "#fde68a",
}[type] || "#ffffff");

const TYPE_ICON = (type) => ({
  service: "🧩",
  route: "🌐",
  endpoint: "🔌",
  topic: "📣",
  subscription: "🎧",
  table: "🗄️",
  collection: "🗃️",
  keyspace: "⚡",
  entity: "🧱",
  cache: "🧠",
  operation: "🧾",
  cluster: "🛰️",
  tenant: "👥",
  namespace: "📦",
  schema: "📄",
}[type] || "");

// View modes configure which verbs/types are visible
const ALL_VERBS = [
  "calls","proxies_to","publishes_to","consumes_from","has_subscription",
  "reads_from","writes_to","maps_to","caches","exposes","uses_orm_entity",
  "has_tenant","has_namespace","has_topic","dlq_of","schema_of"
];

const VIEW_MODES = {
  all: { label: "All", verbs: ALL_VERBS, types: null },
  api: { label: "API / Kestrel", verbs: ["calls","proxies_to","exposes"], types: ["service","route","endpoint"] },
  messaging: { label: "Messaging / Pulsar", verbs: ["publishes_to","consumes_from","has_subscription","has_tenant","has_namespace","has_topic","dlq_of","schema_of"], types: ["service","cluster","tenant","namespace","topic","subscription","schema"] },
  storage: { label: "Storage", verbs: ["reads_from","writes_to","maps_to"], types: ["service","table","collection","entity"] },
  cache: { label: "Cache", verbs: ["caches"], types: ["service","keyspace","cache"] },
  orm: { label: "ORM / Hibernate", verbs: ["uses_orm_entity","maps_to","caches"], types: ["service","entity","table","cache"] },
};

// ---------- Convert serviceGraphData.json to expected format ---------------
function convertServiceGraphData(serviceData) {
  // Convert nodes from serviceGraphData.json format to expected format
  const nodes = serviceData.nodes.map(node => ({
    id: node.id,
    label: node.id, // Use clean ID as label, no icons
    type: node.kind, // 'service' or 'database'
    env: 'prod',
    attrs: {
      componentType: node.componentType,
      service: {
        language: node.componentType === 'kestrel' ? 'java' : 'unknown',
        version: '1.0.0'
      }
    }
  }));

  // Convert edges from serviceGraphData.json format to expected format
  const edges = serviceData.edges.map((edge) => ({
    id: `${edge.source}__calls__${edge.target}`,
    src: edge.source,
    dst: edge.target,
    verb: 'calls',
    attrs: {
      http: {
        method: 'GET',
        status: 200,
        p95_ms: edge.p95ms
      },
      rps: edge.rps,
      errorRate: edge.errorRate,
      feature: 'BILLING_CORE'
    }
  }));

  return { nodes, edges };
}

// ---------- Mock data (replace with real /api/graph later) -----------------
function getMockGraph({ env = "prod", feature = "BILLING_CORE", verbs }) {
  const nodes = [
    // Services
    { id: "svc:kestrel-edge", label: "kestrel-edge", type: "service", env, attrs: { service: { language: "java", version: "3.4.1" }, gateway: { vendor: "Kestrel" } } },
    { id: "svc:device-api", label: "device-api", type: "service", env, attrs: { service: { language: "java", version: "1.3.2" } } },
    { id: "svc:billing-api", label: "billing-api", type: "service", env, attrs: { service: { language: "java", version: "2.1.0" } } },
    { id: "svc:rating-worker", label: "rating-worker", type: "service", env, attrs: { service: { language: "java", version: "1.9.5" } } },

    // Kestrel / API route (edge gateway) + REST endpoint
    { id: "route:edge:/api/devices", label: "Kestrel:/api/devices", type: "route", env,
      attrs: { http: { method: "GET", path: "/api/devices" }, gateway: "kestrel", rate_limit_bucket: "default" } },
    { id: "endpoint:billing:/v1/invoices", label: "REST: GET /v1/invoices", type: "endpoint", env,
      attrs: { http: { method: "GET", route: "/v1/invoices" }, service: "billing-api" } },

    // Pulsar control plane
    { id: "pulsar:cluster:prod", label: "Pulsar Cluster: prod", type: "cluster", env,
      attrs: { pulsar: { version: "3.2.0", brokers_online: 3, bookies_online: 5 } } },
    { id: "pulsar:tenant:cc", label: "Tenant: cc", type: "tenant", env,
      attrs: { pulsar: { tenant: "cc", authz: ["device-api","billing-api","rating-worker"] } } },
    { id: "pulsar:ns:cc/billing", label: "Namespace: cc/billing", type: "namespace", env,
      attrs: { pulsar: { namespace: "cc/billing", retention_ms: 604800000, backlog_quota_mb: 2048 } } },
    { id: "schema:pulsar:billing.events:v4", label: "Schema: billing.events v4", type: "schema", env,
      attrs: { messaging: { schema: { type: "JSON", id: "v4", evolution: "backward" } } } },

    // Pulsar data plane
    { id: "topic:prod/billing.events", label: "pulsar: billing.events", type: "topic", env,
      attrs: { messaging: { system: "pulsar", schema: "JSON", backlog: 12345, msg_rate_in: 180, avg_size_bytes: 512 } } },
    { id: "topic:prod/billing.events.DLQ", label: "pulsar: billing.events.DLQ", type: "topic", env,
      attrs: { messaging: { system: "pulsar", schema: "JSON", backlog: 12 } } },
    { id: "sub:billing.events:rating-shared", label: "sub: rating-shared", type: "subscription", env,
      attrs: { messaging: { subscription: "rating-shared", type: "Shared", ack_ms_p95: 46, redelivery_count_p99: 2 } } },

    // Caches
    { id: "redis:billing:*", label: "redis: billing:*", type: "keyspace", env,
      attrs: { cache: { engine: "redis", hit_rate: 0.87, ttl_s: 900, region: "billing" } } },
    { id: "memcache:prices", label: "memcache: prices", type: "keyspace", env,
      attrs: { cache: { engine: "memcache", set_rate_s: 30 } } },

    // Storage
    { id: "oracle:PRVGOWNER.INVOICES", label: "Oracle: PRVGOWNER.INVOICES", type: "table", env,
      attrs: { db: { system: "oracle", pk: "INVOICE_ID", partitions: ["P2025_08"], stats_ts: "2025-09-01" } } },
    { id: "oracle:PRVGOWNER.USAGE", label: "Oracle: PRVGOWNER.USAGE", type: "table", env,
      attrs: { db: { system: "oracle", pk: "USAGE_ID" } } },
    { id: "mongo:billing.invoices", label: "Mongo: billing.invoices", type: "collection", env,
      attrs: { db: { system: "mongodb", indexes: ["customerId_1_createdAt_-1"] } } },

    // ORM
    { id: "entity:com.cc.Invoice", label: "Entity: com.cc.Invoice", type: "entity", env,
      attrs: { orm: { id_strategy: "SEQUENCE", versioned: true } } },
    { id: "2lc:hibernate:invoice", label: "2LC: invoice", type: "cache", env,
      attrs: { cache: { region: "invoice", hit_rate: 0.92 } } },

    // SOAP
    { id: "soap:RatingService", label: "SOAP: RatingService", type: "service", env,
      attrs: { rpc: { system: "soap", wsdl_version: "1.1" } } },
    { id: "soapop:RateUsage", label: "SOAP Op: RateUsage", type: "operation", env,
      attrs: { rpc: { soapAction: "RateUsage", binding: "document" } } },
  ];

  const mkEdge = (src, dst, verb, attrs = {}) => {
    const id = [src, verb, dst].join('__').replace(/[^A-Za-z0-9:_\-\.]/g, "_");
    return { id, src, dst, verb, attrs };
  };

  const all = [
    // API/Kestrel
    mkEdge("svc:kestrel-edge", "route:edge:/api/devices", "exposes", { http: { method: "GET", path: "/api/devices" }, gateway: { vendor: "Kestrel" }, feature }),
    mkEdge("svc:device-api", "route:edge:/api/devices", "calls", { http: { method: "GET", status: 200, p95_ms: 82 }, feature }),
    mkEdge("route:edge:/api/devices", "svc:billing-api", "proxies_to", { http: { method: "GET", path: "/api/devices" }, feature }),
    // REST endpoint
    mkEdge("svc:billing-api", "endpoint:billing:/v1/invoices", "exposes", { http: { method: "GET", route: "/v1/invoices" }, feature }),

    // Pulsar control plane
    mkEdge("pulsar:cluster:prod", "pulsar:tenant:cc", "has_tenant", { pulsar: { brokers_online: 3 } }),
    mkEdge("pulsar:tenant:cc", "pulsar:ns:cc/billing", "has_namespace", { pulsar: { retention_ms: 604800000 } }),
    mkEdge("pulsar:ns:cc/billing", "topic:prod/billing.events", "has_topic", { pulsar: { partitions: 3 } }),

    // Pulsar data plane
    mkEdge("svc:billing-api", "topic:prod/billing.events", "publishes_to", {
      messaging: { system: "pulsar", schema: "JSON", msg_rate_s: 180, avg_size_bytes: 512, key: null, ordering_key: false }, feature
    }),
    mkEdge("topic:prod/billing.events", "sub:billing.events:rating-shared", "has_subscription", {
      messaging: { subscription: "rating-shared", type: "Shared" }, feature
    }),
    mkEdge("svc:rating-worker", "sub:billing.events:rating-shared", "consumes_from", {
      messaging: { subscription: "rating-shared", ack_ms_p95: 46, redelivery_ratio: 0.01 }, feature
    }),
    mkEdge("topic:prod/billing.events.DLQ", "sub:billing.events:rating-shared", "dlq_of", {
      messaging: { dlq: true } }),
    mkEdge("schema:pulsar:billing.events:v4", "topic:prod/billing.events", "schema_of", {
      messaging: { schema: { type: "JSON", id: "v4" } } }),

    // Cache
    mkEdge("svc:billing-api", "redis:billing:*", "caches", { cache: { op: "GET", hit_rate: 0.87, ttl_s: 900 }, feature }),
    mkEdge("svc:billing-api", "memcache:prices", "caches", { cache: { op: "SET", set_rate_s: 30 }, feature }),

    // ORM + Storage
    mkEdge("entity:com.cc.Invoice", "oracle:PRVGOWNER.INVOICES", "maps_to", { orm: { id_strategy: "SEQUENCE" }, feature }),
    mkEdge("svc:billing-api", "entity:com.cc.Invoice", "uses_orm_entity", { orm: { op: "save" }, feature }),
    mkEdge("svc:billing-api", "2lc:hibernate:invoice", "caches", { cache: { region: "invoice", hit: true }, feature }),

    // Direct DB ops
    mkEdge("svc:billing-api", "oracle:PRVGOWNER.INVOICES", "writes_to", {
      db: { system: "oracle", op: "INSERT", rows: 1, p95_ms: 35, plan_hash: "AB12" }, feature
    }),
    mkEdge("svc:rating-worker", "oracle:PRVGOWNER.USAGE", "reads_from", {
      db: { system: "oracle", op: "SELECT", rows: 200, p95_ms: 75, partitions: ["P2025_08"] }, feature
    }),
    mkEdge("svc:billing-api", "mongo:billing.invoices", "writes_to", {
      db: { system: "mongodb", op: "insertMany", docs: 1, p95_ms: 14 }, feature
    }),

    // SOAP
    mkEdge("svc:rating-worker", "soap:RatingService", "calls", { rpc: { system: "soap", fault: null, p95_ms: 120 }, feature }),
    mkEdge("soap:RatingService", "soapop:RateUsage", "exposes", { feature }),
    mkEdge("svc:rating-worker", "soapop:RateUsage", "calls", { rpc: { fault: null, p95_ms: 118 }, feature }),
  ];

  const edges = verbs ? all.filter(e => verbs.includes(e.verb)) : all;

  // Enrich with style props
  const nodeMap = nodes.map(n => ({ ...n, label: TYPE_ICON(n.type) + "  " + n.label, color: NODE_COLOR(n.type) }));
  const edgeMap = edges.map(e => ({ ...e, ecolor: EDGE_COLOR(e.verb) }));

  return { nodes: nodeMap, edges: edgeMap };
}

// ---------- React Flow Components ------------------------------------------
const CircularNodeWithHandles = ({ data, selected }) => {
  const isEntryPoint = data.componentType === 'api-gateway';
  const isDataLayer = ['redis', 'oracle', 'clickhouse', 'mongodb', 'database', 'cache'].includes(data.componentType);

  return (
    <div style={{ position: 'relative' }}>
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
      }}></div>

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

      {/* Component name below the circle */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '4px',
        fontSize: '10px',
        fontWeight: '500',
        color: '#374151',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        pointerEvents: 'none'
      }}>
        {data.label}
      </div>
    </div>
  );
};

const nodeTypes = {
  circularNode: CircularNodeWithHandles,
};

// ---------- React Flow Graph Component -------------------------------------
function ReactFlowGraph({ nodes, edges, onPick, viewMode }) {
  // Convert nodes to React Flow format with hierarchical layout
  const reactFlowNodes = useMemo(() => {
    const centerX = 400;
    const layerSpacing = 150;
    const nodeSpacing = 200;

    // Define specific positions for our serviceGraphData nodes
    const nodePositions = {
      // Layer 1: Entry Point (Top)
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

    const layoutNodes = nodes.map((node) => {
      // Use predefined positions if available, otherwise use default layout
      const position = nodePositions[node.id] || {
        x: centerX + Math.random() * 200 - 100,
        y: 100 + Math.random() * 400
      };

      return {
        id: node.id,
        type: 'circularNode',
        position,
        data: {
          label: node.label.replace(/^[🧩🌐🔌📣🎧🗄️🗃️⚡🧱🧠🧾🛰️👥📦📄♦◆]\s*/, '').trim(), // Remove emoji and symbols
          componentType: node.attrs?.componentType || node.type,
          originalNode: node
        },
      };
    });

    return layoutNodes;
  }, [nodes]);

  // Convert edges to React Flow format
  const reactFlowEdges = useMemo(() => {
    const availableHandles = ['t2', 'r2', 'b2', 'l2']; // Use source handles
    const targetHandles = ['t1', 'r1', 'b1', 'l1']; // Use target handles
    const nodeConnections = {};

    return edges.map((edge, index) => {
      // Track connections for each node to distribute handles
      if (!nodeConnections[edge.src]) nodeConnections[edge.src] = 0;
      if (!nodeConnections[edge.dst]) nodeConnections[edge.dst] = 0;

      const sourceHandle = availableHandles[nodeConnections[edge.src] % availableHandles.length];
      const targetHandle = targetHandles[nodeConnections[edge.dst] % targetHandles.length];

      nodeConnections[edge.src]++;
      nodeConnections[edge.dst]++;

      return {
        id: edge.id || `${edge.src}-${edge.dst}-${index}`,
        source: edge.src,
        target: edge.dst,
        sourceHandle,
        targetHandle,
        type: 'straight',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#374151',
        },
        style: {
          stroke: '#374151',
          strokeWidth: 2,
        },
        data: { originalEdge: edge }
      };
    });
  }, [edges]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  // Update nodes when props change
  useEffect(() => {
    setRfNodes(reactFlowNodes);
  }, [reactFlowNodes, setRfNodes]);

  // Update edges when props change
  useEffect(() => {
    setRfEdges(reactFlowEdges);
  }, [reactFlowEdges, setRfEdges]);

  const onNodeClick = useCallback((event, node) => {
    if (onPick) {
      onPick({
        type: 'node',
        data: {
          id: node.data.originalNode.id,
          label: node.data.originalNode.label,
          type: node.data.originalNode.type,
          env: node.data.originalNode.env,
          attrs: node.data.originalNode.attrs
        }
      });
    }
  }, [onPick]);

  const onEdgeClick = useCallback((event, edge) => {
    if (onPick) {
      onPick({
        type: 'edge',
        data: {
          id: edge.data.originalEdge.id,
          source: edge.data.originalEdge.src,
          target: edge.data.originalEdge.dst,
          verb: edge.data.originalEdge.verb,
          attrs: edge.data.originalEdge.attrs
        }
      });
    }
  }, [onPick]);

  const onPaneClick = useCallback(() => {
    if (onPick) {
      onPick(null); // Deselect when clicking on empty space
    }
  }, [onPick]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

// ---------- Safe‑mode generic preview (no Cytoscape) -----------------------
function SafeGenericPreview({ nodes, edges, onPick, viewMode }) {
  const [openNodes, setOpenNodes] = useState(() => new Set());
  const [openEdges, setOpenEdges] = useState(() => new Set());

  const verbs = (VIEW_MODES[viewMode] && VIEW_MODES[viewMode].verbs) || ALL_VERBS;
  const grouped = useMemo(() => {
    const g = verbs.reduce((acc, v) => { acc[v] = []; return acc; }, {});
    for (const e of edges) if (g[e.verb]) g[e.verb].push(e);
    return g;
  }, [edges, verbs]);

  const toggleNode = (id, data) => {
    const next = new Set(openNodes); next.has(id) ? next.delete(id) : next.add(id); setOpenNodes(next);
    if (onPick) onPick({ type: 'node', data });
  };
  const toggleEdge = (id, data) => {
    const next = new Set(openEdges); next.has(id) ? next.delete(id) : next.add(id); setOpenEdges(next);
    if (onPick) onPick({ type: 'edge', data });
  };

  const hintForNode = (n) => {
    switch(n.type){
      case 'service': return ['service.name', 'service.version', 'deployment.environment'];
      case 'route': return ['http.method', 'url.path', 'http.route'];
      case 'endpoint': return ['http.method', 'url.path', 'server.address'];
      case 'topic': return ['messaging.system=pulsar', 'messaging.destination', 'messaging.pulsar.topic'];
      case 'subscription': return ['messaging.pulsar.subscription', 'messaging.subscription.type', 'ack_ms_p95'];
      case 'table': return ['db.system=oracle', 'db.sql.table', 'db.operation'];
      case 'collection': return ['db.system=mongodb', 'db.collection.name', 'db.operation'];
      case 'keyspace': return ['cache.engine', 'cache.region/keyspace', 'cache.hit_rate'];
      case 'entity': return ['hibernate.entity.name', 'hibernate.id_strategy'];
      case 'cache': return ['hibernate.2lc.region', 'cache.hit_rate'];
      case 'operation': return ['rpc.system=soap', 'soap.action'];
      case 'cluster': return ['pulsar.cluster', 'brokers_online', 'bookies_online'];
      case 'tenant': return ['messaging.pulsar.tenant', 'authorized.services'];
      case 'namespace': return ['messaging.pulsar.namespace', 'retention_ms', 'backlog_quota_mb'];
      case 'schema': return ['messaging.schema.type', 'schema.id', 'evolution'];
      default: return [];
    }
  };
  const hintForEdge = (e) => {
    switch(e.verb){
      case 'calls': return ['http.method/status OR rpc.system/p95_ms'];
      case 'proxies_to': return ['http.route', 'upstream.service'];
      case 'publishes_to': return ['messaging.operation=publish', 'messaging.destination', 'message.size_bytes'];
      case 'consumes_from': return ['messaging.operation=receive', 'ack_ms_p95', 'redelivery_ratio'];
      case 'has_subscription': return ['subscription.name', 'subscription.type'];
      case 'reads_from': return ['db.system', 'db.operation=SELECT', 'db.sql.table'];
      case 'writes_to': return ['db.system', 'db.operation=INSERT/UPDATE', 'rows'];
      case 'maps_to': return ['entity → table mapping (build-time)'];
      case 'caches': return ['cache.op', 'cache.region/keyspace', 'hit_rate'];
      case 'exposes': return ['http.route OR soap.action'];
      case 'has_tenant': return ['pulsar.cluster → tenant'];
      case 'has_namespace': return ['tenant → namespace'];
      case 'has_topic': return ['namespace → topic'];
      case 'dlq_of': return ['dead-letter-topic of subscription'];
      case 'schema_of': return ['schema → topic'];
      default: return [];
    }
  };

  const NodeCard = ({ n }) => (
    <div key={n.id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <button onClick={() => toggleNode(n.id, { id:n.id, label:n.label, type:n.type, env:n.env, attrs:n.attrs })}
          style={{ background:'transparent', border:'none', textAlign:'left', cursor:'pointer', flex:1 }}>
          <div style={{ fontSize:12, color:'#6b7280' }}>{n.type}</div>
          <div style={{ fontWeight:600 }}>{n.label}</div>
        </button>
        <button onClick={() => toggleNode(n.id, { id:n.id, label:n.label, type:n.type, env:n.env, attrs:n.attrs })}
          aria-label="expand"
          style={{ background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', cursor:'pointer' }}>
          {openNodes.has(n.id) ? '▾' : '▸'}
        </button>
      </div>
      {openNodes.has(n.id) && (
        <div style={{ marginTop:8, fontSize:12, color:'#374151' }}>
          <div style={{ marginBottom:4 }}>Sample OTel attrs you can surface:</div>
          <ul style={{ marginLeft:16 }}>
            {hintForNode(n).map(h => <li key={h} style={{ listStyle:'disc' }}>{h}</li>)}
          </ul>
          {n.attrs && <pre style={{ marginTop:8, fontSize:11, background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:8, padding:8, overflow:'auto' }}>{JSON.stringify(n.attrs, null, 2)}</pre>}
        </div>
      )}
    </div>
  );

  const EdgeRow = ({ e }) => (
    <div key={e.id} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
        <button onClick={() => toggleEdge(e.id, { id:e.id, source:e.src, target:e.dst, verb:e.verb, attrs:e.attrs })}
          style={{ background:'transparent', border:'none', textAlign:'left', cursor:'pointer', flex:1, fontSize:12 }}>
          <span>{e.src} <span style={{ opacity:.6 }}>→</span> {e.dst}</span>
          <span style={{ marginLeft:8, border:'1px solid #e5e7eb', borderRadius:999, padding:'0 6px' }}>{e.verb}</span>
        </button>
        <button onClick={() => toggleEdge(e.id, { id:e.id, source:e.src, target:e.dst, verb:e.verb, attrs:e.attrs })}
          aria-label="expand"
          style={{ background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', cursor:'pointer' }}>
          {openEdges.has(e.id) ? '▾' : '▸'}
        </button>
      </div>
      {openEdges.has(e.id) && (
        <div style={{ marginTop:8, fontSize:12, color:'#374151' }}>
          <div style={{ marginBottom:4 }}>Relationship details & OTel attrs:</div>
          <ul style={{ marginLeft:16 }}>
            {hintForEdge(e).map(h => <li key={h} style={{ listStyle:'disc' }}>{h}</li>)}
          </ul>
          {e.attrs && <pre style={{ marginTop:8, fontSize:11, background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:8, padding:8, overflow:'auto' }}>{JSON.stringify(e.attrs, null, 2)}</pre>}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, padding: 16 }}>
      <div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Nodes</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {nodes.map(n => <NodeCard key={n.id} n={n} />)}
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Edges</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {verbs.map(v => (
            <div key={v}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{v}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                {(grouped[v] || []).map(e => <EdgeRow key={e.id} e={e} />)}
                {(grouped[v] || []).length === 0 && <div style={{ fontSize: 12, color: '#9ca3af' }}>none</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Helpers --------------------------------------------------------
function deepClone(obj){ return JSON.parse(JSON.stringify(obj || {})); }

// Compute a single E2E path using BFS (directed from src -> dst)
function computeFlowPath(graph, startId, endId){
  if (!graph || !graph.nodes || !graph.edges) return null;
  if (!startId || !endId) return null;
  var idToNode = {}; for (var i=0;i<graph.nodes.length;i++){ idToNode[graph.nodes[i].id] = graph.nodes[i]; }
  if (!idToNode[startId] || !idToNode[endId]) return null;
  var out = {}; for (var i=0;i<graph.edges.length;i++){ var e = graph.edges[i]; (out[e.src] = out[e.src] || []).push(e); }
  var q = [startId]; var seen = {}; seen[startId] = true; var prev = {};
  while (q.length){
    var cur = q.shift();
    if (cur === endId) break;
    var outs = out[cur] || [];
    for (var j=0;j<outs.length;j++){
      var ed = outs[j]; var nxt = ed.dst;
      if (!seen[nxt]){ seen[nxt] = true; prev[nxt] = { id: cur, edge: ed }; q.push(nxt); }
    }
  }
  if (!seen[endId]) return null;
  var steps = []; var pathNodes = [endId]; var pathEdges = [];
  var walk = endId; while (walk !== startId){ var p = prev[walk]; if (!p) break; steps.push({ from: p.id, edge: p.edge, to: walk }); pathEdges.push(p.edge); pathNodes.push(p.id); walk = p.id; }
  steps.reverse(); pathEdges.reverse(); pathNodes.reverse();
  return { nodes: pathNodes, edges: pathEdges, steps: steps };
}

function formatStep(step){
  var edge = step.edge || {}; var verb = edge.verb || "";
  return step.from + "  " + verb + "  →  " + step.to;
}

// ---------- Main component --------------------------------------------------
export default function FeatureSetGraphOTel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [env, setEnv] = useState("prod");
  const [feature, setFeature] = useState("BILLING_CORE");
  const [viewMode, setViewMode] = useState("all");
  const [verbs, setVerbs] = useState(ALL_VERBS);

  // Get selected components from URL params
  const selectedComponents = useMemo(() => {
    const components = searchParams.get('components');
    return components ? components.split(',') : [];
  }, [searchParams]);

  const seed = useMemo(() => convertServiceGraphData(serviceGraphData), []);
  const [maps, setMaps] = useState(() => ({ BILLING_CORE: deepClone(seed), USAGE_RATING: { nodes: [], edges: [] }, DEVICE_MGMT: { nodes: [], edges: [] } }));

  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [working, setWorking] = useState(() => deepClone(seed));
  const [toast, setToast] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [selection, setSelection] = useState(null);
  // Flow builder state
  const [flowStart, setFlowStart] = useState("");
  const [flowEnd, setFlowEnd] = useState("");
  const [flowResult, setFlowResult] = useState(null);
  const [flowActive, setFlowActive] = useState(false);
  // Editor state
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [editingNodeName, setEditingNodeName] = useState("");
  const [selectedDestinationNode, setSelectedDestinationNode] = useState("");
  // Filter state - using componentType instead of kind
  const [componentTypeFilters, setComponentTypeFilters] = useState({
    'api-gateway': true,
    'service': true,
    'kestrel': true,
    'pulsar': true,
    'oracle': true,
    'redis': true
  });

  useEffect(() => { setVerbs(VIEW_MODES[viewMode].verbs); }, [viewMode]);
  useEffect(() => { setWorking(deepClone(maps[feature] || { nodes: [], edges: [] })); setDirty(false); setSelection(null); }, [feature]);

  // Reset editing state when selection changes
  useEffect(() => {
    setIsEditingNode(false);
    setEditingNodeName("");
    setSelectedDestinationNode("");
  }, [selection]);

  const derived = useMemo(() => {
    const base = editing ? working : (maps[feature] || { nodes: [], edges: [] });
    const withStyle = {
      nodes: (base.nodes || []).map(n => ({ ...n, label: n.label, color: NODE_COLOR(n.type) })), // Remove TYPE_ICON
      edges: (base.edges || []).map(e => ({ ...e, ecolor: EDGE_COLOR(e.verb) })),
    };

    if (flowActive && flowResult && flowResult.nodes && flowResult.nodes.length > 0){
      const keepN = new Set(flowResult.nodes);
      const keepE = new Set(flowResult.edges.map(ee => ee.id));
      const nodes = withStyle.nodes.filter(n => keepN.has(n.id));
      const edges = withStyle.edges.filter(e => keepE.has(e.id));
      return { nodes, edges };
    }

    // Apply selectedComponents filter first (if any)
    let filteredNodes = withStyle.nodes;
    if (selectedComponents.length > 0) {
      const selectedSet = new Set(selectedComponents);
      filteredNodes = withStyle.nodes.filter(n => selectedSet.has(n.id));
    }

    // Apply componentType filters
    const componentFilteredNodes = filteredNodes.filter(n => {
      const componentType = n.attrs?.componentType || n.type;
      return componentTypeFilters[componentType] !== false;
    });
    const componentFilteredNodeIds = new Set(componentFilteredNodes.map(n => n.id));
    const componentFilteredEdges = withStyle.edges.filter(e => componentFilteredNodeIds.has(e.src) && componentFilteredNodeIds.has(e.dst));

    const types = VIEW_MODES[viewMode].types;
    if (!types) return { nodes: componentFilteredNodes, edges: componentFilteredEdges };

    const idToNode = {}; for (const n of componentFilteredNodes) idToNode[n.id] = n;
    const edges = componentFilteredEdges.filter(e => idToNode[e.src] && idToNode[e.dst] && types.includes(idToNode[e.src].type) && types.includes(idToNode[e.dst].type));
    const used = new Set(); for (const e of edges){ used.add(e.src); used.add(e.dst); }
    const nodes = componentFilteredNodes.filter(n => used.has(n.id));
    return { nodes, edges };
  }, [editing, working, maps, feature, viewMode, flowActive, flowResult, componentTypeFilters, selectedComponents]);

  // Inspector summaries
  function summarizeNode(d){
    const a = d.attrs || {}; const t = d.type;
    if (t === "topic" && a.messaging) return "backlog: " + (a.messaging.backlog||"?") + ", rate: " + (a.messaging.msg_rate_in||a.messaging.msg_rate_s||"?") + "/s";
    if (t === "subscription" && a.messaging) return "type: " + (a.messaging.type||"?") + ", ack_p95: " + (a.messaging.ack_ms_p95||"?") + "ms";
    if (t === "route" && a.http) return (a.http.method||"") + " " + (a.http.path||"");
    if (t === "service" && a.service) return (a.service.language||"") + " v" + (a.service.version||"");
    if (t === "table" && a.db) return (a.db.system||"") + " pk=" + (a.db.pk||"");
    if (t === "cluster" && a.pulsar) return "brokers:" + (a.pulsar.brokers_online||"?") + ", bookies:" + (a.pulsar.bookies_online||"?");
    if (t === "tenant" && a.pulsar) return a.pulsar.tenant || "tenant";
    if (t === "namespace" && a.pulsar) return a.pulsar.namespace || "namespace";
    if (t === "schema" && a.messaging && a.messaging.schema) return a.messaging.schema.type + " v" + (a.messaging.schema.id||"?");
    return t;
  }
  function summarizeEdge(d){
    const a = d.attrs || {}; const m = a.messaging || {}; const db = a.db || {}; const cache = a.cache || {}; const http = a.http || {}; const rpc = a.rpc || {};
    if (d.verb === "publishes_to") return "rate: " + (m.msg_rate_s||"?") + "/s, size: " + (m.avg_size_bytes||"?") + "B";
    if (d.verb === "consumes_from") return "ack_p95: " + (m.ack_ms_p95||"?") + "ms, redel: " + (m.redelivery_ratio||"?");
    if (d.verb === "has_subscription") return m.subscription ? ("sub: " + m.subscription) : "subscription";
    if (d.verb === "reads_from" || d.verb === "writes_to") return (db.op||"op") + ", p95: " + (db.p95_ms||"?") + "ms";
    if (d.verb === "caches") return (cache.op||"cache") + (cache.hit_rate? (", hit: " + cache.hit_rate) : "");
    if (d.verb === "calls") return http.method ? (http.method + (http.p95_ms? (" p95:"+http.p95_ms+"ms") : "")) : (rpc.system? ("rpc p95:"+(rpc.p95_ms||"?")) : "call");
    return d.verb;
  }

  // ---------- Editing utils -------------------------------------------------
  const allNodeTypes = ["service","route","endpoint","cluster","tenant","namespace","topic","subscription","schema","table","collection","keyspace","entity","cache","operation"];
  const allVerbs = ALL_VERBS;

  function addNode({ id, label, type, env: nodeEnv, componentType }){
    if (!id || !type) return setToast({ kind: 'err', msg: 'Node id and type are required' });
    if (!allNodeTypes.includes(type)) return setToast({ kind: 'err', msg: `Unknown node type: ${type}` });
    const exists = (editing ? (working.nodes||[]) : ((maps[feature]&&maps[feature].nodes)||[])).some(n => n.id === id);
    if (exists) return setToast({ kind: 'err', msg: `Node id already exists: ${id}` });
    const n = {
      id,
      label: label || id,
      type,
      env: nodeEnv || env,
      attrs: {
        componentType: componentType || type,
        service: { language: 'unknown', version: '1.0.0' }
      }
    };
    if (editing){ setWorking(w => ({ ...w, nodes: [...(w.nodes||[]), n] })); setDirty(true); }
    else { setMaps(m => ({ ...m, [feature]: { ...(m[feature]||{ nodes:[], edges:[] }), nodes: [...(((m[feature]||{}).nodes)||[]), n] } })); }
  }

  function removeNode(id){
    if (!id) return;
    if (editing){ setWorking(w => ({ nodes: (w.nodes||[]).filter(n=>n.id!==id), edges: (w.edges||[]).filter(e=> e.src!==id && e.dst!==id) })); setDirty(true); }
    else { setMaps(m => ({ ...m, [feature]: { ...(m[feature]||{ nodes:[], edges:[] }), nodes: ((m[feature]&&m[feature].nodes)||[]).filter(n=>n.id!==id), edges: ((m[feature]&&m[feature].edges)||[]).filter(e=> e.src!==id && e.dst!==id) } })); }
  }

  function addEdge({ src, dst, verb }){
    if (!src || !dst || !verb) return setToast({ kind: 'err', msg: 'Edge source, target and verb are required' });
    if (!allVerbs.includes(verb)) return setToast({ kind: 'err', msg: `Unknown verb: ${verb}` });
    const base = editing ? working : (maps[feature] || { nodes: [], edges: [] });
    const hasSrc = (base.nodes||[]).some(n=>n.id===src); const hasDst = (base.nodes||[]).some(n=>n.id===dst);
    if (!hasSrc || !hasDst) return setToast({ kind: 'err', msg: 'Both source and target nodes must exist' });
    const id = [src, verb, dst].join('__').replace(/[^A-Za-z0-9:_\-\.]/g, "_");
    const e = { id, src, dst, verb, attrs: {} };
    if (editing){ setWorking(w => ({ ...w, edges: [...(w.edges||[]), e] })); setDirty(true); }
    else { setMaps(m => ({ ...m, [feature]: { ...(m[feature]||{ nodes:[], edges:[] }), edges: [...(((m[feature]||{}).edges)||[]), e] } })); }
  }

  function removeEdge(id){
    if (!id) return;
    if (editing){ setWorking(w => ({ ...w, edges: (w.edges||[]).filter(e=>e.id!==id) })); setDirty(true); }
    else { setMaps(m => ({ ...m, [feature]: { ...(m[feature]||{ nodes:[], edges:[] }), edges: ((m[feature]&&m[feature].edges)||[]).filter(e=>e.id!==id) } })); }
  }

  function syncNow(){
    setToast({ kind: 'info', msg: 'Syncing…' });
    setTimeout(() => {
      if (editing){ setMaps(m => ({ ...m, [feature]: deepClone(working) })); setDirty(false); }
      setToast({ kind: 'ok', msg: 'Synced' });
      setLastSyncedAt(new Date().toISOString());
    }, 300);
  }

  function newMap(){
    const name = (typeof window !== 'undefined') ? window.prompt('New feature set name (A-Z, _, -):', 'NEW_FEATURE') : 'NEW_FEATURE';
    if (!name) return;
    if (maps[name]) { setToast({ kind: 'err', msg: `Map ${name} already exists` }); return; }
    const blank = { nodes: [], edges: [] };
    setMaps(m => ({ ...m, [name]: blank }));
    setFeature(name);
    setWorking(blank);
    setEditing(true);
    setDirty(true);
  }

  function exportMap(){
    const g = editing ? working : (maps[feature] || { nodes: [], edges: [] });
    const json = JSON.stringify(g, null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(json).catch(()=>{});
    setToast({ kind: 'ok', msg: 'Exported to clipboard (JSON)' });
  }

  function importMap(){
    const txt = (typeof window !== 'undefined') ? window.prompt('Paste graph JSON (nodes/edges):') : null;
    if (!txt) return;
    try {
      const g = JSON.parse(txt);
      if (!g.nodes || !g.edges) throw new Error('Missing nodes/edges');
      setWorking(g); setEditing(true); setDirty(true);
      setToast({ kind: 'ok', msg: 'Imported. Edit mode ON (not yet synced).' });
    } catch (e){ setToast({ kind: 'err', msg: 'Invalid JSON' }); }
  }

  function runFlowCompute(){
    const base = editing ? working : (maps[feature] || { nodes: [], edges: [] });
    const s = flowStart || (typeof document!=='undefined' && document.getElementById('flow_start') ? document.getElementById('flow_start').value : "");
    const t = flowEnd || (typeof document!=='undefined' && document.getElementById('flow_end') ? document.getElementById('flow_end').value : "");
    if (!s || !t){ setToast({ kind: 'err', msg: 'Provide start and end node ids' }); return; }
    const res = computeFlowPath(base, s, t);
    if (!res){ setToast({ kind: 'err', msg: 'No path found' }); setFlowActive(false); setFlowResult(null); return; }
    setFlowResult(res); setFlowActive(true); setSelection(null);
  }
  function clearFlow(){ setFlowActive(false); setFlowResult(null); }
  function deleteSelected(){
    if (!selection) return;
    if (selection.type === 'node') removeNode(selection.data.id);
    if (selection.type === 'edge') removeEdge(selection.data.id);
    setSelection(null);
  }

  const outerStyle = { minHeight: "100vh", background: "#f8fafc", color: "#111827", fontFamily: "Inter, system-ui, sans-serif" };

  return (
    <div style={outerStyle}>
      {/* Top bar */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid #e5e7eb", background: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {selectedComponents.length > 0 && (
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  background: "#fff",
                  color: "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                ← Back
              </button>
            )}
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>NexusNova</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {selectedComponents.length > 0
                  ? `Viewing ${selectedComponents.length} selected components`
                  : "Interactive Flow visualization"
                }
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: 'wrap' }}>
            <select value={env} onChange={e=> setEnv(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <option value="dev">dev</option>
              <option value="qa">qa</option>
              <option value="prod">prod</option>
            </select>
            <select value={feature} onChange={e=> setFeature(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              {Object.keys(maps).map(k => (<option key={k} value={k}>{k}</option>))}
            </select>
            <select value={viewMode} onChange={e=> setViewMode(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              {Object.entries(VIEW_MODES).map(([k,v]) => (<option key={k} value={k}>{v.label}</option>))}
            </select>

            <button onClick={() => setEditing(v=>!v)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 10, background: editing? '#eef2ff' : '#fff' }}>{editing? 'Editing ✓' : 'Edit'}</button>
            <button onClick={syncNow} disabled={!editing} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 10, background: editing? '#dcfce7' : '#f3f4f6' }}>Sync</button>
            <button onClick={newMap} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff' }}>New Map</button>
            <button onClick={exportMap} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff' }}>Export</button>
            <button onClick={importMap} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff' }}>Import</button>
          </div>
        </div>
        {lastSyncedAt && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>Last synced: {lastSyncedAt}{dirty && ' • unsaved edits'}</div>}
      </div>

      {/* 3‑pane layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 2fr 1fr",
        gap: 16,
        padding: 16,
        minHeight: 'calc(100vh - 120px)'
      }}>
        {/* Left: filters + legend + flow */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "8px 16px", borderBottom: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600 }}>Filters</div>

            {/* Component Type Filters */}
            <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#374151' }}>Component Types</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                {Object.keys(componentTypeFilters).map(componentType => (
                  <label key={componentType} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={componentTypeFilters[componentType]}
                      onChange={() => setComponentTypeFilters(prev => ({ ...prev, [componentType]: !prev[componentType] }))}
                    />
                    {componentType}
                  </label>
                ))}
              </div>
            </div>


          </div>

          <div style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Legend</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#374151" }}>
              {derived.nodes.map(node => (
                <div key={node.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 4,
                  padding: '4px 6px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  background: '#f8fafc'
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontWeight: 500, fontSize: 11 }}>{node.id}</span>
                  </div>
                  <span style={{
                    fontSize: 9,
                    color: '#6b7280',
                    background: '#e5e7eb',
                    padding: '1px 3px',
                    borderRadius: 3
                  }}>
                    {node.attrs?.componentType || node.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Flow builder */}
          <div style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Flow (E2E)</div>
            <div style={{ display:'grid', gap: 8 }}>
              <input id="flow_start" value={flowStart} onChange={e=>setFlowStart(e.target.value)} placeholder="start node id" style={{ padding:8, border:'1px solid #e5e7eb', borderRadius:8 }} />
              <input id="flow_end" value={flowEnd} onChange={e=>setFlowEnd(e.target.value)} placeholder="end node id" style={{ padding:8, border:'1px solid #e5e7eb', borderRadius:8 }} />
              <div style={{ display:'flex', gap: 8 }}>
                <button onClick={runFlowCompute} style={{ flex:1, padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:8, background:'#ecfdf5' }}>Compute</button>
                <button onClick={clearFlow} disabled={!flowActive} style={{ flex:1, padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:8, background:'#f3f4f6' }}>Clear</button>
              </div>
              <div style={{ fontSize:12, color:'#6b7280' }}>Presets (click to fill):</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                <button onClick={() => { setFlowStart('route:edge:/api/devices'); setFlowEnd('oracle:PRVGOWNER.INVOICES'); }} style={{ padding:'4px 8px', border:'1px solid #e5e7eb', borderRadius:999, background:'#fff' }}>API → Oracle Invoices</button>
                <button onClick={() => { setFlowStart('svc:billing-api'); setFlowEnd('sub:billing.events:rating-shared'); }} style={{ padding:'4px 8px', border:'1px solid #e5e7eb', borderRadius:999, background:'#fff' }}>Billing → Sub</button>
                <button onClick={() => { setFlowStart('svc:rating-worker'); setFlowEnd('soapop:RateUsage'); }} style={{ padding:'4px 8px', border:'1px solid #e5e7eb', borderRadius:999, background:'#fff' }}>Rating → RateUsage</button>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Safe preview (clickable) + Flow path */}
        <div style={{
          border: "1px solid #e5e7eb",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 160px)'
        }}>
          <div style={{ padding: "8px 16px", borderBottom: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600 }}>Graph</div>
          <div style={{ flex: 1 }}>
            <ReactFlowGraph
              nodes={derived.nodes}
              edges={derived.edges}
              viewMode={viewMode}
              onPick={setSelection}
            />
          </div>
        </div>

        {/* Right: Inspector + Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Inspector</div>



            {!selection && <div style={{ fontSize: 13, color: "#6b7280" }}>Select a node or edge to see details</div>}
            {selection && selection.type === "node" && (
              <div>
                {/* Selected Node Header */}
                <div style={{
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  marginBottom: 12
                }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 4
                  }}>
                    {selection.data.label}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: '#6b7280',
                    background: '#e5e7eb',
                    padding: '2px 6px',
                    borderRadius: 4,
                    display: 'inline-block'
                  }}>
                    {selection.data.attrs?.componentType || selection.data.type}
                  </div>
                </div>

                {/* Upstream Nodes */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Upstream ({derived.edges.filter(e => e.dst === selection.data.id).length})
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    {derived.edges
                      .filter(e => e.dst === selection.data.id)
                      .map(edge => {
                        const sourceNode = derived.nodes.find(n => n.id === edge.src);
                        return (
                          <div key={edge.id} style={{
                            padding: '6px 8px',
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: 6,
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <span style={{ fontWeight: 500, color: '#0369a1' }}>
                              {sourceNode?.label || edge.src}
                            </span>
                            <span style={{ color: '#6b7280', fontSize: 10 }}>
                              {edge.verb}
                            </span>
                          </div>
                        );
                      })
                    }
                    {derived.edges.filter(e => e.dst === selection.data.id).length === 0 && (
                      <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
                        No upstream connections
                      </div>
                    )}
                  </div>
                </div>

                {/* Downstream Nodes */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Downstream ({derived.edges.filter(e => e.src === selection.data.id).length})
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    {derived.edges
                      .filter(e => e.src === selection.data.id)
                      .map(edge => {
                        const targetNode = derived.nodes.find(n => n.id === edge.dst);
                        return (
                          <div key={edge.id} style={{
                            padding: '6px 8px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 6,
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <span style={{ fontWeight: 500, color: '#059669' }}>
                              {targetNode?.label || edge.dst}
                            </span>
                            <span style={{ color: '#6b7280', fontSize: 10 }}>
                              {edge.verb}
                            </span>
                          </div>
                        );
                      })
                    }
                    {derived.edges.filter(e => e.src === selection.data.id).length === 0 && (
                      <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
                        No downstream connections
                      </div>
                    )}
                  </div>
                </div>

                {editing && (
                  <button
                    onClick={() => removeNode(selection.data.id)}
                    style={{
                      width: '100%',
                      marginTop: 8,
                      padding: '6px 10px',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      borderRadius: 8,
                      background: '#fff',
                      fontSize: 12
                    }}
                  >
                    Delete Node
                  </button>
                )}
              </div>
            )}
            {selection && selection.type === "edge" && (
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{selection.data.source} → {selection.data.target}</div>
                {editing && <button onClick={()=> removeEdge(selection.data.id)} style={{ marginTop: 8, padding: '6px 10px', border: '1px solid #ef4444', color:'#ef4444', borderRadius: 8, background:'#fff' }}>Delete relationship</button>}
              </div>
            )}
          </div>

          {/* Editor panel */}
          <div style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Editor</div>

            {/* Add New Node Form */}
            <fieldset style={{ border:'1px solid #e5e7eb', borderRadius: 12, padding: 10, marginBottom: 16 }}>
              <legend style={{ padding: '0 6px', fontSize: 12, color: '#6b7280' }}>Add New Node</legend>
              <div style={{ display: 'grid', gap: 8 }}>
                <input
                  id="editor_node_name"
                  placeholder="Enter node name..."
                  style={{
                    padding: 8,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#fff'
                  }}
                />
                <select
                  id="editor_component_type"
                  style={{
                    padding: 8,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#fff'
                  }}
                >
                  <option value="service">service</option>
                  <option value="db">db</option>
                  <option value="api">api</option>
                  <option value="pulsar">pulsar</option>
                  <option value="redis">redis</option>
                  <option value="cache">cache</option>
                </select>
                <button
                  onClick={() => {
                    const name = document.getElementById('editor_node_name')?.value;
                    const componentType = document.getElementById('editor_component_type')?.value;

                    if (name) {
                      const nodeId = name.toLowerCase().replace(/\s+/g, '-');
                      addNode({
                        id: nodeId,
                        label: name,
                        type: componentType === 'db' || componentType === 'redis' || componentType === 'cache' ? 'database' : 'service',
                        env,
                        componentType
                      });
                      // Clear form
                      document.getElementById('editor_node_name').value = '';
                      document.getElementById('editor_component_type').value = 'service';
                    }
                  }}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Add Node
                </button>
              </div>
            </fieldset>

            {/* Edit Node and Add Relationship - Only show when node is selected */}
            {selection && selection.type === "node" && (
              <div style={{ display: 'grid', gap: 12 }}>
                {/* Edit Node */}
                <fieldset style={{ border:'1px solid #e5e7eb', borderRadius: 12, padding: 10 }}>
                  <legend style={{ padding: '0 6px', fontSize: 12, color: '#6b7280' }}>Edit Node</legend>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <input
                      value={editingNodeName || selection.data.label}
                      onChange={(e) => setEditingNodeName(e.target.value)}
                      disabled={!isEditingNode}
                      placeholder="Node name"
                      style={{
                        padding: 8,
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        background: isEditingNode ? '#fff' : '#f9fafb'
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          if (isEditingNode) {
                            // Save changes
                            // Update node logic here
                            setIsEditingNode(false);
                          } else {
                            setIsEditingNode(true);
                            setEditingNodeName(selection.data.label);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          background: '#fff'
                        }}
                      >
                        {isEditingNode ? 'Save' : 'Edit'}
                      </button>
                      {isEditingNode && (
                        <button
                          onClick={() => {
                            setIsEditingNode(false);
                            setEditingNodeName("");
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            background: '#fff'
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </fieldset>

                {/* Add Relationship */}
                <fieldset style={{ border:'1px solid #e5e7eb', borderRadius: 12, padding: 10 }}>
                  <legend style={{ padding: '0 6px', fontSize: 12, color: '#6b7280' }}>Add Relationship</legend>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <input
                      value={selection.data.label}
                      disabled
                      placeholder="Source"
                      style={{
                        padding: 8,
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        background: '#f9fafb',
                        color: '#6b7280'
                      }}
                    />
                    <select
                      value={selectedDestinationNode}
                      onChange={(e) => setSelectedDestinationNode(e.target.value)}
                      style={{
                        padding: 8,
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        background: '#fff'
                      }}
                    >
                      <option value="">Select destination...</option>
                      {derived.nodes
                        .filter(node => node.id !== selection.data.id)
                        .map(node => (
                          <option key={node.id} value={node.id}>
                            {node.label}
                          </option>
                        ))
                      }
                    </select>
                    <button
                      onClick={() => {
                        if (selectedDestinationNode) {
                          addEdge({
                            src: selection.data.id,
                            dst: selectedDestinationNode,
                            verb: 'calls'
                          });
                          setSelectedDestinationNode('');
                        }
                      }}
                      disabled={!selectedDestinationNode}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        background: '#fff',
                        cursor: selectedDestinationNode ? 'pointer' : 'not-allowed',
                        opacity: selectedDestinationNode ? 1 : 0.5
                      }}
                    >
                      Add Relationship
                    </button>
                  </div>
                </fieldset>

                {/* Delete button at bottom */}
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => {
                      if (selection && selection.data && selection.data.id) {
                        console.log('Deleting node:', selection.data.id);
                        removeNode(selection.data.id);
                        setSelection(null);
                      }
                    }}
                    disabled={!selection || selection.type !== "node"}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      border: '1px solid #ef4444',
                      color: (selection && selection.type === "node") ? '#ef4444' : '#9ca3af',
                      borderRadius: 8,
                      background: '#fff',
                      cursor: (selection && selection.type === "node") ? 'pointer' : 'not-allowed',
                      opacity: (selection && selection.type === "node") ? 1 : 0.5
                    }}
                  >
                    Delete Node
                  </button>
                </div>
              </div>
            )}
          </div>

          
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom: 16, right: 16, background: toast.kind==='err'? '#fef2f2' : toast.kind==='ok'? '#ecfdf5' : '#eff6ff', border:'1px solid #e5e7eb', borderRadius: 12, padding: '10px 12px', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12 }}>{toast.msg}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "12px 24px", fontSize: 12, color: "#6b7280" }}>
        Backed by OpenTelemetry spans → Oracle (nodes/edges/rollups). Replace mock with /api/graph/*.
      </div>
    </div>
  );
}
