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

  //#region WebSocket

  //Deklaracja Websocketa
  const WS_URL = "ws://127.0.0.1:8000/ws"; 
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true,
    }
  );

  function validateJson(text)
  {
    try 
    {
      const json = JSON.parse(text)
      if(isNaN(text))
        return {valid: true, result: json}
    }
    catch
    {    }

    return {valid: false, result: text}
  }

  // Obsługa przychodzących wiadomości
  useEffect(() => {
  if (lastMessage !== null) {
    
    const END_SIGNAL = "[END]";

    const validatedJson = validateJson(lastMessage.data)
    //console.log(validatedJson)
    if(validatedJson.valid) //json
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
    else //not json or number
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
        setIsReceiving(true);
      }
    }

  }}, [lastMessage]);

  //#endregion


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

 

  async function handleOnNewChat()
  {
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
              sendMessage={sendMessage}
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
