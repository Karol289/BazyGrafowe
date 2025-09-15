import { useEffect, useRef, useState } from 'react';
import { ReadyState } from "react-use-websocket"

import './ChatInput.css'

const ChatInput = ({sendMessage, setChatLog, readyState, input ,setInput}) => {

  const [expanded, setExpanded] = useState(false);
  const [updateNodes, setUpdateNodes] = useState(false);
  const [updateEdges, setUpdateEdges] = useState(false);


  const OPTIONS = Object.freeze({
    Prompt: "Prompt",
    Cypher: "Cypher",
    Describe: "Describe",
    SaveToDB: "SaveToDB"
  });

  async function handleSubmit(e) {
    e.preventDefault();
    sendChatMessage();
  }

  async function sendChatMessage() {
    let textFromInput = input;
    
    if (textFromInput.trim() === "" || readyState !== ReadyState.OPEN) return;


    setChatLog((prev) => [...prev, { user: "me", message: textFromInput }]);

    sendMessage(JSON.stringify({
      type: "Prompt",
      message: textFromInput,
      updateNodes: updateNodes,
      updateEdges: updateEdges
    }));

    setInput("");
  }

  return (
    <div className='chat-input-holder'>

      <form onSubmit={handleSubmit}>
        <div className="textarea-wrapper">
          <textarea
            className={`chat-input-textarea ${expanded ? "expanded" : ""}`}
            placeholder="Input your message here"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
              }
            }}
          />
        </div>

        {/* Wspólny pasek z checkboxami i przyciskami */}
        <div className="input-controls">
          <label>
            <input
              type="checkbox"
              checked={updateNodes}
              onChange={() => setUpdateNodes(prev => !prev)}
            /> Update Nodes
          </label>
          <label>
            <input
              type="checkbox"
              checked={updateEdges}
              onChange={() => setUpdateEdges(prev => !prev)}
            /> Update Edges
          </label>

          <button
            type="button"
            className="expand-toggle"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "🔽" : "🔼"}
          </button>

          <button type="submit">{">"}</button>
        </div>
      </form>
    </div>
  );
}

export default ChatInput;
