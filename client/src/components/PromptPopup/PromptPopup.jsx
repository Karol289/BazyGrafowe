import { useState, useEffect } from 'react';
import './PromptPopup.css';

const PromptPopup = ({ isActive, setIsActive, setInput }) => {
  const [promptNames, setPromptNames] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addMode, setAddMode] = useState(false); // tryb dodawania
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptText, setNewPromptText] = useState("");

  const API_BASE = "http://127.0.0.1:8000/prompts";

  // pobranie listy nazw promptów
  useEffect(() => {
    if (!isActive) return;
    fetch(`${API_BASE}/getNames`)
      .then(res => res.json())
      .then(data => setPromptNames(data))
      .catch(err => console.error(err));
  }, [isActive]);

  // pobranie promptu po kliknięciu
  const handleSelectPrompt = (name) => {
    setLoading(true);
    setAddMode(false);
    fetch(`${API_BASE}/getSelected?promptName=${encodeURIComponent(name)}`)
      .then(res => res.json())
      .then(data => setSelectedPrompt(data.prompt))
      .catch(err => {
        console.error(err);
        setSelectedPrompt("Błąd wczytywania promptu");
      })
      .finally(() => setLoading(false));
  };

  const applyPropmt = () => {
    if (setInput) setInput(selectedPrompt);
    else console.warn("setInput is undefined");
  };

  const handleAddPrompt = () => {
    fetch(`${API_BASE}/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPromptName, prompt: newPromptText })
    })
      .then(res => {
        if (!res.ok) throw new Error("Błąd dodawania promptu");
        return res.json();
      })
      .then(data => {
        setPromptNames(prev => [...prev, newPromptName]);
        setNewPromptName("");
        setNewPromptText("");
        setAddMode(false);
      })
      .catch(err => console.error(err));
  };

  if (!isActive) return null;

  return (
    <div className="popupContainer">
      {/* LEWY SIDEBAR */}
      <div className="sidebarContainer">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div className="closeButton" onClick={() => setIsActive(false)}>X</div>
          <button className="addPromptButton" onClick={() => setAddMode(!addMode)}>
            Dodaj Prompt
          </button>
        </div>
        <ul>
          {promptNames.map((name, idx) => (
            <li key={idx} onClick={() => handleSelectPrompt(name)}>
              {name}
            </li>
          ))}
        </ul>
      </div>

      {/* PRAWA ZAWARTOŚĆ */}
      <div className="contentContainer">
        {loading && <p>Ładowanie...</p>}

        {!loading && addMode && (
          <>
            <input
              type="text"
              placeholder="Nazwa promptu"
              value={newPromptName}
              onChange={(e) => setNewPromptName(e.target.value)}
              style={{ width: "100%", marginBottom: "10px", padding: "5px" }}
            />
            <textarea
              placeholder="Treść promptu"
              value={newPromptText}
              onChange={(e) => setNewPromptText(e.target.value)}
              style={{ width: "100%", height: "400px", padding: "5px" }}
            />
            <button
              style={{ marginTop: "10px" }}
              onClick={handleAddPrompt}
            >
              Wyślij
            </button>
          </>
        )}

        {!loading && !addMode && selectedPrompt && (
          <>
            <pre className="promptText">{selectedPrompt}</pre>
            <button
              className="applyButton"
              onClick={applyPropmt}
            >
              Apply
            </button>
          </>
        )}

        {!loading && !addMode && !selectedPrompt && <p>Wybierz prompt po lewej</p>}
      </div>
    </div>
  );
};

export default PromptPopup;
