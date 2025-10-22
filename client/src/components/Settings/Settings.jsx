

import { useState } from 'react'
import '../SideMenu/SideMenu.css'
import './Settings.css'
import SettingsPopup from './SettingsPopup'
import PromptPopup from '../PromptPopup/PromptPopup'


const Settings = ({setInputtt}) => 
{
    const [isActive, setIsActive] = useState();

    return (

        <>

        <div className="sideMenu-chats settingsMenu">

            <div className='sideMenu-chatContainer'
            onClick={() => setIsActive(true)}>

                <svg xmlns="http://www.w3.org/2000/svg" 
                     width="20" height="20" 
                     viewBox="0 0 24 24" 
                     fill="none" 
                     stroke="currentColor" 
                     stroke-width="2" 
                     stroke-linecap="round" 
                     stroke-linejoin="round">
                  <path d="M9 18h6"/>
                  <path d="M10 22h4"/>
                  <path d="M12 2a7 7 0 0 0-7 7c0 2.2 1.2 4 3 5a5 5 0 0 1 1 3h6a5 5 0 0 1 1-3c1.8-1 3-2.8 3-5a7 7 0 0 0-7-7z"/>
                </svg>
                
                <label>Prompts</label>
                
            </div>

            <div className='sideMenu-chatContainer'>

                <svg xmlns="http://www.w3.org/2000/svg" 
                     width="20" height="20" 
                     viewBox="0 0 24 24" 
                     fill="none" 
                     stroke="currentColor" 
                     stroke-width="2" 
                     stroke-linecap="round" 
                     stroke-linejoin="round">
                  <path d="M9 5h12M9 12h12M9 19h12"/>
                  <path d="M5 5h.01M5 12h.01M5 19h.01"/>
                </svg>

                <label>Models</label>
            </div>
{/* 
            <div className='sideMenu-chatContainer'>

                <svg xmlns="http://www.w3.org/2000/svg" 
     width="20" height="20" 
     viewBox="0 0 24 24" 
     fill="none" 
     stroke="currentColor" 
     stroke-width="2" 
     stroke-linecap="round" 
     stroke-linejoin="round">
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 
           2 0 0 1-2.83 2.83l-.06-.06a1.65 
           1.65 0 0 0-1.82-.33 1.65 1.65 
           0 0 0-1 1.51V21a2 2 0 0 1-4 
           0v-.09a1.65 1.65 0 0 0-1-1.51 
           1.65 1.65 0 0 0-1.82.33l-.06.06a2 
           2 0 0 1-2.83-2.83l.06-.06a1.65 
           1.65 0 0 0 .33-1.82 1.65 1.65 
           0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09 
           c.7 0 1.31-.4 1.51-1a1.65 1.65 
           0 0 0-.33-1.82l-.06-.06a2 2 
           0 0 1 2.83-2.83l.06.06c.51.51 
           1.27.66 1.82.33.46-.27.75-.77 
           1-1.51V3a2 2 0 0 1 4 0v.09c0 
           .7.4 1.31 1 1.51.55.33 1.31.18 
           1.82-.33l.06-.06a2 2 0 0 1 
           2.83 2.83l-.06.06c-.39.39-.51.97-.33 
           1.82.2.6.81 1 1.51 1H21a2 2 0 0 1 
           0 4h-.09c-.7 0-1.31.4-1.51 
           1z"/>
                </svg>


                <label>{"Settings"}</label>
            </div> */}



        </div>
        
        <PromptPopup
            isActive={isActive}
            setIsActive={setIsActive}
            setInput={setInputtt}>
        </PromptPopup>
        
    </>

    )
}

export default Settings