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

  const generateMockResponse = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('route') || lower.includes('direction') || lower.includes('go to')) {
      return "I can definitely help with that! Please enter your destination in the Navigation tab, or look for the 'Start' button. I'll find the most accessible path for you.";
    }
    if (lower.includes('ramp') || lower.includes('wheelchair') || lower.includes('step')) {
      return "I've updated the map to highlight wheelchair-friendly paths. There is a verified ramp entrance 50 meters to your right.";
    }
    if (lower.includes('bathroom') || lower.includes('restroom') || lower.includes('toilet')) {
      return "The nearest accessible restroom is at the City Center Mall, Ground Floor (about 200m ahead). It has grab bars and a wide door.";
    }
    if (lower.includes('safe') || lower.includes('safety') || lower.includes('danger')) {
      return "This area has a high community safety score (92%). However, please be aware of reported construction work on Main Street.";
    }
    if (lower.includes('hello') || lower.includes('hi ')) {
      return "Hello there! ready to explore? Let me know where you want to go.";
    }
    return "I'm your AIPilot. I can help find routes, locating ramps, bathrooms, or checking safety scores. How can I assist?";
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Simulate AI delay and response
    setTimeout(() => {
      const replyText = generateMockResponse(userMsg.text);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: replyText }]);
      setIsLoading(false);
    }, 1500);

    // API Call (Disabled for Mock Demo)
    /*
    try {
      const { data } = await api.post('/chat', { message: userMsg.text });
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: data.reply }]);
    } catch (err) { ... }
    */
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--glass-highlight)' }}>
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
              background: msg.sender === 'user' ? 'hsl(var(--primary))' : 'rgba(128,128,128,0.15)', // Neutral gray for bot
              color: msg.sender === 'user' ? 'white' : 'hsl(var(--text-main))', // Theme aware text
              fontSize: '0.95rem',
              borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
              borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
              lineHeight: '1.4'
            }}>
              {msg.text}
            </div>

            {msg.sender === 'user' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(128,128,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="hsl(var(--text-main))" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about routes, accessibility, or safety..."
          style={{
            flex: 1,
            background: 'rgba(128,128,128,0.1)', // Adaptive background
            border: 'none',
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            color: 'hsl(var(--text-main))', // Theme aware text
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
