import { useEffect, useState } from "react";
import '../SideMenu/SideMenu.css'
import Popup from "../Popup.jsx";
import Settings from "../Settings/Settings.jsx";

const SideMenuChatHistory = ({ onNewChat, onSelectChat, setInputt }) => {

    const [chats, setChats] = useState([]);
    const [currentChat, setCurrentChat] = useState();

    // Stan dla dodawania
    const [popupInput, setPopupInput] = useState("");
    const [popupState, setPopupState] = useState(false);

    // Stan dla usuwania
    const [deletePopupState, setDeletePopupState] = useState(false);
    const [chatToDelete, setChatToDelete] = useState(null);

    // --- ADD CHAT ---

    async function handleAddChat(e) {
        e.preventDefault();
        
        // Czekamy na dodanie
        await AddChat(popupInput);
        // Potem odświeżamy
        await RefreshChats();
        await onNewChat();
        
        setPopupState(false);
        setPopupInput("");
    };

    async function AddChat(title) {
        const response = await fetch('http://127.0.0.1:8000/chats/addNewChat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        await response.json();
    }

    // --- DELETE CHAT ---

    function openDeleteConfirm(e, id) {
        e.stopPropagation(); // Zapobiega wybraniu chata przy kliknięciu w kosz
        setChatToDelete(id);
        setDeletePopupState(true);
    }

    async function confirmDeleteChat(e) {
        e.preventDefault();

        if (chatToDelete !== null) {
            let nextChatId = null;

            // Logika wyboru następnego chatu (Starszy -> Nowszy)
            if (String(chatToDelete) === currentChat) {
                const index = chats.findIndex(c => c.id === chatToDelete);
                if (index !== -1) {
                    if (index + 1 < chats.length) {
                        nextChatId = chats[index + 1].id; // Starszy
                    } else if (index - 1 >= 0) {
                        nextChatId = chats[index - 1].id; // Nowszy
                    }
                }
            }

            await fetch('http://127.0.0.1:8000/chats/deleteChat', {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: chatToDelete })
            });

            if (nextChatId) {
                await SelectChat(nextChatId);
            } else if (String(chatToDelete) === currentChat) {
                // Jeśli nie znaleziono sąsiada (np. lista stała się pusta lub usunięto ostatni), wybierz najnowszy dostępny
                const res = await fetch('http://127.0.0.1:8000/chats/getChatNames');
                const data = await res.json();
                if (data.chats.length > 0) {
                    await SelectChat(data.chats[0].id);
                } else {
                    setCurrentChat(null); // Brak chatów
                }
            }

            await RefreshChats();
        }

        setDeletePopupState(false);
        setChatToDelete(null);
    }

    // --- GENERAL ---

    async function RefreshChats() {
        try {
            const response = await fetch('http://127.0.0.1:8000/chats/getChatNames');
            if (!response.ok) throw new Error("Network response was not ok");
            const json = await response.json();
            
            setChats(json['chats']);
            setCurrentChat(json['current']);
        } catch (error) {
            console.error("Fetch error:", error);
        }
    }

    async function SelectChat(id) {
        await fetch('http://127.0.0.1:8000/chats/selectChat', {
            method: "PUT",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        await onSelectChat();
        setCurrentChat(String(id));
    }

    useEffect(() => {
        RefreshChats();
    }, []);

    return (
        <>
            <div className='sideMenu-button' onClick={() => setPopupState(true)}>
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
                        <div className="svg-chat">
                            <svg className="svg" xmlns="http://www.w3.org/2000/svg"
                                width="20" height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        
                        <span className="chat-title-text">{chat.title}</span>

                        {/* Ikona kosza */}
                        <div className="svg-chat delete-icon" onClick={(e) => openDeleteConfirm(e, chat.id)}>
                             <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18" 
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#8e8ea0" 
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

            <Settings setInputtt={setInputt} />

            {/* Popup 1: New Chat */}
            <Popup openPopup={popupState} title="Adding new chat">
                <form onSubmit={handleAddChat}>
                    <input 
                        className="newChat-input" 
                        type='text' 
                        value={popupInput} 
                        onChange={(e) => setPopupInput(e.target.value)} 
                        autoFocus
                    />
                    <div className="popup-buttons">
                        <button className="newChat-submit" type="submit">Add chat</button>
                        <button className="newChat-cancel" type="button" onClick={() => setPopupState(false)}>Cancel</button>
                    </div>
                </form>
            </Popup>

            {/* Popup 2: Delete Confirmation */}
            <Popup openPopup={deletePopupState} title="Delete chat?">
                <div className="delete-confirmation-wrapper">
                    <p style={{marginBottom: '20px', color: '#ccc'}}>
                        Are you sure you want to delete this chat? This action cannot be undone.
                    </p>
                    <div className="popup-buttons">
                        <button className="deleteChat-confirm" onClick={confirmDeleteChat}>Delete</button>
                        <button className="newChat-cancel" onClick={() => setDeletePopupState(false)}>Cancel</button>
                    </div>
                </div>
            </Popup>
        </>
    )
}

export default SideMenuChatHistory