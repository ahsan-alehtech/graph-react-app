import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import tracesData from "./data/tracesData.json";

const TraceDetailPage = () => {
  const { traceId } = useParams();
  const navigate = useNavigate();
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find the trace by ID
    const foundTrace = tracesData.traces.find((t) => t.traceId === traceId);
    if (foundTrace) {
      setTrace(foundTrace);
    }
    setLoading(false);
  }, [traceId]);

  const formatDuration = (duration) => {
    if (duration < 1000) return `${duration}μs`;
    if (duration < 1000000) return `${(duration / 1000).toFixed(1)}ms`;
    return `${(duration / 1000000).toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getSpanColor = (span, index) => {
    const colors = [
      "#3b82f6", // blue
      "#10b981", // emerald
      "#f59e0b", // amber
      "#ef4444", // red
      "#8b5cf6", // violet
      "#06b6d4", // cyan
      "#84cc16", // lime
      "#f97316", // orange
    ];
    return colors[index % colors.length];
  };

  const calculateSpanPosition = (span, traceStartTime) => {
    const spanStart = new Date(span.startTime).getTime();
    const traceStart = new Date(traceStartTime).getTime();
    const relativeStart = spanStart - traceStart;
    const percentage = (relativeStart / trace.duration) * 100;
    return Math.max(0, Math.min(95, percentage)); // Cap at 95% to prevent overflow
  };

  const calculateSpanWidth = (span) => {
    const percentage = (span.duration / trace.duration) * 100;
    return Math.max(1, Math.min(percentage, 95)); // Min 1%, Max 95% width
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#6b7280",
        }}>
        Loading trace details...
      </div>
    );
  }

  if (!trace) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#6b7280",
        }}>
        <div>Trace not found</div>
        <button
          onClick={() => navigate("/tracing")}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}>
          Back to Tracing
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
      }}>
      {/* Header */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}>
        <button
          onClick={() => navigate("/tracing")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            color: "#6b7280",
          }}>
          <ArrowLeft size={16} />
          Back to Tracing
        </button>

        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "600",
              margin: 0,
              color: "#111827",
            }}>
            Trace Details
          </h1>
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              fontFamily: "monospace",
            }}>
            {trace.traceId}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => copyToClipboard(trace.traceId)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
            }}>
            <Copy size={14} />
            Copy Trace ID
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}>
        {/* Left Panel - Trace Info */}
        <div
          style={{
            width: "350px",
            background: "white",
            borderRight: "1px solid #e5e7eb",
            padding: "24px",
            overflow: "auto",
          }}>
          {/* Trace Summary */}
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#111827",
              }}>
              Trace Summary
            </h2>

            <div
              style={{
                background: "#f8fafc",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "13px",
              }}>
              <div style={{ marginBottom: "8px" }}>
                <strong>Service:</strong> {trace.serviceName}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Operation:</strong> {trace.operationName}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Duration:</strong> {formatDuration(trace.duration)}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Started:</strong> {formatTimestamp(trace.startTime)}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Spans:</strong> {trace.spans.length}
              </div>
            </div>
          </div>

          {/* ML Analysis */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#111827",
              }}>
              ML Analysis
            </h3>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <span
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  background: trace.isAnomaly ? "#fef3c7" : "#f3f4f6",
                  color: trace.isAnomaly ? "#92400e" : "#374151",
                  borderRadius: "4px",
                  fontWeight: "500",
                }}>
                {trace.isAnomaly ? "🚨 Anomaly" : "✅ Normal"}
              </span>

              <span
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  background: "#f3f4f6",
                  color: "#374151",
                  borderRadius: "4px",
                  fontWeight: "500",
                }}>
                Score: {trace.anomalyScore}
              </span>

              <span
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  background: "#e0f2fe",
                  color: "#0369a1",
                  borderRadius: "4px",
                  fontWeight: "500",
                }}>
                {trace.clusterId}
              </span>

              <span
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  background: trace.hasErrors ? "#fee2e2" : "#f0fdf4",
                  color: trace.hasErrors ? "#dc2626" : "#059669",
                  borderRadius: "4px",
                  fontWeight: "500",
                }}>
                {trace.hasErrors ? "❌ Errors" : "✅ No Errors"}
              </span>
            </div>
          </div>

          {/* Spans List */}
          <div>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#111827",
              }}>
              Spans ({trace.spans.length})
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {trace.spans.map((span, index) => (
                <div
                  key={span.spanId}
                  style={{
                    padding: "8px 12px",
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}>
                  <div style={{ fontWeight: "500", marginBottom: "4px" }}>{span.operationName}</div>
                  <div style={{ color: "#6b7280", fontSize: "11px" }}>
                    {span.serviceName} • {formatDuration(span.duration)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Jaeger-like Timeline */}
        <div
          style={{
            flex: 1,
            background: "white",
            padding: "24px",
            overflow: "auto",
            minWidth: "600px",
          }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "20px",
              color: "#111827",
            }}>
            Timeline View
          </h2>

          {/* Timeline Container */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "20px",
              position: "relative",
              minHeight: "400px",
              overflow: "hidden",
            }}>
            {/* Timeline Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
                fontSize: "12px",
                color: "#6b7280",
                padding: "0 4px",
              }}>
              <span>0ms</span>
              <span>{formatDuration(trace.duration)}</span>
            </div>

            {/* Timeline Grid */}
            <div
              style={{
                position: "absolute",
                top: "40px",
                left: "24px",
                right: "24px",
                height: "2px",
                background: "#e5e7eb",
                borderRadius: "1px",
              }}
            />

            {/* Spans */}
            {trace.spans.map((span, index) => {
              const position = calculateSpanPosition(span, trace.startTime);
              const width = calculateSpanWidth(span);
              const color = getSpanColor(span, index);

              return (
                <div
                  key={span.spanId}
                  style={{
                    position: "absolute",
                    top: `${60 + index * 60}px`,
                    left: `calc(24px + ${position}% * (100% - 48px) / 100)`,
                    width: `calc(${width}% * (100% - 48px) / 100)`,
                    height: "30px",
                    background: color,
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 18px",
                    fontSize: "11px",
                    color: "white",
                    fontWeight: "500",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    minWidth: "20px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.02)";
                    e.target.style.zIndex = "10";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.zIndex = "1";
                  }}>
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}>
                    {span.operationName}
                  </div>
                </div>
              );
            })}

            {/* Span Labels */}
            {trace.spans.map((span, index) => (
              <div
                key={`label-${span.spanId}`}
                style={{
                  position: "absolute",
                  top: `${60 + index * 60 + 35}px`,
                  left: "24px",
                  fontSize: "11px",
                  color: "#374151",
                  fontWeight: "500",
                }}>
                {span.serviceName}
              </div>
            ))}
          </div>

          {/* Detailed Span Information */}
          <div style={{ marginTop: "24px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "16px",
                color: "#111827",
              }}>
              Span Details
            </h3>

            {trace.spans.map((span, index) => (
              <div
                key={span.spanId}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  overflow: "hidden",
                }}>
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "12px 16px",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: getSpanColor(span, index),
                      borderRadius: "2px",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "500", fontSize: "14px" }}>{span.operationName}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {span.serviceName} • {formatDuration(span.duration)}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>
                    {formatTimestamp(span.startTime)}
                  </div>
                </div>

                <div style={{ padding: "16px" }}>
                  <div style={{ marginBottom: "12px" }}>
                    <h4
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        marginBottom: "8px",
                        color: "#374151",
                      }}>
                      Span Information
                    </h4>
                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontFamily: "monospace",
                      }}>
                      <div>Span ID: {span.spanId}</div>
                      <div>Parent: {span.parentSpanId}</div>
                      <div>Duration: {formatDuration(span.duration)}</div>
                    </div>
                  </div>

                  <div>
                    <h4
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        marginBottom: "8px",
                        color: "#374151",
                      }}>
                      Tags
                    </h4>
                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontFamily: "monospace",
                        maxHeight: "150px",
                        overflow: "auto",
                      }}>
                      {Object.entries(span.tags).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: "2px" }}>
                          <span style={{ color: "#6b7280" }}>{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraceDetailPage;
