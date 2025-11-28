import './normalise.css'
import './App.css';

import ChatInput from "./components/ChatInput";
import ChatLog from "./components/ChatLog";

import SideMenuChatHistory from './components/SideMenu/SideMenuChatHistory';
import { useEffect, useRef, useState} from 'react';

import useWebSocket from "react-use-websocket"
import ExtrasMenu from './components/ExtrasMenu/ExtrasMenu';

function App() {

  const [chatLog, setChatLog] = useState([]);
  const [isReceiving, setIsReceiving] = useState(false);
  const [responseBuffor, setResponseBuffor] = useState("");
  const [input, setInput] = useState("");
  const [extrasJson, setExtrasJson] = useState()

  const WS_URL = "ws://127.0.0.1:8000/ws"; 
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true,
    }
  );

  const handleSendMessage = (message) => {
      setResponseBuffor("");
      setIsReceiving(true); 
      sendMessage(message);
  }

  function validateJson(text)
  {
    try 
    {
      const json = JSON.parse(text)
      if (json && typeof json === 'object') {
        return { valid: true, result: json };
      } 
    }
    catch { }
    return {valid: false, result: text}
  }

  useEffect(() => {
  if (lastMessage !== null) {
    
    const END_SIGNAL = "[END]";
    const validatedJson = validateJson(lastMessage.data)

    if(validatedJson.valid) 
    {
      const json = validatedJson.result;

      if(json.IsExtra === true)
      {
        setExtrasJson(json);
        return;
      }

      if (json.role !== "system") {
        let role = "";
        if (json.role === "user") role = "me";
        if (json.role === "assistant") role = "llm";
      
        if (json.content && json.content.trim() !== "") {
          setChatLog(prev => [...prev, { user: role, message: json.content }]);
        }
      }
    }
    else 
    {
      const text = validatedJson.result;
      if(text === END_SIGNAL)
      {
        if(responseBuffor.trim() !== "")
          setChatLog(prev => [...prev, {user: "llm", message: responseBuffor} ]);
        setResponseBuffor("");
        setIsReceiving(false);
      }
      else
      {
        setResponseBuffor(mess => mess + text);
      }
    }

  }}, [lastMessage]);


  async function loadHistory() {
      setChatLog([])
      sendMessage(JSON.stringify({type: "loadChatLog"}))
  }
  const loadedRef = useRef(false);

  useEffect(() =>
  {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadHistory();
    }
  }, []);

  async function handleOnNewChat() {
    await loadHistory();
  }

  async function handleOnSelectChat() {
    await loadHistory();
  }


  return (
    <div className="App">

      <aside className='sideMenu'>
        <SideMenuChatHistory 
          onNewChat={handleOnNewChat}
          onSelectChat={handleOnSelectChat}
          setInputt={setInput}>
        </SideMenuChatHistory>
      </aside>

      <section className='mainMenu'>
            <ChatLog
                chatLog={chatLog}
                responseBuffor={responseBuffor}
                isReceiving={isReceiving}
                >
            </ChatLog>

            <ChatInput
              setChatLog={setChatLog}
              sendMessage={handleSendMessage} // ZMIANA: Przekazujemy wrapper
              readyState={readyState}
              input={input}
              setInput={setInput}>
            </ChatInput>
      </section>

      <section className='extrasMenu'>
        <ExtrasMenu
          jsonData={extrasJson}>
        </ExtrasMenu>
      </section>

    </div>
  );
}

export default App;