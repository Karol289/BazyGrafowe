import { useState } from 'react'
import '../SideMenu/SideMenu.css'
import './Settings.css'
// import SettingsPopup from './SettingsPopup' // Zakomentowane, jeśli nieużywane
import PromptPopup from '../PromptPopup/PromptPopup'
import ModelsPopup from '../ModelsPopup/ModelsPopup' // 1. Importujemy nowy komponent

const Settings = ({ setInputtt }) => 
{
    const [isPromptActive, setIsPromptActive] = useState(false);
    const [isModelsActive, setIsModelsActive] = useState(false); // 2. Dodajemy stan dla ModelsPopup

    return (
        <>
            <div className="sideMenu-chats settingsMenu">
                
                {/* --- Przycisk Prompts --- */}
                <div className='sideMenu-chatContainer'
                    onClick={() => setIsPromptActive(true)} // 3. Otwieramy PromptPopup
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.2 1.2 4 3 5a5 5 0 0 1 1 3h6a5 5 0 0 1 1-3c1.8-1 3-2.8 3-5a7 7 0 0 0-7-7z"/>
                    </svg>
                    <label>Prompts</label>
                </div>

                {/* --- Przycisk Models --- */}
                <div 
                    className='sideMenu-chatContainer'
                    onClick={() => setIsModelsActive(true)} // 4. Otwieramy ModelsPopup
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 5h12M9 12h12M9 19h12"/><path d="M5 5h.01M5 12h.01M5 19h.01"/>
                    </svg>
                    <label>Models</label>
                </div>

                {/* (Zakomentowany przycisk Settings) */}
                
            </div>
            
            {/* --- Renderowanie Popupów --- */}
            <PromptPopup
                isActive={isPromptActive}
                setIsActive={setIsPromptActive}
                setInput={setInputtt}
            />
            
            <ModelsPopup
                isActive={isModelsActive}
                setIsActive={setIsModelsActive}
            />
        </>
    )
}

export default Settings