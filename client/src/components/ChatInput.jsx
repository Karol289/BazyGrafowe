
import { useEffect, useRef, useState } from 'react';
import { ReadyState } from "react-use-websocket"


const ChatInput = ({sendMessage, setChatLog, readyState}) => 
{
  const [input, setInput] = useState("");

  let [selectedOption, setSelectedOption] = useState();


  const OPTIONS = Object.freeze({
    Prompt: "Prompt",
    Cypher: "Cypher",
    Describe: "Describe",
  });



  // Wysyłanie wiadomości
  async function handleSubmit(e) {
    e.preventDefault();
    sendChatMessage();
  }
  async function sendChatMessage()
  {
    let textFromInput = input;
    
    if (selectedOption === OPTIONS.Cypher)
      textFromInput = "Cypher";
    if(selectedOption === OPTIONS.Describe)
      textFromInput = "Describe";

    if (textFromInput.trim() === "" || readyState !== ReadyState.OPEN) return;
    // Dodaj do logu wiadomość użytkownika
    if(selectedOption === OPTIONS.Prompt)
      setChatLog((prev) => [...prev, { user: "me", message: textFromInput }]);
    // Wyślij do backendu
    sendMessage(JSON.stringify({type: String(selectedOption), message: textFromInput}));
    // Wyczyść input
    setInput("");
  }


  return(
    <div className='chat-input-holder'>

      <select
        value={selectedOption}
        onChange={(e) => setSelectedOption(e.target.value)}
        placeholder="Select prompt type">
          <option selected disabled hidden>Select prompt type</option>
        {
          Object.values(OPTIONS).map(key => 
            <option value={key}>{key}</option>
          )
        }
      </select>

      <form onSubmit={handleSubmit}>

        {selectedOption === OPTIONS.Prompt && (
          <textarea 
            className='chat-input-textarea' 
            placeholder='Input your message here'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            onKeyDown={(e) => {
              if(e.key === "Enter" && !e.shiftKey)
              {
                e.preventDefault();
                sendChatMessage();
              }
            }}
          />)
        }
        <button type='submit'>{">"}</button>
      </form>
    </div>
  );

}

export default ChatInput