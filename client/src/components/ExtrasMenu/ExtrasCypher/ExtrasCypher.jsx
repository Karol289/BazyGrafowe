import React, { useEffect, useState } from 'react';
import './ExtrasCypher.css';

const ExtrasCypher = ({ jsonData }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

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
  }, [jsonData?.Cypher]);

  return (
    <div className="extrasCypherWrapper">

      {/* Nodes */}
      {nodes.length > 0 && <div className="sectionHeader">Nodes</div>}
      <div className="nodeContainer">
        {nodes.map((node, index) => (
          <div key={index} className="nodeCard">
            <div className="nodeHeader">Node {index + 1}</div>
            {node && typeof node === 'object' ? (
              <div className="nodeProperties">
                {Object.entries(node).map(([key, value]) => (
                  <div key={key} className="nodeRow">
                    <span className="nodeKey">{key}</span>
                    <span className="nodeValue">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="nodeValue">{String(node)}</div>
            )}
          </div>
        ))}
      </div>

      {/* Edges */}
      {edges.length > 0 && <div className="sectionHeader">Edges</div>}
      <div className="nodeContainer">
        {edges.map((edge, index) => (
          <div key={index} className="nodeCard">
            <div className="nodeHeader">Edge {index + 1}</div>
            {edge && typeof edge === 'object' ? (
              <div className="nodeProperties">
                {Object.entries(edge).map(([key, value]) => (
                  <div key={key} className="nodeRow">
                    <span className="nodeKey">{key}</span>
                    <span className="nodeValue">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="nodeValue">{String(edge)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExtrasCypher;
