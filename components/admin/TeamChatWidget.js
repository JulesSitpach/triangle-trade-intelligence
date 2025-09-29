/**
 * Team Chat Widget - Clean AI Research Assistant
 * CSS COMPLIANT - Using existing classes only
 */

import { useState, useEffect, useRef } from 'react';

const TeamChatWidget = ({
  dashboardContext = 'general',
  userName = 'admin',
  language = 'english',
  minimized = true
}) => {
  const [isOpen, setIsOpen] = useState(!minimized);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedResearchType, setSelectedResearchType] = useState('compliance');
  const messagesEndRef = useRef(null);

  // Research types dropdown
  const researchTypes = [
    { value: 'compliance', label: 'Compliance Check', icon: '🏛️' },
    { value: 'market', label: 'Market Research', icon: '📊' },
    { value: 'trade', label: 'Trade Analysis', icon: '🚢' },
    { value: 'general', label: 'General Research', icon: '🔍' }
  ];

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        sender: 'Research Assistant',
        message: "Hi! I can help you research compliance, market data, and trade intelligence. What would you like to know?",
        timestamp: new Date().toISOString(),
        isBot: true
      }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: userName,
      message: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      isBot: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Simulate API call
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          sender: 'Research Assistant',
          message: `I understand you're asking about "${inputMessage.trim()}". Let me research that for you using our ${selectedResearchType} tools.`,
          timestamp: new Date().toISOString(),
          isBot: true
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      setIsTyping(false);
      console.error('Chat error:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="chat-toggle">
        <button
          onClick={() => setIsOpen(true)}
          className="btn-primary"
          title="Open Research Assistant"
        >
          🤖 Triangle AI
        </button>
      </div>
    );
  }

  return (
    <div className="chat-widget">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-title">
            <span>🤖 Research Assistant</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="btn-secondary"
          >
            ×
          </button>
        </div>

        <div className="chat-controls">
          <select
            value={selectedResearchType}
            onChange={(e) => setSelectedResearchType(e.target.value)}
            className="form-input"
          >
            {researchTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.isBot ? 'bot-message' : 'user-message'}`}>
              <div className="message-content">
                <div className="message-text">{msg.message}</div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-message bot-message">
              <div className="message-content">
                <div className="message-text">Researching...</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about compliance, market data, or trade intelligence..."
            className="form-input"
            rows="2"
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="btn-primary"
          >
            Send
          </button>
        </div>
      </div>

      <style jsx>{`
        .chat-toggle {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }

        .chat-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 400px;
          max-width: 90vw;
          max-height: 600px;
          z-index: 1000;
        }

        .chat-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          height: 500px;
        }

        .chat-header {
          background: #1e40af;
          color: white;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 8px 8px 0 0;
        }

        .chat-title {
          font-weight: 600;
        }

        .chat-controls {
          padding: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .chat-message {
          display: flex;
        }

        .bot-message {
          justify-content: flex-start;
        }

        .user-message {
          justify-content: flex-end;
        }

        .message-content {
          max-width: 80%;
          padding: 0.75rem;
          border-radius: 8px;
        }

        .bot-message .message-content {
          background: #f3f4f6;
          color: #374151;
        }

        .user-message .message-content {
          background: #1e40af;
          color: white;
        }

        .message-text {
          font-size: 0.875rem;
          white-space: pre-wrap;
        }

        .chat-input {
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 0.5rem;
          align-items: flex-end;
        }

        .chat-input textarea {
          flex: 1;
          resize: none;
          min-height: 40px;
        }

        .chat-input button {
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default TeamChatWidget;