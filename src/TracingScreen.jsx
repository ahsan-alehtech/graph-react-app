import React, { useState, useEffect, useMemo } from "react";

import { useNavigate } from "react-router-dom";
import { Search, Clock, Filter, ChevronDown, ChevronRight, Copy, ExternalLink } from "lucide-react";

// Mock trace data - replace with actual API calls
const mockTraces = [
  {
    traceId: "0x9e639426dcab08997d62035b722d5189",
    serviceName: "hp-udr-adapter",
    operationName: "GET /hpudradapter/management/prometheus",
    startTime: "2025-09-17T08:12:34.567Z",
    duration: 8300,
    spans: [
      {
        spanId: "999079786583621150",
        parentSpanId: "0",
        serviceName: "hp-udr-adapter",
        operationName: "GET /hpudradapter/management/prometheus",
        startTime: "2025-09-17T08:12:34.567Z",
        duration: 8300,
        tags: {
          "http.request.method": "GET",
          "url.full": "/hpudradapter/management/prometheus",
          "http.response.status_code": 200,
          "span.kind": "server",
          "host.name": "4b9f646f4520",
        },
      },
      {
        spanId: "999079786583621151",
        parentSpanId: "999079786583621150",
        serviceName: "database",
        operationName: "SELECT users",
        startTime: "2025-09-17T08:12:35.000Z",
        duration: 1200,
        tags: {
          "db.statement": "SELECT * FROM users WHERE id = ?",
          "db.system": "postgresql",
          "span.kind": "client",
        },
      },
    ],
  },
  {
    traceId: "0x8f529315cb9a07886e73024c611c4078",
    serviceName: "checkout-service",
    operationName: "POST /checkout/process",
    startTime: "2025-09-17T08:15:22.123Z",
    duration: 12500,
    spans: [
      {
        spanId: "888888888888888888",
        parentSpanId: "0",
        serviceName: "checkout-service",
        operationName: "POST /checkout/process",
        startTime: "2025-09-17T08:15:22.123Z",
        duration: 12500,
        tags: {
          "http.request.method": "POST",
          "url.full": "/checkout/process",
          "http.response.status_code": 201,
          "span.kind": "server",
        },
      },
    ],
  },
];

const mockServices = [
  "hp-udr-adapter",
  "checkout-service",
  "user-service",
  "payment-service",
  "inventory-service",
  "notification-service",
];

const mockOperations = [
  "GET /hpudradapter/management/prometheus",
  "POST /checkout/process",
  "GET /users/profile",
  "POST /payments/charge",
  "GET /inventory/stock",
  "POST /notifications/send",
];

export default function TracingScreen() {
  const navigate = useNavigate();

  // Filter states
  const [serviceFilter, setServiceFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState("");
  const [timeRange, setTimeRange] = useState("1h");
  const [traceIdFilter, setTraceIdFilter] = useState("");

  // UI states
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [expandedSpans, setExpandedSpans] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Filter traces based on current filters
  const filteredTraces = useMemo(() => {
    return mockTraces.filter((trace) => {
      const matchesService =
        !serviceFilter || trace.serviceName.toLowerCase().includes(serviceFilter.toLowerCase());
      const matchesOperation =
        !operationFilter ||
        trace.operationName.toLowerCase().includes(operationFilter.toLowerCase());
      const matchesTraceId =
        !traceIdFilter || trace.traceId.toLowerCase().includes(traceIdFilter.toLowerCase());

      return matchesService && matchesOperation && matchesTraceId;
    });
  }, [serviceFilter, operationFilter, traceIdFilter]);

  // Format duration for display
  const formatDuration = (duration) => {
    if (duration < 1000) return `${duration}μs`;
    if (duration < 1000000) return `${(duration / 1000).toFixed(1)}ms`;
    return `${(duration / 1000000).toFixed(1)}s`;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Toggle span expansion
  const toggleSpan = (spanId) => {
    const newExpanded = new Set(expandedSpans);
    if (newExpanded.has(spanId)) {
      newExpanded.delete(spanId);
    } else {
      newExpanded.add(spanId);
    }
    setExpandedSpans(newExpanded);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#f8fafc",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/")}
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
              gap: 4,
            }}>
            ← Back
          </button>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#111827",
              margin: 0,
            }}>
            Distributed Tracing
          </h1>
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
          <Clock size={16} />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}>
        {/* Left Sidebar - Filters */}
        <div
          style={{
            width: "300px",
            background: "#fff",
            borderRight: "1px solid #e5e7eb",
            padding: "16px",
            overflow: "auto",
          }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
            <Filter size={16} />
            Filters
          </div>

          {/* Service Filter */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "#374151",
              }}>
              Service
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                background: "#fff",
              }}>
              <option value="">All Services</option>
              {mockServices.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          {/* Operation Filter */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "#374151",
              }}>
              Operation
            </label>
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "10px",
                  color: "#6b7280",
                }}
              />
              <input
                type="text"
                value={operationFilter}
                onChange={(e) => setOperationFilter(e.target.value)}
                placeholder="Search operations..."
                style={{
                  width: "100%",
                  paddingLeft: "36px",
                  paddingRight: "12px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Time Range Filter */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "#374151",
              }}>
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                background: "#fff",
              }}>
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last 1 hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
          </div>

          {/* Trace ID Filter */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "#374151",
              }}>
              Trace ID
            </label>
            <input
              type="text"
              value={traceIdFilter}
              onChange={(e) => setTraceIdFilter(e.target.value)}
              placeholder="Enter trace ID..."
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                fontFamily: "monospace",
              }}
            />
          </div>

          {/* Results Count */}
          <div
            style={{
              padding: "12px",
              background: "#f8fafc",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#6b7280",
            }}>
            {filteredTraces.length} trace{filteredTraces.length !== 1 ? "s" : ""} found
          </div>
        </div>

        {/* Center - Trace List */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            borderRight: "1px solid #e5e7eb",
            overflow: "auto",
          }}>
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #e5e7eb",
              fontSize: "16px",
              fontWeight: 600,
            }}>
            Traces
          </div>

          <div style={{ padding: "8px" }}>
            {filteredTraces.map((trace, index) => (
              <div
                key={trace.traceId}
                onClick={() => setSelectedTrace(trace)}
                style={{
                  padding: "12px",
                  border:
                    selectedTrace?.traceId === trace.traceId
                      ? "2px solid #3b82f6"
                      : "1px solid #e5e7eb",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  cursor: "pointer",
                  background: selectedTrace?.traceId === trace.traceId ? "#eff6ff" : "#fff",
                  transition: "all 0.2s ease",
                }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px",
                  }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#111827",
                        marginBottom: "4px",
                        fontFamily: "monospace",
                      }}>
                      {trace.traceId}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        marginBottom: "2px",
                      }}>
                      {trace.serviceName} • {trace.operationName}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                      }}>
                      {formatTimestamp(trace.startTime)} • {formatDuration(trace.duration)} •{" "}
                      {trace.spans.length} spans
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(trace.traceId);
                      }}
                      style={{
                        padding: "4px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        background: "#fff",
                        cursor: "pointer",
                      }}>
                      <Copy size={12} />
                    </button>
                    <ExternalLink size={14} color="#6b7280" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Trace Details */}
        <div
          style={{
            width: "400px",
            background: "#fff",
            overflow: "auto",
          }}>
          {selectedTrace ? (
            <div>
              <div
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "16px",
                  fontWeight: 600,
                }}>
                Trace Details
              </div>

              <div style={{ padding: "16px" }}>
                {/* Trace Info */}
                <div
                  style={{
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    marginBottom: "16px",
                  }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "8px",
                      fontFamily: "monospace",
                    }}>
                    {selectedTrace.traceId}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}>
                    Service: {selectedTrace.serviceName}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}>
                    Operation: {selectedTrace.operationName}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}>
                    Duration: {formatDuration(selectedTrace.duration)}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                    }}>
                    Started: {formatTimestamp(selectedTrace.startTime)}
                  </div>
                </div>

                {/* Spans */}
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}>
                  Spans ({selectedTrace.spans.length})
                </div>

                {selectedTrace.spans.map((span, index) => (
                  <div
                    key={span.spanId}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      marginBottom: "8px",
                      overflow: "hidden",
                    }}>
                    <div
                      onClick={() => toggleSpan(span.spanId)}
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        background: "#f9fafb",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}>
                      {expandedSpans.has(span.spanId) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            marginBottom: "2px",
                          }}>
                          {span.operationName}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                          }}>
                          {span.serviceName} • {formatDuration(span.duration)}
                        </div>
                      </div>
                    </div>

                    {expandedSpans.has(span.spanId) && (
                      <div style={{ padding: "12px", background: "#fff" }}>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            marginBottom: "8px",
                            color: "#374151",
                          }}>
                          Span Details
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            fontFamily: "monospace",
                            background: "#f8fafc",
                            padding: "8px",
                            borderRadius: "4px",
                            marginBottom: "8px",
                          }}>
                          <div>Span ID: {span.spanId}</div>
                          <div>Parent: {span.parentSpanId}</div>
                          <div>Duration: {formatDuration(span.duration)}</div>
                        </div>

                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            marginBottom: "8px",
                            color: "#374151",
                          }}>
                          Tags
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            fontFamily: "monospace",
                            background: "#f8fafc",
                            padding: "8px",
                            borderRadius: "4px",
                            maxHeight: "200px",
                            overflow: "auto",
                          }}>
                          {Object.entries(span.tags).map(([key, value]) => (
                            <div key={key} style={{ marginBottom: "2px" }}>
                              <span style={{ color: "#6b7280" }}>{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}>
              Select a trace to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
