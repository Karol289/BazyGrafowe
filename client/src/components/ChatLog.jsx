


import ChatMessage from './ChatMessage'
import React from 'react';


const ChatLog = ({chatLog, responseBuffor, isReceiving}) =>
{

    const bottomScrollRef = React.useRef(null);

    //Przeiwjanie w dół
    React.useEffect(() => {
        bottomScrollRef.current.scrollIntoView({ behavior: "smooth" });
    }, [responseBuffor]);

    return(
        <div className='chat-log'>
          {chatLog.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          {isReceiving && responseBuffor && <ChatMessage key="buforMessage" message={{
            user: "llm",
            message: responseBuffor,
          }} />}
          <div ref={bottomScrollRef}></div>
        </div>
    )

}

export default ChatLog