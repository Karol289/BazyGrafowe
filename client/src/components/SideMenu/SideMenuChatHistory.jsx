
import { useEffect, useState } from "react";

import '../SideMenu/SideMenu.css'

import Popup from "../Popup.jsx";
import Settings from "../Settings/Settings.jsx";

const SideMenuChatHistory = ({onNewChat, onSelectChat, setInputt}) =>
{

    const [chats, setChats] = useState([]);
    let [currentChat, setCurrentChat] = useState();

    const [popupInput, setPopupInput] = useState("")
    const [popupState, setPopupState] = useState(false);



    async function handleAddChat(e) {
        e.preventDefault();


        AddChat(popupInput)
        RefreshChats()
        await onNewChat()
        setPopupState(false)
    
    };

    async function AddChat(title)
    {
        const response = await fetch('http://127.0.0.1:8000/chats/addNewChat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });

        const data = await response.json();
        //console.log(data);

    }

    async function RefreshChats()
    {
        setChats([]);
        fetch('http://127.0.0.1:8000/chats/getChatNames')
        .then((response) => {
            if(!response.ok) throw new Error("Network response was not ok");
            return response.json();
        })
        .then((json) => {
            setChats(json['chats']);
            setCurrentChat(json['current']);    
        }
        )
        .catch((error) => console.error("Fetch error:", error));
    }

    async function SelectChat(id) {
        await fetch('http://127.0.0.1:8000/chats/selectChat',
            {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body :JSON.stringify({id})
            }
        )

        //refresh chat log
        await onSelectChat();
        setCurrentChat(String(id));
    }



    useEffect(() => {
        RefreshChats();
    }, []);

    return (
        <>

        <div className='sideMenu-button'
          onClick={() => setPopupState(true)}>
          <span>+</span>
            New chat
        </div>

        <div className="sideMenu-chats">
            {chats.map((chat) => (
                <div 
                    className={`sideMenu-chatContainer ${currentChat === String(chat.id) ? "selected" : ""}`} 
                    key={chat.id}
                    onClick={() => SelectChat(chat.id)}
                    >
                    {/* {console.log(currentChat + " " + chat.id)} */}
                    <div className="svg-chat">
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
                        {chat.title} 
                    <div className="svg-chat">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="red"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                    </div>
                </div>
            ))}
        </div>

        <Settings
        setInputtt={setInputt}>

        </Settings>


        {/* New Chat Popup */}
        <Popup openPopup={popupState}
            title ="Adding new chat">
                <form onSubmit={handleAddChat}>
                    <input className="newChat-input" type='text' value={popupInput} onChange={(e) => setPopupInput(e.target.value)}/>
                    <button className="newChat-submit" type="submit">Add chat</button>
                    <button className="newChat-cancel"type="button" onClick={() => setPopupState(false)}>Cancel</button>
                </form>


        </Popup>

    
        </>
    )
}

export default SideMenuChatHistory