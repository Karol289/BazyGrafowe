import LlmLogo from "../svgs/LlmLogo"
import PolslLogo from "../svgs/PolslLogo"

const ChatMessage = ({ message }) => {

    return (
        <div className={`chat-message ${message.user === 'llm' && "llm"}`}>
            <div className='chat-message-center'>

                <div className={`chat-message-avatar ${message.user === 'llm' && "llm"}`}>
                    {message.user === 'llm' && <LlmLogo />}
                    {message.user === 'me' && <PolslLogo />}
                </div>

                <div className='chat-message-message'>
                    {/* LOGIKA: Jeśli loading=true pokaż spinner, w przeciwnym razie pokaż tekst */}
                    {message.loading ? (
                        <div className="loading-indicator">
                            <svg
                                className="loading-spinner"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12" cy="12" r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            <span>Generating Response...</span>
                        </div>
                    ) : (
                        message.message
                    )}
                </div>

            </div>
        </div>
    )
}

export default ChatMessage