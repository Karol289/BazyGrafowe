import { useState } from 'react';
import './ExtrasEpanet.css';

const ExtrasEpanet = () => {
  const [formData, setFormData] = useState({
    title: "",
    graphAlgoritm: "kamada_kawai" // domyślna wartość
  });

  const [status, setStatus] = useState({ type: "", message: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerate = async () => {
    if (!formData.title.trim()) {
      setStatus({ type: "error", message: "Tytuł jest wymagany" });
      return;
    }

    setStatus({ type: "loading", message: "Generowanie..." });

    try {
      const response = await fetch('http://127.0.0.1:8000/epanet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          graphAlgoritm: formData.graphAlgoritm
        })
      });

      if (response.ok) {
        setStatus({ type: "success", message: "Plik .inp wygenerowany pomyślnie!" });
      } else {
        setStatus({ type: "error", message: "Błąd podczas generowania." });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Błąd połączenia z serwerem." });
    }
  };

  return (
    <div className="extrasEpanetWrapper">
      <h2>Generator EPANET</h2>

      <div className="formCell">
        <label>Title:</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Nazwa sieci..."
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

      <button className="submitButton" onClick={handleGenerate}>
        Generate
      </button>

      {status.message && (
        <div className={`statusMessage ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
};

export default ExtrasEpanet;