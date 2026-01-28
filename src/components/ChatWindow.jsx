import React, { useState, useEffect, useRef } from 'react';
import '../pages/Dashboard.css'; // Re-use existing CSS

const ChatWindow = ({ order, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatBodyRef = useRef(null);
  const chatInterval = useRef(null);

  // Fetch Messages
  const fetchMessages = () => {
    fetch(`http://localhost:5000/api/messages/${order.id}`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) {
            setMessages(data);
            // Scroll to bottom only if it's a new message or first load
            // (Simple check: compare lengths)
            // if(chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
      });
  };

  // Initial Load & Polling
  useEffect(() => {
    fetchMessages();
    chatInterval.current = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(chatInterval.current); // Cleanup on close
  }, [order.id]);

  // Auto-scroll effect
  useEffect(() => {
    if(chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [messages.length]); // Only scroll when message count changes

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempMsg = { id: Date.now(), sender_id: currentUser.id, text: newMessage };
    setMessages(prev => [...prev, tempMsg]); // Optimistic Update
    setNewMessage(""); // Clear input immediately

    await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, sender_id: currentUser.id, text: tempMsg.text })
    });
    fetchMessages(); // Sync real ID
  };

  // Determine Chat Partner Name
  const chatTitle = currentUser.id === order.client_id ? order.freelancer_name : order.client_name;

  return (
    <div className="chat-overlay">
        <div className="chat-header">
            <span>Chat: {chatTitle}</span>
            <button onClick={onClose} style={{background:'none', border:'none', color:'white', cursor:'pointer', fontSize:'1.2rem'}}>✖</button>
        </div>
        
        <div className="chat-body" ref={chatBodyRef}>
            {messages.map(m => (
                <div key={m.id} className={`chat-bubble ${String(m.sender_id) === String(currentUser.id) ? 'mine' : 'theirs'}`}>
                    {m.text}
                    <span className="chat-time">{m.sent_time?.slice(0,5)}</span>
                </div>
            ))}
        </div>

        <form className="chat-footer" onSubmit={sendMessage}>
            <input 
                className="chat-input" 
                placeholder="Type a message..." 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                autoFocus
            />
            <button className="chat-send-btn">➤</button>
        </form>
    </div>
  );
};

export default ChatWindow;