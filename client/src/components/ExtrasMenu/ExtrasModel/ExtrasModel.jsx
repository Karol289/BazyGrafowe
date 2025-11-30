import React, { useEffect, useState, useMemo } from 'react';
import './ExtrasModel.css';

const ExtrasModel = ({ jsonData }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  // Stan filtrowania
  const [selectedLabel, setSelectedLabel] = useState("All");

  // Stan zwijania sekcji (domyślnie rozwinięte)
  const [isNodesExpanded, setIsNodesExpanded] = useState(true);
  const [isEdgesExpanded, setIsEdgesExpanded] = useState(true);

  // 1. Parsowanie danych
  useEffect(() => {
    const raw = jsonData?.Cypher;

    if (!raw) {
      setNodes([]);
      setEdges([]);
      return;
    }

    let parsed = null;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse Cypher:', e);
        setNodes([]);
        setEdges([]);
        return;
      }
    } else if (typeof raw === 'object') {
      parsed = raw;
    }

    setNodes(Array.isArray(parsed?.nodes) ? parsed.nodes : []);
    setEdges(Array.isArray(parsed?.edges) ? parsed.edges : []);
    
    // Reset filtra przy zmianie danych
    setSelectedLabel("All");
    // Reset widoczności przy zmianie danych (opcjonalnie)
    setIsNodesExpanded(true);
    setIsEdgesExpanded(true);
  }, [jsonData?.Cypher]);

  // 2. Wyznaczanie dostępnych labeli
  const availableLabels = useMemo(() => {
    const labelsSet = new Set();
    nodes.forEach(n => n.label && labelsSet.add(n.label));
    edges.forEach(e => e.label && labelsSet.add(e.label));
    return ["All", ...Array.from(labelsSet).sort()];
  }, [nodes, edges]);

  // 3. Filtrowanie list
  const filteredNodes = useMemo(() => {
    if (selectedLabel === "All") return nodes;
    return nodes.filter(n => n.label === selectedLabel);
  }, [nodes, selectedLabel]);

  const filteredEdges = useMemo(() => {
    if (selectedLabel === "All") return edges;
    return edges.filter(e => e.label === selectedLabel);
  }, [edges, selectedLabel]);

  return (
    <div className="extrasModelWrapper">

      {/* --- SEKCJA 1: FILTROWANIE --- */}
      <div className="filterSection">
        <label>Filter by Label:</label>
        <select 
          value={selectedLabel} 
          onChange={(e) => setSelectedLabel(e.target.value)}
          className="filterSelect"
        >
          {availableLabels.map(label => (
            <option key={label} value={label}>{label}</option>
          ))}
        </select>
      </div>

      {/* --- SEKCJA 2: NODES --- */}
      {/* Pokazujemy sekcję tylko jeśli są jakiekolwiek nody po przefiltrowaniu */}
      {filteredNodes.length > 0 && (
        <div className="sectionWrapper">
          <div 
            className="collapsibleHeader" 
            onClick={() => setIsNodesExpanded(prev => !prev)}
          >
            <span className={`arrow ${isNodesExpanded ? 'open' : ''}`}>▶</span>
            Nodes ({filteredNodes.length})
          </div>

          {isNodesExpanded && (
            <div className="itemsContainer">
              {filteredNodes.map((node, index) => (
                <div key={index} className="itemCard">
                  <div className="itemHeader">
                    {node.label || `Node ${index + 1}`}
                  </div>
                  <div className="itemProperties">
                    {Object.entries(node).map(([key, value]) => (
                      <div key={key} className="itemRow">
                        <span className="itemKey">{key}</span>
                        <span className="itemValue">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SEKCJA 3: EDGES --- */}
      {filteredEdges.length > 0 && (
        <div className="sectionWrapper">
          <div 
            className="collapsibleHeader" 
            onClick={() => setIsEdgesExpanded(prev => !prev)}
          >
             <span className={`arrow ${isEdgesExpanded ? 'open' : ''}`}>▶</span>
             Edges ({filteredEdges.length})
          </div>

          {isEdgesExpanded && (
            <div className="itemsContainer">
              {filteredEdges.map((edge, index) => (
                <div key={index} className="itemCard">
                  <div className="itemHeader">
                    {edge.label || `Edge ${index + 1}`}
                  </div>
                  <div className="itemProperties">
                    {Object.entries(edge).map(([key, value]) => (
                      <div key={key} className="itemRow">
                        <span className="itemKey">{key}</span>
                        <span className="itemValue">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ExtrasModel;