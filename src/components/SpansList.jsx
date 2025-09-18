import React from "react";
import SpanDetails from "./SpanDetails";

const SpansList = ({ spans, formatDuration }) => {
  return (
    <div>
      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          marginBottom: "12px",
        }}>
        Spans ({spans.length})
      </div>

      {spans.map((span) => (
        <SpanDetails key={span.spanId} span={span} formatDuration={formatDuration} />
      ))}
    </div>
  );
};

export default SpansList;
