import React from "react";
import heatmapData from "../data/ml/heatmap_service_status.json";

const HeatmapTab = () => {
  // Group data by service
  const serviceGroups = heatmapData.reduce((acc, item) => {
    if (!acc[item.serviceName]) {
      acc[item.serviceName] = {};
    }
    acc[item.serviceName][item["http.response.status_code"]] = item.count;
    return acc;
  }, {});

  const getStatusColor = (statusCode) => {
    if (statusCode >= 500) return "#ef4444"; // red
    if (statusCode >= 400) return "#f59e0b"; // amber
    if (statusCode >= 300) return "#3b82f6"; // blue
    if (statusCode >= 200) return "#10b981"; // green
    return "#6b7280"; // gray
  };

  const getStatusLabel = (statusCode) => {
    if (statusCode >= 500) return "5xx";
    if (statusCode >= 400) return "4xx";
    if (statusCode >= 300) return "3xx";
    if (statusCode >= 200) return "2xx";
    return "Other";
  };

  return (
    <div>
      <h3
        style={{
          fontSize: "14px",
          fontWeight: "600",
          marginBottom: "12px",
          color: "#111827",
        }}>
        Service Status Heatmap
      </h3>

      <div
        style={{
          background: "#f8fafc",
          padding: "12px",
          borderRadius: "6px",
          fontSize: "12px",
        }}>
        <div
          style={{
            fontSize: "11px",
            color: "#6b7280",
            marginBottom: "8px",
            fontWeight: "500",
          }}>
          HTTP Status Code Distribution
        </div>

        {Object.entries(serviceGroups).map(([serviceName, statusCounts]) => (
          <div key={serviceName} style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontWeight: "500",
                marginBottom: "4px",
                color: "#374151",
              }}>
              {serviceName}
            </div>

            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {Object.entries(statusCounts).map(([statusCode, count]) => (
                <div
                  key={statusCode}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    padding: "2px 6px",
                    background: getStatusColor(parseInt(statusCode)),
                    color: "white",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "500",
                  }}>
                  <span>{statusCode}</span>
                  <span>({count})</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div
          style={{
            marginTop: "12px",
            paddingTop: "8px",
            borderTop: "1px solid #e5e7eb",
          }}>
          <div
            style={{
              fontSize: "10px",
              color: "#6b7280",
              marginBottom: "6px",
              fontWeight: "500",
            }}>
            Status Legend:
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "9px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#10b981",
                  borderRadius: "2px",
                }}
              />
              <span>2xx</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "9px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#3b82f6",
                  borderRadius: "2px",
                }}
              />
              <span>3xx</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "9px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#f59e0b",
                  borderRadius: "2px",
                }}
              />
              <span>4xx</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "9px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#ef4444",
                  borderRadius: "2px",
                }}
              />
              <span>5xx</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapTab;
