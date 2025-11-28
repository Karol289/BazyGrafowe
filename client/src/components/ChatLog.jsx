import ChatMessage from './ChatMessage'
import React from 'react';

const ChatLog = ({chatLog, responseBuffor, isReceiving}) =>
{
    const bottomScrollRef = React.useRef(null);

    React.useEffect(() => {
        bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [responseBuffor, chatLog, isReceiving]);

    return(
        <div className='chat-log'>
          {/* Historia rozmowy */}
          {chatLog.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          
          {/* Jeśli odbieramy I mamy już tekst w buforze -> wyświetl tekst */}
          {isReceiving && responseBuffor && (
            <ChatMessage 
                key="buforMessage" 
                message={{
                    user: "llm",
                    message: responseBuffor
                }} 
            />
          )}

          {/* Jeśli odbieramy ALE bufor jest pusty -> wyświetl loader (korzystając z nowej flagi) */}
          {isReceiving && !responseBuffor && (
             <ChatMessage 
                key="loadingMessage" 
                message={{
                    user: "llm",
                    loading: true 
                }} 
            />
          )}

          <div ref={bottomScrollRef}></div>
        </div>
    )
}

export default ChatLog