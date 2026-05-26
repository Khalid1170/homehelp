import React, { useState, useEffect, useRef } from 'react';

export default function JobChatModal({ jobId, token, currentUserId, onClose, isInline = false }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    // 🟢 CRITICAL GUARD: Do not make an API request if jobId is missing or null
    if (!jobId) return;

    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  // Automatically refresh messages every 4 seconds
  useEffect(() => {
    // 🟢 Reset messages array when switching chat channels so old messages don't flash
    setMessages([]); 
    
    fetchMessages(); 
    const liveFeedInterval = setInterval(fetchMessages, 4000); 

    return () => clearInterval(liveFeedInterval); 
  }, [jobId]);

  // Keep the latest messages in view
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !jobId) return;

    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message_text: newMessage })
      });

      if (res.ok) {
        const freshMsg = await res.json();
        setMessages((prev) => [...prev, freshMsg]);
        setNewMessage('');
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // 🟢 DYNAMIC LAYOUT: Change container wrappers based on whether it is rendered inline or popup
  const containerClass = isInline
    ? "bg-white w-full h-full flex flex-col overflow-hidden" 
    : "fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4";

  const innerModalClass = isInline 
    ? "w-full h-full flex flex-col"
    : "bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 flex flex-col h-[550px] overflow-hidden";

  return (
    <div className={containerClass}>
      <div className={innerModalClass}>
        
        {/* Chat Header */}
        <header className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold tracking-tight">Job Messages</h3>
            <p className="text-xs text-slate-400">Ask questions or share updates</p>
          </div>
          {/* 🟢 Hide the cross button if running inside your layout split screen */}
          {!isInline && (
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 h-8 w-8 rounded-full flex items-center justify-center transition"
              aria-label="Close chat"
            >
              ✕
            </button>
          )}
        </header>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[11px] font-medium text-slate-500 mb-1 px-1">
                  {isMe ? 'You' : msg.sender_name}
                </span>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-xs leading-relaxed
                  ${isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {msg.message_text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-100 border border-transparent rounded-xl px-4 py-2 text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white transition placeholder-slate-400"
          />
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-9 px-4 rounded-xl transition cursor-pointer shadow-xs active:scale-[0.98]"
          >
            Send
          </button>
        </form>

      </div>
    </div>
  );
}