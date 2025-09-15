import { useEffect, useState } from 'react';
import './ExtrasDB.css';

const ExtrasDB = ({ jsonData }) => {

  const [stage, setStage] = useState("apply"); // "apply" | "confirm"

  const [formData, setFormData] = useState({
    user: "",
    password: "",
    url: "",
    isValid: "",
    message: ""
  });

  //#region Database

  async function handleSelectedDatabase() {
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

    if(data.user.trim() !== "" && data.password.trim() !== "" && data.url.trim() !== "")
        handleLoginDatabase();
  }

const handleLoginDatabase = async () => {
  const response = await fetch('http://127.0.0.1:8000/db/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: formData.user, password: formData.password, url: formData.url })
  });

  const data = await response.json();

  // Aktualizacja statusu i wiadomości
  setFormData((prev) => ({
    ...prev,
    isValid: data.isValid,
    message: data.message
  }));
};

  //#endregion

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    handleSelectedDatabase();
  }, []);

  async function applyToDB() {

    const response = await fetch("http://127.0.0.1:8000/db/ApplyToDB" , {
        method: "POST",
        headers: { 'Content-Type': 'application/json' }
    });

    console.log(await response.json)

    setStage("confirm"); // pokaż Commit i Rollback
    
  }

  async function handleRollback() {

    const rensponse = await fetch("http://127.0.0.1:8000/db/RollbackDB",
      {
        method: "POST",
        headers: { 'Content-Type': 'application/json' }
      }
    )
    .catch(err => console.log(err));

    setStage("apply"); // wróć do apply
  }

  async function handleCommit() {
    const rensponse = await fetch("http://127.0.0.1:8000/db/CommitDB",
      {
        method: "POST",
        headers: { 'Content-Type': 'application/json' }
      }
    )
    .catch(err => console.log(err));

    setStage("apply"); // wróć do apply
  }


  return (
    <div className="extrasDBWrapper">
      <h2>Dane logowania</h2>
      <div className="formCell">
        <label>User:</label>
        <input
          type="text"
          name="user"
          value={formData.user}
          onChange={handleChange}
        />
      </div>
      <div className="formCell">
        <label>Password:</label>
        <input
          type="text"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />
      </div>
      <div className="formCell">
        <label>URL:</label>
        <input
          type="text"
          name="url"
          value={formData.url}
          onChange={handleChange}
        />
      </div>
      <button className="submitButton" onClick={handleLoginDatabase}>
        Submit
      </button>
      <div className="messages">
      <div className="loginStatus">
        <span
          className={`statusDot ${formData.isValid === true ? "green" : formData.isValid === false ? "red" : ""}`}
        ></span>
        <span className="statusMessage">{formData.message}</span>
      </div>
      </div>

      <div className="extrasDBWrapper">
        {stage === "apply" && (
          <div className="applyButton" onClick={applyToDB}>
            Apply to database
          </div>
        )}
        {stage === "confirm" && (
          <div className="confirmButtons">
            <div className="commitButton" onClick={() => handleCommit()}>
              Commit
            </div>
            <div className="rollbackButton" onClick={() => handleRollback()}>
              Rollback
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtrasDB;
