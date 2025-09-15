

import { useState, useEffect } from 'react'
import './SettingsPopup.css'

const SettingsPopup = ({isActive, setIsActive}) =>
{

    const contentOptions = Object.freeze(
        {
            DataBase: "DataBase",
            Test: "Test"
        }
    )

    const [selectedContent, setSelectedContent] = useState(contentOptions.DataBase);
    const [formData, setFormData] = useState(
        {
            user: "",
            password: "",
            url: "",
            isValid: "",
            message: ""
        }
    );


    //#region Database

    async function handleSelectedDatabase() {
        setSelectedContent(contentOptions.DataBase);

        const response = await fetch('http://127.0.0.1:8000/db/loginInfo',
            {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
            }
        );

        const data = await response.json();

        formData.user = data.user;
        formData.password = data.password;
        formData.url = data.url;
    }

    async function handleLoginDatabase()
    {
        const response = await fetch('http://127.0.0.1:8000/db/login' ,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({user: formData.user, password: formData.password, url: formData.url})
            }
        );

        const data = await response.json();

        console.log(data);
        
    }

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
    }, [])


    if(!isActive) return null

    return(

        <div className="popupContainer">

            <div className="sidebarContainer">

                <div className='closeButton'
                onClick={() => setIsActive(false)}>
                    X
                </div>

                <ul>
                    <li
                    onClick={() => {handleSelectedDatabase();}}>
                        Baza danych
                    </li>

                                        <li
                    onClick={() => setSelectedContent(contentOptions.Test)}>
                        Test
                    </li>

                </ul>

            </div>

            <div className="contentContainer">
                <h1>{selectedContent}</h1>

                {selectedContent === contentOptions.DataBase && (
                    <>
                    <h2>Dane</h2>
                    <div className='cell'>
                        <label>User: </label>
                        <input type='text'
                            name='user'
                            value={formData.user}
                            onChange={handleChange}></input>
                    </div>
                    <div className='cell'>
                        <label>Password: </label>
                        <input type='text'
                            name='password'
                            value={formData.password}
                            onChange={handleChange}></input>
                    </div>
                    <div className='cell'>
                        <label>URL: </label>
                        <input type='text'
                            name='url'
                            value={formData.url}
                            onChange={handleChange}></input>
                    </div>
                    <button onClick={() => handleLoginDatabase()}> Submit </button>
                    <label>{formData.isValid}</label>
                    <label>{formData.message}</label>
                    </>
                )}


            </div>

        </div>
        



    )
}

export default SettingsPopup