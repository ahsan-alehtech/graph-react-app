import React, { useState, useEffect, useMemo } from "react";

import { useNavigate } from "react-router-dom";
import { Search, Clock, Filter, ChevronDown, ChevronRight, Copy, ExternalLink } from "lucide-react";
import tracesData from "./data/tracesData.json";
import { SpansList } from "./components";

// Use comprehensive trace data from JSON file
const mockTraces = tracesData.traces;
const mockServices = tracesData.services;
const mockOperations = tracesData.operations;
const mockClusters = tracesData.clusters;

export default function TracingScreen() {
  const navigate = useNavigate();

  // Filter states
  const [serviceFilter, setServiceFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState("");
  const [timeRange, setTimeRange] = useState("1h");
  const [traceIdFilter, setTraceIdFilter] = useState("");

  // ML-powered filters
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);
  const [scoreRange, setScoreRange] = useState([0, 100]);
  const [clusterId, setClusterId] = useState("");
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [searchService, setSearchService] = useState("");

  // UI states
  const [selectedTrace, setSelectedTrace] = useState(null);
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

      // ML-powered filters
      const matchesAnomalies = !onlyAnomalies || trace.isAnomaly;
      const matchesScore =
        trace.anomalyScore >= scoreRange[0] && trace.anomalyScore <= scoreRange[1];
      const matchesCluster = !clusterId || trace.clusterId === clusterId;
      const matchesErrors = !onlyErrors || trace.hasErrors;
      const matchesSearch =
        !searchService || trace.serviceName.toLowerCase().includes(searchService.toLowerCase());

      return (
        matchesService &&
        matchesOperation &&
        matchesTraceId &&
        matchesAnomalies &&
        matchesScore &&
        matchesCluster &&
        matchesErrors &&
        matchesSearch
      );
    });
  }, [
    serviceFilter,
    operationFilter,
    traceIdFilter,
    onlyAnomalies,
    scoreRange,
    clusterId,
    onlyErrors,
    searchService,
  ]);

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
                  width: "84%",
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

          {/* ML-powered Filters */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "8px",
                color: "#374151",
              }}>
              ML Analysis
            </div>

            {/* Only Anomalies Checkbox */}
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}>
                <input
                  type="checkbox"
                  checked={onlyAnomalies}
                  onChange={(e) => setOnlyAnomalies(e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                  }}
                />
                only anomalies
              </label>
            </div>

            {/* Score Range Slider */}
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  marginBottom: "6px",
                  color: "#374151",
                }}>
                Score
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scoreRange[1]}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value);
                    setScoreRange([Math.min(scoreRange[0], newMax), newMax]);
                  }}
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "#e5e7eb",
                    outline: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "-8px",
                    left: "0",
                    fontSize: "10px",
                    color: "#6b7280",
                  }}>
                  {scoreRange[0]}
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "0",
                    fontSize: "10px",
                    color: "#6b7280",
                  }}>
                  {scoreRange[1]}
                </div>
                <div style={{ marginTop: "4px", fontSize: "11px", color: "#6b7280" }}>
                  Range: {scoreRange[0]} - {scoreRange[1]}
                </div>
              </div>
            </div>

            {/* Cluster ID Dropdown */}
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  marginBottom: "6px",
                  color: "#374151",
                }}>
                cluster #
              </label>
              <select
                value={clusterId}
                onChange={(e) => setClusterId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "13px",
                  outline: "none",
                  background: "white",
                }}>
                <option value="">All clusters</option>
                {mockClusters.map((cluster) => (
                  <option key={cluster} value={cluster}>
                    {cluster}
                  </option>
                ))}
              </select>
            </div>

            {/* Only Errors Checkbox */}
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}>
                <input
                  type="checkbox"
                  checked={onlyErrors}
                  onChange={(e) => setOnlyErrors(e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                  }}
                />
                only errors
              </label>
            </div>

            {/* Search Service Dropdown */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  marginBottom: "6px",
                  color: "#374151",
                }}>
                search
              </label>
              <select
                value={searchService}
                onChange={(e) => setSearchService(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "13px",
                  outline: "none",
                  background: "white",
                }}>
                <option value="">All services</option>
                {mockServices.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div style={{ marginBottom: "12px" }}>
            <button
              onClick={() => {
                setServiceFilter("");
                setOperationFilter("");
                setTraceIdFilter("");
                setOnlyAnomalies(false);
                setScoreRange([0, 100]);
                setClusterId("");
                setOnlyErrors(false);
                setSearchService("");
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#374151",
                cursor: "pointer",
                fontWeight: "500",
              }}>
              Clear All Filters
            </button>
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
                        marginBottom: "4px",
                      }}>
                      {formatTimestamp(trace.startTime)} • {formatDuration(trace.duration)} •{" "}
                      {trace.spans.length} spans
                    </div>
                    {/* ML Indicators */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {trace.isAnomaly && (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            background: "#fef3c7",
                            color: "#92400e",
                            borderRadius: "4px",
                            fontWeight: "500",
                          }}>
                          ANOMALY
                        </span>
                      )}
                      {trace.hasErrors && (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            background: "#fee2e2",
                            color: "#dc2626",
                            borderRadius: "4px",
                            fontWeight: "500",
                          }}>
                          ERROR
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          background: "#f3f4f6",
                          color: "#374151",
                          borderRadius: "4px",
                          fontWeight: "500",
                        }}>
                        Score: {trace.anomalyScore}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          background: "#e0f2fe",
                          color: "#0369a1",
                          borderRadius: "4px",
                          fontWeight: "500",
                        }}>
                        {trace.clusterId}
                      </span>
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
                      marginBottom: "4px",
                    }}>
                    Started: {formatTimestamp(selectedTrace.startTime)}
                  </div>
                  {/* ML Information */}
                  <div
                    style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        marginBottom: "4px",
                        color: "#374151",
                      }}>
                      ML Analysis
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          background: selectedTrace.isAnomaly ? "#fef3c7" : "#f3f4f6",
                          color: selectedTrace.isAnomaly ? "#92400e" : "#374151",
                          borderRadius: "4px",
                          fontWeight: "500",
                        }}>
                        Anomaly: {selectedTrace.isAnomaly ? "Yes" : "No"}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          background: "#f3f4f6",
                          color: "#374151",
                          borderRadius: "4px",
                          fontWeight: "500",
                        }}>
                        Score: {selectedTrace.anomalyScore}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          background: "#e0f2fe",
                          color: "#0369a1",
                          borderRadius: "4px",
                          fontWeight: "500",
                        }}>
                        Cluster: {selectedTrace.clusterId}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          background: selectedTrace.hasErrors ? "#fee2e2" : "#f0fdf4",
                          color: selectedTrace.hasErrors ? "#dc2626" : "#059669",
                          borderRadius: "4px",
                          fontWeight: "500",
                        }}>
                        Errors: {selectedTrace.hasErrors ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Spans */}
                <SpansList spans={selectedTrace.spans} formatDuration={formatDuration} />
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
