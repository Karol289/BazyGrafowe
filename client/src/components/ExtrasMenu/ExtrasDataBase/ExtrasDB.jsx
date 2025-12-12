import { useEffect, useState } from 'react';
import './ExtrasDB.css';

const EPANET_TYPES = ["Junction", "Tank", "Reservoir", "Pipe"];

const ExtrasDB = () => {

  const [stage, setStage] = useState("apply"); 
  
  const [linksAsTransportNodes, setLinksAsTransportNodes] = useState(false);
  const [useMappedModel, setUseMappedModel] = useState(false);

  const [formData, setFormData] = useState({
    user: "",
    password: "",
    url: "",
    isValid: false,
    message: ""
  });

  const [genTitle, setGenTitle] = useState("Neo4jNetwork");
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [unknownLabels, setUnknownLabels] = useState([]);
  const [nodeMapping, setNodeMapping] = useState({});
  const [generationStatus, setGenerationStatus] = useState(""); 

  async function handleSelectedDatabase() {
    try {
      const response = await fetch('http://127.0.0.1:8000/db/loginInfo', {
        method: "GET",
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
  
      setFormData((prev) => ({
        ...prev,
        user: data.user,
        password: data.password,
        url: data.url
      }));
  
      if(data.user && data.password && data.url) {
          verifyLogin(data.user, data.password, data.url);
      }
    } catch (e) {
      console.error("Błąd pobierania danych logowania", e);
    }
  }

  const verifyLogin = async (user, password, url) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/db/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password, url })
      });
      const data = await response.json();
      setFormData(prev => ({ ...prev, isValid: data.isValid, message: data.message }));
    } catch (e) { console.error(e); }
  };

  const handleLoginButton = () => {
    verifyLogin(formData.user, formData.password, formData.url);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    handleSelectedDatabase();
  }, []);

  async function applyToDB() {
    try {
      const response = await fetch("http://127.0.0.1:8000/db/ApplyToDB", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linksAsTransportNodes: linksAsTransportNodes,
            useMappedModel: useMappedModel 
          })
      });
      console.log(await response.json());
      setStage("confirm"); 
    } catch (e) { console.error("Błąd ApplyToDB", e); }
  }

  async function handleRollback() {
    await fetch("http://127.0.0.1:8000/db/RollbackDB", { method: "POST" }).catch(console.error);
    setStage("apply"); 
  }

  async function handleCommit() {
    await fetch("http://127.0.0.1:8000/db/CommitDB", { method: "POST" }).catch(console.error);
    setStage("apply"); 
  }

  const handleGenerateClick = async () => {
    if (!formData.isValid) {
      setGenerationStatus("Najpierw zaloguj się do bazy!");
      return;
    }
    setGenerationStatus("Pobieranie etykiet...");

    try {
      const res = await fetch('http://127.0.0.1:8000/db/labels');
      const data = await res.json();
      
      if(data.error) {
        setGenerationStatus(`Błąd: ${data.error}`);
        return;
      }

      const dbLabels = data.labels || [];
      
      const knownLower = EPANET_TYPES.map(t => t.toLowerCase());
      const unknown = dbLabels.filter(l => !knownLower.includes(l.toLowerCase()));

      const initialMap = {};
      
      dbLabels.forEach(l => {
          if (knownLower.includes(l.toLowerCase())) {
             initialMap[l] = l.toLowerCase(); 
          }
      });

      if (unknown.length > 0) {
        setUnknownLabels(unknown);
        
        unknown.forEach(l => {
            initialMap[l] = "junction"; 
            if (l.toLowerCase().includes("rura") || l.toLowerCase().includes("pipe")) {
                initialMap[l] = "pipe";
            }
        });
        
        setNodeMapping(initialMap);
        setShowMappingModal(true);
        setGenerationStatus("Wymagane mapowanie...");
      } else {
        setNodeMapping(initialMap); 
        await sendCreateRequest(initialMap);
      }

    } catch (e) {
      console.error(e);
      setGenerationStatus("Błąd połączenia z API.");
    }
  };

  const handleMappingChange = (label, epanetType) => {
    setNodeMapping(prev => ({
        ...prev,
        [label]: epanetType
    }));
  };

  const handleConfirmMapping = async () => {
    setShowMappingModal(false);
    await sendCreateRequest(nodeMapping);
  };

  const sendCreateRequest = async (mapping) => {
    setGenerationStatus("Generowanie (Neo4j -> .inp)...");
    try {
        const payload = {
            title: genTitle,
            graphAlgoritm: "kamada_kawai",
            mapping: mapping
        };

        const res = await fetch('http://127.0.0.1:8000/db/createEpanet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (data.status === "success") {
            setGenerationStatus(`Sukces! Plik: ${data.path}`);
        } else {
            setGenerationStatus(`Błąd: ${data.message || "Nieznany błąd"}`);
        }
    } catch (e) {
        console.error(e);
        setGenerationStatus("Błąd połączenia z serwerem.");
    }
  };

  return (
    <div className="extrasDBWrapper">
      
      <h2>Baza Neo4j</h2>
      <div className="formCell">
        <label>User:</label>
        <input type="text" name="user" value={formData.user} onChange={handleChange} />
      </div>
      <div className="formCell">
        <label>Password:</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} />
      </div>
      <div className="formCell">
        <label>URL:</label>
        <input type="text" name="url" value={formData.url} onChange={handleChange} />
      </div>
      <button className="submitButton" onClick={handleLoginButton}>
        Login / Check
      </button>
      
      <div className="messages">
        <div className="loginStatus">
          <span className={`statusDot ${formData.isValid ? "green" : "red"}`}></span>
          <span className="statusMessage">{formData.message}</span>
        </div>
      </div>

      <hr className="divider" />

      <h3>Eksport do Bazy</h3>
      {stage === "apply" && (
        <>
          <div className="checkboxCell">
            <input 
              type="checkbox" 
              id="transportNodesCheck"
              checked={linksAsTransportNodes}
              onChange={(e) => setLinksAsTransportNodes(e.target.checked)}
            />
            <label htmlFor="transportNodesCheck">Generate with transport nodes</label>
          </div>

          <div className="checkboxCell">
            <input 
              type="checkbox" 
              id="useMappedModelCheck"
              checked={useMappedModel}
              onChange={(e) => setUseMappedModel(e.target.checked)}
            />
            <label htmlFor="useMappedModelCheck">Use Mapped Model</label>
          </div>

          <div className="applyButton" onClick={applyToDB}>
            Zapisz do Neo4j
          </div>
        </>
      )}
      
      {stage === "confirm" && (
        <div className="confirmButtons">
          <div className="commitButton" onClick={handleCommit}>Commit</div>
          <div className="rollbackButton" onClick={handleRollback}>Rollback</div>
        </div>
      )}

      <hr className="divider" />

      <h3>Generowanie .inp z Bazy</h3>
      
      <div className="formCell">
        <label>Nazwa sieci:</label>
        <input 
            type="text" 
            value={genTitle} 
            onChange={(e) => setGenTitle(e.target.value)} 
        />
      </div>

      <div className="applyButton" onClick={handleGenerateClick}>
         Generuj z Neo4j
      </div>
      
      {generationStatus && (
          <div className="statusMessage small">{generationStatus}</div>
      )}


      {showMappingModal && (
        <div className="modalOverlay">
            <div className="modalContent">
                <h4>Mapowanie obiektów</h4>
                <p>W bazie znaleziono nieznane etykiety. Przypisz im typy EPANET.</p>
                
                <div className="mappingList">
                    {unknownLabels.map(label => (
                        <div key={label} className="mappingRow">
                            <span className="labelName">{label}</span>
                            <span className="arrow">➔</span>
                            <select 
                                value={nodeMapping[label]} 
                                onChange={(e) => handleMappingChange(label, e.target.value)}
                            >
                                <option value="junction">Junction</option>
                                <option value="pipe">Pipe</option>
                                <option value="tank">Tank</option>
                                <option value="reservoir">Reservoir</option>
                            </select>
                        </div>
                    ))}
                </div>

                <div className="modalActions">
                    <button className="cancelBtn" onClick={() => setShowMappingModal(false)}>Anuluj</button>
                    <button className="confirmBtn" onClick={handleConfirmMapping}>Generuj</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ExtrasDB;