import ChatInput from "./ChatInput";
import ChatLog from "./ChatLog";
import { useEffect, useRef, useState } from 'react';
import useWebSocket from "react-use-websocket"

const MainMenuChat = ((props) => {

    const [chatLog, setChatLog] = useState([]);
    const [isReceiving, setIsReceiving] = useState(false);
    const [responseBuffor, setResponseBuffor] = useState("");

    const WS_URL = "ws://127.0.0.1:8000/ws"; 
    const { sendMessage, lastMessage, readyState } = useWebSocket(
      WS_URL,
      {
        share: false,
        shouldReconnect: () => true,
      }
    );

    // Wrapper: ustawia loading natychmiast po wysłaniu
    const handleSendMessage = (message) => {
        setResponseBuffor("");
        setIsReceiving(true);
        console.error("kurwo");
        //sendMessage(message);
    }

    useEffect(() => {
        if (lastMessage !== null) {
            const text = lastMessage.data;
            const END_SIGNAL = "[END]";

            try {
                const json = JSON.parse(text);
                if(json.role !== "system") {
                    let role = "";
                    if(json.role === "user") role = "me";
                    if(json.role === "assistant") role = "llm";
                    setChatLog(prev => [...prev, {user: role, message:json.content }])
                }
            }
            catch(se) {
                if(text === END_SIGNAL) {
                    if(responseBuffor.trim() !== "")
                        setChatLog(prev => [...prev, {user: "llm", message: responseBuffor} ]);
                    
                    setResponseBuffor("");
                    setIsReceiving(false);
                }
                else {
                    setResponseBuffor(mess => mess + text);
                }
            }
        }
    }, [lastMessage]);

    async function loadHistory() {
        setChatLog([])
        sendMessage(JSON.stringify({type: "loadChatLog"}))
    }

    const loadedRef = useRef(false);
    useEffect(() => {
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
            />

            <ChatInput
                setChatLog={setChatLog}
                sendMessage={handleSendMessage} 
                readyState={readyState}
            />
        </>
    )
});

export default MainMenuChat