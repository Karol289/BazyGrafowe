
import React, { useEffect, useState, useMemo } from 'react';
import '../ExtrasModel/ExtrasModel.css';
import './ExtrasMappedModel.css';

const ExtrasMappedModel = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // Stan dla przycisku
  const [error, setError] = useState(null);

  const [selectedLabel, setSelectedLabel] = useState("All");
  const [isNodesExpanded, setIsNodesExpanded] = useState(true);
  const [isEdgesExpanded, setIsEdgesExpanded] = useState(true);

  // --- KOMUNIKACJA Z API ---

  // 1. Funkcja tylko do pobierania danych (GET)
  const fetchData = async () => {
    try {
      // Nie ustawiamy globalnego loading na true przy odświeżaniu, żeby nie migać całym ekranem
      // setLoading(true); <- to robimy tylko przy pierwszym montowaniu w useEffect
      
      const response = await fetch('http://127.0.0.1:8000/chats/getTransform');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setNodes(Array.isArray(data?.nodes) ? data.nodes : []);
      setEdges(Array.isArray(data?.edges) ? data.edges : []);
      setError(null); // Czyścimy błędy w razie sukcesu
    } catch (err) {
      console.error("Failed to fetch Mapped Model:", err);
      setError(err.message);
    }
  };

  // 2. Funkcja do generowania i pobierania (PUT -> GET)
  const handleRegenerate = async () => {
    setIsRefreshing(true);
    try {
      // Krok A: Wymuś generowanie modelu
      const transformResponse = await fetch('http://127.0.0.1:8000/chats/transform', {
        method: 'PUT'
      });

      if (!transformResponse.ok) {
        throw new Error(`Transform failed! status: ${transformResponse.status}`);
      }

      // Krok B: Pobierz świeże dane
      await fetchData();

    } catch (err) {
      console.error("Regeneration failed:", err);
      setError("Failed to regenerate model: " + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 3. useEffect - Tylko pobiera dane przy otwarciu panelu
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    init();
  }, []);

  // --- OBLICZENIA (Memo) ---

  const availableLabels = useMemo(() => {
    const labelsSet = new Set();
    nodes.forEach(n => n.label && labelsSet.add(n.label));
    edges.forEach(e => e.label && labelsSet.add(e.label));
    return ["All", ...Array.from(labelsSet).sort()];
  }, [nodes, edges]);

  const filteredNodes = useMemo(() => {
    if (selectedLabel === "All") return nodes;
    return nodes.filter(n => n.label === selectedLabel);
  }, [nodes, selectedLabel]);

  const filteredEdges = useMemo(() => {
    if (selectedLabel === "All") return edges;
    return edges.filter(e => e.label === selectedLabel);
  }, [edges, selectedLabel]);

  // --- RENDER ---

  if (loading) return <div className="extrasModelWrapper" style={{color: '#a0a0a0', padding: '20px'}}>Loading model...</div>;
  if (error) return <div className="extrasModelWrapper" style={{color: '#ff4444', padding: '20px'}}>Error: {error}</div>;

  return (
    <div className="extrasModelWrapper">

      {/* --- SEKCJA FILTRACJI I AKCJI --- */}
      <div className="filterSection">
        
        {/* Przycisk Odświeżania */}
        <button 
          className="refreshButton" 
          onClick={handleRegenerate}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Generowanie..." : "↻ Przelicz i Odśwież"}
        </button>

        <div style={{height: '10px'}}></div> {/* Mały odstęp */}

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

      {/* --- NODES --- */}
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

      {/* --- EDGES --- */}
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

export default ExtrasMappedModel;