import { useState, useEffect } from 'react';
import './ExtrasEpanet.css';

const ExtrasEpanet = () => {
  const [formData, setFormData] = useState({
    title: "",
    graphAlgoritm: "kamada_kawai",
    useMappedModel: false
  });

  const [status, setStatus] = useState({ type: "", message: "" });

  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("options"); 
  
  const [settings, setSettings] = useState({
    options: {
      units: "LPS", headloss: "D-W", viscosity: 1.0, specific_gravity: 1.0, trials: 40, accuracy: 0.001
    },
    times: {
      duration: 86400, hydraulic_timestep: 3600, quality_timestep: 300, 
      report_timestep: 3600, pattern_timestep: 7200, start_clocktime: 0
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/epanet/options');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveSettings = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/epanet/options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setShowSettings(false);
        setStatus({ type: "success", message: "Settings saved." });
      } else {
        setStatus({ type: "error", message: "Error saving settings." });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Connection error." });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSettingChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleGenerate = async () => {
    if (!formData.title.trim()) {
      setStatus({ type: "error", message: "Title is required" });
      return;
    }

    setStatus({ type: "loading", message: "Generating..." });

    try {
      const response = await fetch('http://127.0.0.1:8000/epanet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus({ type: "success", message: ".inp file generated successfully!" });
      } else {
        setStatus({ type: "error", message: "Error during generation." });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Server connection error." });
    }
  };

  return (
    <div className="extrasEpanetWrapper">
      <h2>EPANET Generator</h2>

      <div className="formCell">
        <label>Title:</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Network title..."
        />
      </div>

      <div className="formCell">
        <label>Algorithm:</label>
        <select
          name="graphAlgoritm"
          value={formData.graphAlgoritm}
          onChange={handleChange}
        >
          <option value="kamada_kawai">Kamada Kawai</option>
          <option value="spring">Spring</option>
          <option value="circle">Circle</option>
        </select>
      </div>

      <div className="formCell checkboxRow">
        <label htmlFor="useMappedModel">Use Mapped Model:</label>
        <input
          id="useMappedModel"
          type="checkbox"
          name="useMappedModel"
          checked={formData.useMappedModel}
          onChange={handleChange}
        />
      </div>

      <button 
        className="settingsButton" 
        onClick={() => {
          fetchSettings();
          setShowSettings(true);
        }}
      >
        ⚙️ EPANET Options
      </button>

      <button className="submitButton" onClick={handleGenerate}>
        Generate
      </button>

      {status.message && (
        <div className={`statusMessage ${status.type}`}>
          {status.message}
        </div>
      )}

      {showSettings && (
        <div className="modalOverlay">
          <div className="modalContent">
            <div className="modalHeader">
              <h3>Global Settings</h3>
              <button className="closeX" onClick={() => setShowSettings(false)}>×</button>
            </div>
            
            <div className="tabs">
              <button 
                className={activeTab === 'options' ? 'active' : ''} 
                onClick={() => setActiveTab('options')}
              >
                Hydraulics
              </button>
              <button 
                className={activeTab === 'times' ? 'active' : ''} 
                onClick={() => setActiveTab('times')}
              >
                Times (s)
              </button>
            </div>

            <div className="settingsBody">
              {activeTab === 'options' && (
                <div className="settingsGrid">
                  <label>Flow Units</label>
                  <select 
                    value={settings.options.units} 
                    onChange={(e) => handleSettingChange('options', 'units', e.target.value)}
                  >
                    <option value="LPS">LPS (Liters/sec)</option>
                    <option value="LPM">LPM (Liters/min)</option>
                    <option value="CMS">CMS (m³/sec)</option>
                    <option value="GPM">GPM (Gallons/min)</option>
                    <option value="CMH">CMH (m³/h)</option>
                  </select>

                  <label>Headloss Formula</label>
                  <select 
                    value={settings.options.headloss} 
                    onChange={(e) => handleSettingChange('options', 'headloss', e.target.value)}
                  >
                    <option value="D-W">Darcy-Weisbach</option>
                    <option value="H-W">Hazen-Williams</option>
                    <option value="C-M">Chezy-Manning</option>
                  </select>

                  <label>Viscosity</label>
                  <input type="number" step="0.1" value={settings.options.viscosity} 
                    onChange={(e) => handleSettingChange('options', 'viscosity', parseFloat(e.target.value))} />

                  <label>Specific Gravity</label>
                  <input type="number" step="0.1" value={settings.options.specific_gravity} 
                    onChange={(e) => handleSettingChange('options', 'specific_gravity', parseFloat(e.target.value))} />
                  
                  <label>Trials</label>
                  <input type="number" value={settings.options.trials} 
                    onChange={(e) => handleSettingChange('options', 'trials', parseInt(e.target.value))} />

                  <label>Accuracy</label>
                  <input type="number" step="0.0001" value={settings.options.accuracy} 
                    onChange={(e) => handleSettingChange('options', 'accuracy', parseFloat(e.target.value))} />
                </div>
              )}

              {activeTab === 'times' && (
                <div className="settingsGrid">
                  <label>Duration</label>
                  <input type="number" value={settings.times.duration} 
                    onChange={(e) => handleSettingChange('times', 'duration', parseInt(e.target.value))} />

                  <label>Hydraulic Timestep</label>
                  <input type="number" value={settings.times.hydraulic_timestep} 
                    onChange={(e) => handleSettingChange('times', 'hydraulic_timestep', parseInt(e.target.value))} />

                  <label>Quality Timestep</label>
                  <input type="number" value={settings.times.quality_timestep || 0} 
                    onChange={(e) => handleSettingChange('times', 'quality_timestep', parseInt(e.target.value))} />

                  <label>Report Timestep</label>
                  <input type="number" value={settings.times.report_timestep} 
                    onChange={(e) => handleSettingChange('times', 'report_timestep', parseInt(e.target.value))} />
                  
                  <label>Pattern Timestep</label>
                  <input type="number" value={settings.times.pattern_timestep} 
                    onChange={(e) => handleSettingChange('times', 'pattern_timestep', parseInt(e.target.value))} />
                  
                  <label>Start Clocktime</label>
                  <input type="number" value={settings.times.start_clocktime} 
                    onChange={(e) => handleSettingChange('times', 'start_clocktime', parseInt(e.target.value))} />
                </div>
              )}
            </div>

            <div className="modalActions">
              <button className="cancelBtn" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="saveBtn" onClick={saveSettings}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtrasEpanet;