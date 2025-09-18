import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const SpanDetails = ({ span, formatDuration }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSpan = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        marginBottom: "8px",
        overflow: "hidden",
      }}>
      <div
        onClick={toggleSpan}
        style={{
          padding: "12px",
          cursor: "pointer",
          background: "#f9fafb",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
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

      {isExpanded && (
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
  );
};

export default SpanDetails;
