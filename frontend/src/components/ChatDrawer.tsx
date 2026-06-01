import { useEffect, useRef, useState } from 'react';

export interface ChatMessage {
  username: string;
  message: string;
  timestamp: number;
}

interface ChatDrawerProps {
  messages: ChatMessage[];
  currentUsername: string;
  onSendMessage: (message: string) => void;
}

export function ChatDrawer({ messages, currentUsername, onSendMessage }: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Track unread messages when closed
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages, isOpen]);

  // Reset unread count when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-36 right-4 z-40 bg-gold hover:bg-gold-light text-felt-dark p-3.5 rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer flex items-center justify-center font-bold"
        title="Open Chat"
      >
        <span className="text-xl">💬</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-felt-dark/95 backdrop-blur-md border-l border-gold/20 shadow-2xl z-50 transition-transform duration-300 flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-felt-light/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h3 className="font-bold text-gold">Room Chat</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-lg p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Message Feed */}
        <div
          ref={scrollRef}
          className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col scrollbar-thin scrollbar-thumb-felt-light"
        >
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm">
              <span className="text-3xl mb-1 opacity-40">✉️</span>
              <p>No messages yet.</p>
              <p className="text-xs opacity-60">Say hello to the table!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isSelf = msg.username === currentUsername;
              return (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    isSelf ? 'align-self-end items-end ml-auto' : 'align-self-start items-start mr-auto'
                  }`}
                >
                  <span className="text-[10px] text-gray-400 mb-0.5 px-1 truncate">
                    {msg.username}
                  </span>
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm break-words leading-relaxed shadow-sm
                      ${
                        isSelf
                          ? 'bg-gold text-felt-dark rounded-tr-none font-medium'
                          : 'bg-felt-light/60 text-white rounded-tl-none border border-felt-light/20'
                      }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 border-t border-felt-light/20 bg-felt-dark/60 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            maxLength={100}
            className="flex-1 bg-felt-light/40 border border-felt-light/30 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-gold/50"
          />
          <button
            type="submit"
            className="bg-gold hover:bg-gold-light text-felt-dark px-4 py-2 rounded-xl text-sm font-bold transition-transform hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}
