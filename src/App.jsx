import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Overview from "./Overview";
import FeatureSetGraphOTel from "./FeatureSetGraphOTel";
import ImpactMode from "./ImpactMode";
import ImpactAnalysis from "./ImpactAnalysis";
import TracingScreen from "./TracingScreen";
import JaegerLikeTraceViewerReactSingleFile from "./JaegerLikeTraceViewerReactSingleFile";

export default function App() {
  return (
    <Router>
      <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/graph" element={<FeatureSetGraphOTel />} />
          <Route path="/impact-mode" element={<ImpactMode />} />
          <Route path="/impact-analysis" element={<ImpactAnalysis />} />
          <Route path="/tracing" element={<TracingScreen />} />
          <Route path="/jaeger-trace-viewer" element={<JaegerLikeTraceViewerReactSingleFile />} />
        </Routes>
      </div>
    </Router>
  );
}
