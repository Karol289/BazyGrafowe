import './normalise.css'
import './App.css';

import { useEffect, useRef, useState } from 'react';
import ChatMessage from './components/ChatMessage';

import useWebSocket, { ReadyState } from "react-use-websocket"

function App() {
  const [input, setInput] = useState("");
  const [chatLog, setChatLog] = useState([
    { user: "me", message: "Hello" },
    { user: "llm", message: "Hello I'm llm" },
  ]);

  const [isReceiving, setIsReceiving] = useState(false);
  const [responseBuffor, setResponseBuffor] = useState("");



  const WS_URL = "ws://127.0.0.1:8000/ws"; // <-- Dodano /ws
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true,
    }
  );

  // Obsługa przychodzących wiadomości
  useEffect(() => {

    if (lastMessage !== null) {
      
      const text = lastMessage.data;
      const END_SIGNAL = "[END]";
      console.log(text);
      if(text === END_SIGNAL)
      {
        setChatLog(prev => [...prev, {user: "llm", message: responseBuffor} ])
        setResponseBuffor("");
        setIsReceiving(false);
      }
      else
      {
        setResponseBuffor(mess => mess + text);
        setIsReceiving(true);
      }


    }

  }, [lastMessage]);

  // Wysyłanie wiadomości
  async function handleSubmit(e) {
    e.preventDefault();

    if (input.trim() === "" || readyState !== ReadyState.OPEN) return;

    // Dodaj do logu wiadomość użytkownika
    setChatLog((prev) => [...prev, { user: "me", message: input }]);

    // Wyślij do backendu
    sendMessage(input);

    // Wyczyść input
    setInput("");
  }

  return (
    <div className="App">
      <aside className='sideMenu'>
        <div className='sideMenu-button'>
          <span>+</span>
          New chat
        </div>
      </aside>

      <section className='mainMenu'>

        <div className='chat-log'>
          {chatLog.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          {isReceiving && responseBuffor && <ChatMessage key="buforMessage" message={{
            user: "llm",
            message: responseBuffor,
          }} />}
        </div>


        <div className='chat-input-holder'>
          <form onSubmit={handleSubmit}>
            <input 
              className='chat-input-textarea' 
              placeholder='Input your message here'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
            />
          </form>
        </div>

      </section>
    </div>
  );
}

export default App;
