import React, { useMemo, useState } from "react";

/**
 * Jaeger-like Trace Viewer
 * - Left: Tree (parent/child nesting)
 * - Right: Timeline (Gantt-style bars aligned by relative time)
 *
 * Notes
 * - TailwindCSS classes are used for quick, clean styling.
 * - No external libs required. Drop into any React app.
 * - Default export renders a demo; copy out <TraceTimeline> for reuse.
 */

// -----------------------------
// Types removed for pure JS

// -----------------------------
// Utilities
// -----------------------------
function computeTraceBounds(spans) {
  if (!spans.length) return { start: 0, end: 0, duration: 0 };
  const start = Math.min(...spans.map((s) => s.startTime));
  const end = Math.max(...spans.map((s) => s.startTime + s.duration));
  return { start, end, duration: Math.max(1, end - start) };
}

function buildTree(spans) {
  // Index spans
  const byId = new Map(spans.map((s) => [s.spanID, s]));
  const children = new Map();
  spans.forEach((s) => {
    const pid = s.parentSpanID || "__root__";
    if (!children.has(pid)) children.set(pid, []);
    children.get(pid).push(s);
  });
  // Sort children by start time for consistent display
  for (const list of children.values()) {
    list.sort((a, b) => a.startTime - b.startTime);
  }
  // Roots are under "__root__"
  const roots = children.get("__root__") || [];
  return { byId, children, roots };
}

// Stable palette by service name
function colorForService(service) {
  // Hash to HSL for consistency
  let hash = 0;
  for (let i = 0; i < service.length; i++) hash = (hash * 31 + service.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 70% 55%)`;
}

// Format micros to ms string
function fmtMicros(us) {
  const ms = us / 1000;
  if (ms < 1) return `${ms.toFixed(2)} ms`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

// -----------------------------
// Components
// -----------------------------
function SpanRow({ span, depth, total, traceStart, isCollapsed, toggle }) {
  const leftPct = ((span.startTime - traceStart) / total) * 100;
  const widthPct = (span.duration / total) * 100;
  const svcColor = colorForService(span.serviceName);

  return (
    <div className="grid grid-cols-[minmax(240px,1fr)_minmax(360px,3fr)] items-center gap-2 py-1 border-b border-gray-100">
      {/* Tree cell */}
      <div className="flex items-center text-sm">
        <button
          onClick={() => toggle(span.spanID)}
          className="mr-2 w-5 h-5 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          aria-label={isCollapsed ? "Expand span" : "Collapse span"}
          title={isCollapsed ? "Expand" : "Collapse"}>
          <span className="text-xs select-none">{isCollapsed ? "+" : "–"}</span>
        </button>
        <div style={{ paddingLeft: depth * 12 }} className="truncate">
          <span className="font-medium">{span.operationName}</span>
          <span className="ml-2 text-gray-500">[{span.serviceName}]</span>
        </div>
      </div>

      {/* Timeline cell */}
      <div className="relative h-6">
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full shadow"
          style={{
            left: `${leftPct}%`,
            width: `${Math.max(0.8, widthPct)}%`,
            background: svcColor,
            height: 20,
          }}
          title={`${span.operationName} • ${span.serviceName} • ${fmtMicros(span.duration)}`}
        />
      </div>
    </div>
  );
}

function Tree({ trace }) {
  const { spans } = trace;
  const bounds = useMemo(() => computeTraceBounds(spans), [spans]);
  const { children, roots } = useMemo(() => buildTree(spans), [spans]);
  const [collapsed, setCollapsed] = useState({});

  const toggle = (id) => setCollapsed((m) => ({ ...m, [id]: !m[id] }));

  const rows = [];
  const walk = (s, depth) => {
    rows.push({ span: s, depth });
    if (collapsed[s.spanID]) return; // do not descend if collapsed
    (children.get(s.spanID) || []).forEach((c) => walk(c, depth + 1));
  };
  roots.forEach((r) => walk(r, 0));

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm flex items-center justify-between">
        <div>
          <span className="font-semibold">Trace:</span>
          <span className="ml-2">{trace.traceID}</span>
        </div>
        <div className="text-gray-600">
          <span className="mr-4">Duration: {fmtMicros(bounds.duration)}</span>
          <span>Spans: {spans.length}</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[minmax(240px,1fr)_minmax(360px,3fr)] text-xs uppercase tracking-wide text-gray-500 px-4 py-2">
        <div>Span Tree</div>
        <div className="text-right pr-2">Timeline</div>
      </div>

      {/* Rows */}
      <div className="px-4">
        {rows.map(({ span, depth }) => (
          <SpanRow
            key={span.spanID}
            span={span}
            depth={depth}
            total={bounds.duration}
            traceStart={bounds.start}
            isCollapsed={!!collapsed[span.spanID]}
            toggle={toggle}
          />
        ))}
      </div>
    </div>
  );
}

// -----------------------------
// Demo data (mimics Jaeger-style tree)
// -----------------------------
const demoTrace = {
  traceID: "932d6f030fbd97bed1d951e59b93e8af",
  spans: [
    {
      spanID: "root",
      operationName: "GET /checkout",
      serviceName: "checkout-service",
      startTime: 0,
      duration: 1_200_000, // 1200ms
    },
    {
      spanID: "inv",
      parentSpanID: "root",
      operationName: "POST /reserve",
      serviceName: "inventory-service",
      startTime: 50_000,
      duration: 350_000,
    },
    {
      spanID: "db1",
      parentSpanID: "inv",
      operationName: "SELECT items",
      serviceName: "db",
      startTime: 80_000,
      duration: 120_000,
    },
    {
      spanID: "pay",
      parentSpanID: "root",
      operationName: "POST /charge",
      serviceName: "payment-service",
      startTime: 500_000,
      duration: 500_000,
    },
    {
      spanID: "log",
      parentSpanID: "root",
      operationName: "write logs",
      serviceName: "logger",
      startTime: 300_000,
      duration: 20_000,
    },
    {
      spanID: "notify",
      parentSpanID: "pay",
      operationName: "enqueue receipt",
      serviceName: "mq",
      startTime: 850_000,
      duration: 120_000,
    },
  ],
};

// -----------------------------
// Public component
// -----------------------------
export default function TraceViewerDemo() {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Jaeger-like Trace Viewer (Demo)</h1>
      <p className="text-gray-600 mb-6 max-w-3xl">
        This demo shows how the nesting (left) aligns with a relative-time Gantt (right). Click the
        +/- button on any row to collapse/expand its children. Copy the <code>Tree</code> component
        and pass your own <code>Trace</code> to integrate.
      </p>
      <Tree trace={demoTrace} />

      <div className="mt-6 text-sm text-gray-600">
        <h2 className="font-semibold mb-2">How it works</h2>
        <ul className="list-disc ml-5 space-y-1">
          <li>Rows are depth-first ordered. Indentation reflects parent/child structure.</li>
          <li>
            Bar position = <code>(span.start - trace.start) / trace.duration</code>.
          </li>
          <li>
            Bar width = <code>span.duration / trace.duration</code>.
          </li>
          <li>Service color is generated from service name via HSL hashing for consistency.</li>
        </ul>
      </div>
    </div>
  );
}
