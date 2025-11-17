import { useState, useEffect } from 'react';
import './ModelsPopup.css'; // Używamy zaadaptowanego CSS

const ModelsPopup = ({ isActive, setIsActive }) => {
  const [loading, setLoading] = useState(false);
  const [modelOptions, setModelOptions] = useState([]);
  
  // Przechowuje stan formularza
  const [currentSettings, setCurrentSettings] = useState({
    type: "OpenAi",
    model: "",
    temperature: null,
    top_p: null,
    top_k: null,
  });

  // Przechowuje stan z serwera, aby sprawdzić, czy zaszły zmiany
  const [initialSettings, setInitialSettings] = useState({});

  const API_BASE = "http://127.0.0.1:8000/model";

  // --- Funkcje pomocnicze ---

  // 1. Pobieranie listy dostępnych modeli (POPRAWIONY FETCH)
  const fetchAvailableModels = (typeName) => {
    if (!typeName) return;
    
    setLoading(true);
    
    // Używamy POST i wysyłamy 'type' w JSON body
    fetch(`${API_BASE}/getAvaible`, { 
      method: 'POST', // Zmieniono na POST
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: typeName }) // Wysyłamy parametry w body
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Zabezpieczenie na wypadek, gdyby API zwróciło coś innego niż tablica
        if (Array.isArray(data)) {
          setModelOptions(data);
        } else {
          console.error("API /getAvaible nie zwróciło oczekiwanej tablicy modeli:", data);
          setModelOptions([]);
        }
      })
      .catch(err => {
        console.error("Błąd pobierania dostępnych modeli:", err);
        setModelOptions([]); // Zawsze ustaw pustą tablicę w razie błędu
      })
      .finally(() => setLoading(false));
  };

  // 2. Pobieranie bieżącej konfiguracji przy otwarciu (Ten fetch był poprawny)
  useEffect(() => {
    if (!isActive) return;

    setLoading(true);
    fetch(`${API_BASE}/current`) // Zwykły GET, bez body
      .then(res => res.json())
      .then(data => {
        setCurrentSettings(data);
        setInitialSettings(data);
        // Po pobraniu bieżących ustawień, od razu pobierz listę modeli dla aktywnego typu
        fetchAvailableModels(data.type);
      })
      .catch(err => console.error("Błąd pobierania bieżącego modelu:", err))
      .finally(() => setLoading(false));
  
  }, [isActive]); // Wyzwalane tylko przy otwarciu popupa

  
  // --- Obsługa Zdarzeń ---

  // 3. Zmiana typu (OpenAi/Ollama)
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setCurrentSettings(prev => ({
      ...prev,
      type: newType,
      model: "" // Resetuj model przy zmianie typu
    }));
    // Odśwież listę modeli (używając poprawionego fetcha)
    fetchAvailableModels(newType);
  };

  // 4. Zmiana pozostałych pól
  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    
    const isNumericField = ['temperature', 'top_p', 'top_k'].includes(name);
    
    setCurrentSettings(prev => ({
      ...prev,
      [name]: isNumericField ? (value === '' ? null : Number(value)) : value
    }));
  };

  // 5. Wysłanie aktualizacji (Ten fetch był poprawny)
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    fetch(`${API_BASE}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentSettings) // Wysyła cały obiekt w body
    })
    .then(res => {
      if (!res.ok) throw new Error("Błąd podczas aktualizacji modelu");
      setInitialSettings(currentSettings);
      setIsActive(false); // Zamknij popup po sukcesie
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
  };

  // 6. Sprawdzenie, czy dane się zmieniły (kontrola przycisku)
  const isDirty = JSON.stringify(currentSettings) !== JSON.stringify(initialSettings);

  if (!isActive) return null;

  return (
    <div className="popupContainer">
      <div className="contentContainer modelSettingsContainer">
        
        <div className="closeButton" onClick={() => setIsActive(false)}>X</div>
        
        <h3>Ustawienia Modelu</h3>

        {loading && <p>Ładowanie...</p>}

        {!loading && (
          <form className="settingsForm" onSubmit={handleSubmit}>
            
            {/* --- 1. Typ Modelu --- */}
            <div className="formGroup">
              <label htmlFor="modelType">Typ Modelu</label>
              <select 
                id="modelType"
                name="type"
                value={currentSettings.type}
                onChange={handleTypeChange}
              >
                <option value="OpenAi">OpenAi</option>
                <option value="Ollama">Ollama</option>
              </select>
            </div>

            {/* --- 2. Wybór Modelu --- */}
            <div className="formGroup">
              <label htmlFor="modelName">Model</label>
              <select
                id="modelName"
                name="model"
                value={currentSettings.model || ""}
                onChange={handleSettingChange}
                disabled={modelOptions.length === 0}
              >
                <option value="">-- Wybierz model --</option>
                {modelOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* --- 3. Parametry --- */}
            <div className="formRow">
              <div className="formGroup">
                <label htmlFor="temperature">Temperature</label>
                <input
                  type="number"
                  id="temperature"
                  name="temperature"
                  min="0"
                  max="2"
                  step="0.1"
                  value={currentSettings.temperature ?? ''}
                  onChange={handleSettingChange}
                  placeholder="np. 0.8"
                />
              </div>
              <div className="formGroup">
                <label htmlFor="top_p">Top P</label>
                <input
                  type="number"
                  id="top_p"
                  name="top_p"
                  min="0"
                  max="1"
                  step="0.1"
                  value={currentSettings.top_p ?? ''}
                  onChange={handleSettingChange}
                  placeholder="np. 0.9"
                />
              </div>
              <div className="formGroup">
                <label htmlFor="top_k">Top K</label>
                <input
                  type="number"
                  id="top_k"
                  name="top_k"
                  min="0"
                  step="1"
                  value={currentSettings.top_k ?? ''}
                  onChange={handleSettingChange}
                  placeholder="np. 40"
                />
              </div>
            </div>

            {/* --- 4. Przycisk Aktualizacji --- */}
            <button
              type="submit"
              className="updateButton"
              disabled={!isDirty || loading}
            >
              {loading ? "Aktualizowanie..." : "Aktualizuj"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModelsPopup;