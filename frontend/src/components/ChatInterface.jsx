import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

import api from '../api';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello! I am your Accessible Navigation Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/chat', { message: userMsg.text });
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={24} color="hsl(var(--primary))" /> AI Assistant
        </h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            style={{ 
              display: 'flex', 
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: '8px'
            }}
          >
            {msg.sender === 'bot' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} color="white" />
              </div>
            )}
            
            <div style={{ 
              maxWidth: '70%', 
              padding: '12px 16px', 
              borderRadius: '16px', 
              background: msg.sender === 'user' ? 'hsl(var(--primary))' : 'hsl(var(--bg-input))',
              color: 'white',
              fontSize: '0.95rem',
              borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
              borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
              lineHeight: '1.4'
            }}>
              {msg.text}
            </div>

            {msg.sender === 'user' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="white" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about routes, accessibility, or safety..." 
          style={{ 
            flex: 1, 
            background: 'hsl(var(--bg-input))', 
            border: 'none', 
            padding: '14px', 
            borderRadius: 'var(--radius-sm)', 
            color: 'white',
            outline: 'none'
          }}
        />
        <button 
          onClick={handleSend}
          className="btn-primary" 
          style={{ width: 'auto', padding: '0 20px' }}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
