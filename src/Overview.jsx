import { useState, useMemo, useEffect } from "react";
import { Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import featureSetsData from './data/featureSetsData.json';

// Helper to compute severity from metrics
function computeSeverity(inRps, outRps) {
  const thresholds = featureSetsData.statusThresholds;
  if (inRps >= thresholds.crit.inRps || outRps >= thresholds.crit.outRps) return "crit";
  if (inRps >= thresholds.warn.inRps || outRps >= thresholds.warn.outRps) return "warn";
  return "ok";
}

export default function Overview() {
  const navigate = useNavigate();
  const [environment, setEnvironment] = useState("QA2");
  const [query, setQuery] = useState("");

  // Filter states
  const [componentFilters, setComponentFilters] = useState({});
  const [severityFilters, setSeverityFilters] = useState({
    'crit': true,
    'warn': true,
    'ok': true
  });

  // Get all unique component IDs for filter initialization
  const allComponentIds = useMemo(() => {
    const ids = new Set();
    featureSetsData.featureSets.forEach(fs => {
      fs.components.forEach(c => ids.add(c.id));
    });
    return Array.from(ids).sort();
  }, []);

  // Initialize component filters
  useEffect(() => {
    const initialFilters = {};
    allComponentIds.forEach(id => {
      initialFilters[id] = true;
    });
    setComponentFilters(initialFilters);
  }, [allComponentIds]);

  const filteredSets = useMemo(() => featureSetsData.featureSets.map(fs => ({
    ...fs,
    components: fs.components
      .map(c => ({
        ...c,
        severity: computeSeverity(c.inRps, c.outRps)
      }))
      .filter(c => {
        // Apply search filter
        const matchesSearch = query ? c.id.toLowerCase().includes(query.toLowerCase()) : true;
        // Apply component filter
        const matchesComponent = componentFilters[c.id] !== false;
        // Apply severity filter
        const matchesSeverity = severityFilters[c.severity] !== false;
        return matchesSearch && matchesComponent && matchesSeverity;
      })
  })).filter(fs => fs.components.length > 0), [query, componentFilters, severityFilters]);



  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: '#f8fafc',
      fontFamily: "Inter, system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
        width: '100%',
        overflow: 'hidden'
      }}>
        <Sparkles
          size={28}
          style={{
            color: '#eab308',
            transition: 'transform 0.3s ease',
            cursor: 'pointer'
          }}
        />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flex: 1,
          minWidth: 0
        }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#111827',
            margin: 0,
            whiteSpace: 'nowrap'
          }}>
            NexusNova — Environment Overview
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>Environment</label>
            <select
              value={environment}
              onChange={e => setEnvironment(e.target.value)}
              style={{
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '4px 8px'
              }}
            >
              {featureSetsData.envOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => navigate('/impact-analysis')}
            style={{
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f9fafb';
              e.target.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fff';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            Impact Analysis
          </button>
          <button
            onClick={() => navigate('/tracing')}
            style={{
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f9fafb';
              e.target.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fff';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
           Tracing
          </button>
        </div>
        <div style={{
          marginLeft: 'auto',
          position: 'relative',
          width: '280px',
          maxWidth: '280px',
          flexShrink: 0
        }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '10px',
              color: '#6b7280',
              zIndex: 1
            }}
            size={16}
          />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Find component in ${environment}`}
            style={{
              width: '100%',
              paddingLeft: '36px',
              paddingRight: '12px',
              paddingTop: '8px',
              paddingBottom: '8px',
              borderRadius: '12px',
              border: '1px solid #d1d5db',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '16px',
        flex: 1,
        overflow: 'hidden',
        padding: '16px'
      }}>
        {/* Left Sidebar - Filters */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            border: '1px solid #e5e7eb',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              padding: '8px 16px',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '14px',
              fontWeight: 600
            }}>
              Filters
            </div>

            {/* Component ID Filters */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#374151'
              }}>
                Components
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                fontSize: '13px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {allComponentIds.map(componentId => (
                  <label key={componentId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={componentFilters[componentId] !== false}
                      onChange={() => setComponentFilters(prev => ({
                        ...prev,
                        [componentId]: !prev[componentId]
                      }))}
                      style={{ cursor: 'pointer' }}
                    />
                    {componentId}
                  </label>
                ))}
              </div>
            </div>

            {/* Severity Filters */}
            <div style={{ padding: '16px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#374151'
              }}>
                Severity
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                fontSize: '13px'
              }}>
                {Object.keys(severityFilters).map(severity => (
                  <label key={severity} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={severityFilters[severity]}
                      onChange={() => setSeverityFilters(prev => ({
                        ...prev,
                        [severity]: !prev[severity]
                      }))}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{
                      color: severity === 'crit' ? '#dc2626' :
                             severity === 'warn' ? '#d97706' : '#059669'
                    }}>
                      {severity}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Feature Sets Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          overflow: 'auto',
          alignContent: 'start',
          maxHeight: 'calc(100vh - 140px)'
        }}>
        {filteredSets.map(fs => (
          <div
            key={fs.key}
            style={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '12px',
              transition: 'box-shadow 0.2s ease',
              background: '#fff',
              height: 'fit-content',
              minWidth: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px'
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: 600
              }}>{fs.name}</span>
              <div style={{
                marginLeft: 'auto',
                display: 'flex',
                gap: '6px'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/graph');
                  }}
                  style={{
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                  }}
                >
                  View in graph
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/impact-mode');
                  }}
                  style={{
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                  }}
                >
                  Impact mode
                </button>

              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              width: '100%'
            }}>
              {fs.components.map(c => (
                <div key={c.id} style={{
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  padding: '6px',
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background:
                          c.severity === "crit"
                            ? "#ef4444"
                            : c.severity === "warn"
                            ? "#f59e0b"
                            : "#10b981"
                      }}
                    />
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 500
                    }}>{c.id}</div>
                    <div style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      color: '#6b7280',
                      whiteSpace: 'nowrap'
                    }}>
                      {Math.round(c.inRps)}/{Math.round(c.outRps)}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '4px',
                    fontSize: '10px',
                    color: '#6b7280'
                  }}>
                    <span>Severity: {c.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
