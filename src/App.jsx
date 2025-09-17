import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Overview from './Overview'
import FeatureSetGraphOTel from './FeatureSetGraphOTel'
import ImpactMode from './ImpactMode'
import ImpactAnalysis from './ImpactAnalysis'

export default function App() {
  return (
    <Router>
      <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/graph" element={<FeatureSetGraphOTel />} />
          <Route path="/impact-mode" element={<ImpactMode />} />
          <Route path="/impact-analysis" element={<ImpactAnalysis />} />
        </Routes>
      </div>
    </Router>
  )
}
