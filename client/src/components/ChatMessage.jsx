import LlmLogo from "../svgs/LlmLogo"
import PolslLogo from "../svgs/PolslLogo"


const ChatMessage = ({message}) => {

    return (

         <div className={`chat-message ${message.user ===  'llm' && "llm" }`}>
            <div className='chat-message-center'>

              <div className={`chat-message-avatar ${message.user ===  'llm' && "llm" }`}>
                  
                    {message.user === 'llm' && <LlmLogo />}
                    {message.user === 'me' && <PolslLogo />}
                    
              </div>
                
              <div className='chat-message-message'>
                    {message.message}
              </div>

            </div>
          </div>
    )
}

export default ChatMessage