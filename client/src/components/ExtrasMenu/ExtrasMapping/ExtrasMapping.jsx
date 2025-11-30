import React, { useEffect, useState, useMemo } from 'react';
import './ExtrasMapping.css';

const ExtrasMapping = ({ jsonData }) => {
  // --- STATE ---
  const [existingMappers, setExistingMappers] = useState([]);
  
  const [selectedLabel, setSelectedLabel] = useState("");
  const [mappingName, setMappingName] = useState("");
  
  const [sourceProperties, setSourceProperties] = useState([]);

  // Formularz wyjściowy
  const [outputNodes, setOutputNodes] = useState([]);
  const [outputEdges, setOutputEdges] = useState([]);

  // UI State
  const [isSourceExpanded, setIsSourceExpanded] = useState(true);
  const [isOutputExpanded, setIsOutputExpanded] = useState(true);

  // --- 1. ANALIZA JSON ---
  const { labels, schema } = useMemo(() => {
    const raw = jsonData?.Cypher;
    let nodes = [];
    
    if (raw) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        nodes = Array.isArray(parsed?.nodes) ? parsed.nodes : [];
      } catch (e) { console.error(e); }
    }

    const uniqueLabels = new Set();
    const schemaMap = {}; 

    nodes.forEach(node => {
        if (node.label) {
            uniqueLabels.add(node.label);
            
            // Poprawka z poprzedniego kroku (brak duplikatów id)
            if (!schemaMap[node.label]) schemaMap[node.label] = new Set(); 
            
            Object.keys(node).forEach(key => schemaMap[node.label].add(key));
        }
    });

    return { 
        labels: Array.from(uniqueLabels).sort(),
        schema: schemaMap
    };
  }, [jsonData]);

  // --- 2. POBIERANIE MAPPERÓW ---
  useEffect(() => {
    fetch('http://127.0.0.1:8000/chats/getMappers')
        .then(res => res.json())
        .then(data => setExistingMappers(data || []))
        .catch(err => console.error("Error fetching mappers:", err));
  }, []);

  // --- 3. AKTUALIZACJA FORMULARZA ---
  useEffect(() => {
    if (!selectedLabel) {
        setSourceProperties([]);
        setMappingName("");
        setOutputNodes([]);
        setOutputEdges([]);
        return;
    }

    if (schema[selectedLabel]) {
        setSourceProperties(Array.from(schema[selectedLabel]));
    }

    const existing = existingMappers.find(m => m.sourceNode === selectedLabel);
    if (existing) {
        setMappingName(existing.name);
        
        const mappedNodes = (existing.outputNodes || []).map(n => ({
            ...n,
            tempId: n.tempid || n.tempId,
            primaryNode: n.primarynode || n.primaryNode,
            properties: n.properties || []
        }));

        const mappedEdges = (existing.outputEdges || []).map(e => ({
            ...e,
            tempFrom: e.tempfrom || e.tempFrom,
            tempTo: e.tempto || e.tempTo,
            properties: e.properties || []
        }));

        setOutputNodes(mappedNodes);
        setOutputEdges(mappedEdges);
    } else {
        setMappingName(`Map_${selectedLabel}`);
        setOutputNodes([]);
        setOutputEdges([]);
    }

  }, [selectedLabel, existingMappers, schema]);

  // --- HELPERS ---

  const handleSetPrimary = (index) => {
    setOutputNodes(prev => prev.map((node, i) => ({
        ...node,
        primaryNode: i === index
    })));
  };

  // Definicja obowiązkowych pól
  const getMandatoryProperties = () => [
      { type: "copy", targetProperty: "Id", sourceProperty: "id", value: "" },
      { type: "const", targetProperty: "label", value: "" }
  ];

  const addOutputNode = () => {
    setOutputNodes(prev => [...prev, {
        tempId: `node_${prev.length + 1}`,
        primaryNode: prev.length === 0,
        // Dodajemy obowiązkowe pola przy tworzeniu
        properties: getMandatoryProperties()
    }]);
  };

  const addOutputEdge = () => {
    setOutputEdges(prev => [...prev, {
        tempFrom: "",
        tempTo: "",
        // Dodajemy obowiązkowe pola przy tworzeniu
        properties: getMandatoryProperties()
    }]);
  };

  const removeOutputNode = (index) => {
    setOutputNodes(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeOutputEdge = (index) => {
    setOutputEdges(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (setter, index, field, value) => {
    setter(prev => {
        const newArr = [...prev];
        newArr[index] = { ...newArr[index], [field]: value };
        return newArr;
    });
  };

  const addProperty = (setter, itemIndex) => {
    setter(prev => {
        const newArr = [...prev];
        const item = { ...newArr[itemIndex] };
        item.properties = [...(item.properties || []), { type: "copy", targetProperty: "", sourceProperty: "", value: "" }];
        newArr[itemIndex] = item;
        return newArr;
    });
  };

  const updateProperty = (setter, itemIndex, propIndex, field, value) => {
    setter(prev => {
        const newArr = [...prev];
        const item = { ...newArr[itemIndex] };
        const props = [...item.properties];
        props[propIndex] = { ...props[propIndex], [field]: value };
        item.properties = props;
        newArr[itemIndex] = item;
        return newArr;
    });
  };

  const removeProperty = (setter, itemIndex, propIndex) => {
    setter(prev => {
        const newArr = [...prev];
        const item = { ...newArr[itemIndex] };
        item.properties = item.properties.filter((_, i) => i !== propIndex);
        newArr[itemIndex] = item;
        return newArr;
    });
  };

  // --- SAVE ---
  const handleSave = async () => {
    const payload = {
        Name: mappingName,
        From: selectedLabel,
        outputNodes: outputNodes,
        outputEdges: outputEdges
    };

    try {
        const res = await fetch('http://127.0.0.1:8000/chats/addMapping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log(data);
        alert("Mapping saved!");
    } catch (e) {
        console.error(e);
        alert("Error saving mapping");
    }
  };


  return (
    <div className="extrasMappingWrapper">
        
        {/* --- HEADER --- */}
        <div className="mappingHeaderSection">
            <div className="formGroup">
                <label>Source Node Label:</label>
                <select 
                    value={selectedLabel} 
                    onChange={(e) => setSelectedLabel(e.target.value)}
                    className="mappingSelect"
                >
                    <option value="">-- Select Label --</option>
                    {labels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
            
            <div className="formGroup">
                <label>Mapping Name:</label>
                <input 
                    type="text" 
                    value={mappingName} 
                    onChange={(e) => setMappingName(e.target.value)}
                    className="mappingInput"
                    placeholder="Transformation Name"
                />
            </div>
        </div>

        {selectedLabel && (
            <>
                {/* --- SECTION 1: SOURCE SCHEMA --- */}
                <div className="sectionWrapper">
                    <div className="collapsibleHeader" onClick={() => setIsSourceExpanded(!isSourceExpanded)}>
                         <span className={`arrow ${isSourceExpanded ? 'open' : ''}`}>▶</span>
                         Source Properties (Read-only)
                    </div>
                    {isSourceExpanded && (
                        <div className="schemaContainer">
                            {sourceProperties.map(prop => (
                                <span key={prop} className="schemaTag">{prop}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- SECTION 2: OUTPUT DEFINITION --- */}
                <div className="sectionWrapper">
                    <div className="collapsibleHeader" onClick={() => setIsOutputExpanded(!isOutputExpanded)}>
                         <span className={`arrow ${isOutputExpanded ? 'open' : ''}`}>▶</span>
                         Output Definition
                    </div>
                    
                    {isOutputExpanded && (
                        <div className="outputContainer">
                            
                            {/* NODES LIST */}
                            <div className="subSectionHeader">Output Nodes</div>
                            {outputNodes.map((node, idx) => (
                                <div key={idx} className="definitionCard">
                                    <div className="cardHeader">
                                        <span>Node #{idx + 1}</span>
                                        <button className="deleteBtn" onClick={() => removeOutputNode(idx)}>🗑</button>
                                    </div>
                                    <div className="cardRow">
                                        <input 
                                            placeholder="Temp ID" 
                                            value={node.tempId} 
                                            onChange={(e) => updateItem(setOutputNodes, idx, "tempId", e.target.value)}
                                            className="mappingInput small"
                                        />
                                        <label className="checkboxLabel">
                                            <input 
                                                type="checkbox" 
                                                checked={node.primaryNode || false} 
                                                onChange={() => handleSetPrimary(idx)}
                                            /> Primary
                                        </label>
                                    </div>
                                    
                                    <div className="propertiesList">
                                        {node.properties.map((prop, pIdx) => (
                                            <PropertyRow 
                                                key={pIdx} 
                                                prop={prop} 
                                                onChange={(field, val) => updateProperty(setOutputNodes, idx, pIdx, field, val)}
                                                onDelete={() => removeProperty(setOutputNodes, idx, pIdx)}
                                                sourceOptions={sourceProperties}
                                            />
                                        ))}
                                        <button className="addPropBtn" onClick={() => addProperty(setOutputNodes, idx)}>+ Property</button>
                                    </div>
                                </div>
                            ))}

                            {/* EDGES LIST */}
                            <div className="subSectionHeader" style={{marginTop: '15px'}}>Output Edges</div>
                            {outputEdges.map((edge, idx) => (
                                <div key={idx} className="definitionCard">
                                    <div className="cardHeader">
                                        <span>Edge #{idx + 1}</span>
                                        <button className="deleteBtn" onClick={() => removeOutputEdge(idx)}>🗑</button>
                                    </div>
                                    <div className="cardRow">
                                        <input 
                                            placeholder="From (Temp ID)" 
                                            value={edge.tempFrom} 
                                            onChange={(e) => updateItem(setOutputEdges, idx, "tempFrom", e.target.value)}
                                            className="mappingInput small"
                                        />
                                        <span>➔</span>
                                        <input 
                                            placeholder="To (Temp ID)" 
                                            value={edge.tempTo} 
                                            onChange={(e) => updateItem(setOutputEdges, idx, "tempTo", e.target.value)}
                                            className="mappingInput small"
                                        />
                                    </div>

                                    <div className="propertiesList">
                                        {edge.properties.map((prop, pIdx) => (
                                            <PropertyRow 
                                                key={pIdx} 
                                                prop={prop} 
                                                onChange={(field, val) => updateProperty(setOutputEdges, idx, pIdx, field, val)}
                                                onDelete={() => removeProperty(setOutputEdges, idx, pIdx)}
                                                sourceOptions={sourceProperties}
                                            />
                                        ))}
                                        <button className="addPropBtn" onClick={() => addProperty(setOutputEdges, idx)}>+ Property</button>
                                    </div>
                                </div>
                            ))}

                            {/* ACTION BUTTONS */}
                            <div className="actionButtons">
                                <button className="actionBtn" onClick={addOutputNode}>+ Add Node</button>
                                <button className="actionBtn" onClick={addOutputEdge}>+ Add Edge</button>
                            </div>

                        </div>
                    )}
                </div>

                <button className="submitButton mainSave" onClick={handleSave}>Save Mapping</button>
            </>
        )}
    </div>
  );
};

// --- SUB-COMPONENT: PROPERTY ROW ---
const PropertyRow = ({ prop, onChange, onDelete, sourceOptions }) => {
    
    // Sprawdzamy, czy to pole jest obowiązkowe (zablokowane)
    const isLocked = prop.targetProperty === "Id" || prop.targetProperty === "label";

    return (
        <div className={`propertyRow ${isLocked ? 'locked' : ''}`}>
            <select 
                value={prop.type} 
                onChange={(e) => onChange("type", e.target.value)}
                className="propSelect type"
            >
                <option value="copy">Copy</option>
                <option value="const">Const</option>
                <option value="random">Random</option>
            </select>

            <input 
                placeholder="Target Key" 
                value={prop.targetProperty} 
                onChange={(e) => onChange("targetProperty", e.target.value)}
                className="propInput"
                disabled={isLocked} // Zablokowana nazwa klucza
                title={isLocked ? "This property is mandatory" : ""}
            />

            {/* Conditional Input based on Type */}
            {prop.type === "copy" && (
                <select 
                    value={prop.sourceProperty || ""} 
                    onChange={(e) => onChange("sourceProperty", e.target.value)}
                    className="propSelect source"
                >
                    <option value="">- Source -</option>
                    {sourceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            )}

            {prop.type === "const" && (
                <input 
                    placeholder="Value" 
                    value={prop.value || ""} 
                    onChange={(e) => onChange("value", e.target.value)}
                    className="propInput"
                />
            )}

            {/* Renderujemy przycisk usuwania tylko jeśli NIE jest zablokowane */}
            {!isLocked ? (
                <button className="removePropBtn" onClick={onDelete}>×</button>
            ) : (
                <div className="lockedIcon" title="Cannot remove">🔒</div>
            )}
        </div>
    )
}

export default ExtrasMapping;