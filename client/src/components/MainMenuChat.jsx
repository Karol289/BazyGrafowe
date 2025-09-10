
import ChatInput from "./ChatInput";
import ChatLog from "./ChatLog";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

import useWebSocket from "react-use-websocket"



const MainMenuChat = ((props, ref) => {

    const [chatLog, setChatLog] = useState([]);
    const [isReceiving, setIsReceiving] = useState(false);
    const [responseBuffor, setResponseBuffor] = useState("");

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

    // Obsługa przychodzących wiadomości
    useEffect(() => {

    if (lastMessage !== null) {
      
      const text = lastMessage.data;
      const END_SIGNAL = "[END]";

     // console.log(text)
      try
      {
        const json = JSON.parse(text);
        if(json.role !== "system")
        {
          let role = "";
          if(json.role === "user") role = "me";
          if(json.role === "assistant") role = "llm";

          setChatLog(prev => [...prev, {user: role, message:json.content }])
        }
      }
      catch(se) //syntaxerror ->> not json
      {
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


    return(
        <>
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
                >
            </ChatInput>
        
        </>
    )

    
});

export default MainMenuChat