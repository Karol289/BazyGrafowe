
import { useState } from "react";

import './Css/ChatHistory.css'

import Popup from "./Popup";

const ChatHistory = ({onNewChat}) =>
{

    const [chats, setChats] = useState(["chat1", "chat2", "chat3"]);

    const [popupInput, setPopupInput] = useState("")
    const [popupState, setPopupState] = useState(false);


    async function handleAddChat(e) {
        e.preventDefault();

        onNewChat()
        setChats((prev) => [popupInput, ...prev,])

        setPopupState(false)
    
    };


    return (
        <>

        <div className='sideMenu-button'
          onClick={() => setPopupState(true)}>
          <span>+</span>
            New chat
        </div>


        {chats.map((chatTitle, index) => (
            <div className="sideMenu-chatContainer" key={index}>
                <div className="sideMenu-chatContainer-svg">
                    <svg className="svg" xmlns="http://www.w3.org/2000/svg" 
                        width="20" height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                    {chatTitle}
            </div>
        ))}


        <Popup openPopup={popupState}
            title ="Adding new chat">
                <form onSubmit={handleAddChat}>
                    <input className="newChat-input" type='text' value={popupInput} onChange={(e) => setPopupInput(e.target.value)}/>
                    <button className="newChat-submit" type="submit">Add chat</button>
                    <button className="newChat-cancel"type="button" onClick={() => setPopupState(false)}>Cancel</button>
                </form>


        </Popup>
    {/* {
        openPopup &&
        <div className="popup">
            <form onSubmit={handleAddChat}>

                <input className="popup-text"
                 placeholder='How to you want to name new chat?'
                 value={popupInput}
                 onChange={(e) => setPopupInput(e.target.value)}/>
                 
            </form>
        </div>
    } */}
        


        </>
    )
}

export default ChatHistory