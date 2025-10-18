/**
 * AI Research Assistant - Contextual help for admin service delivery
 * Embedded in service request cards, has full context + genius database access
 */

import { useState, useRef, useEffect } from 'react';

export default function AIResearchAssistant({ serviceRequest, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial AI greeting with context-aware suggestions
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const suggestions = getContextualSuggestions(serviceRequest);
      setMessages([{
        role: 'assistant',
        content: `🤖 **AI Research Assistant Ready**\n\n**Context:**\n- Service: ${serviceRequest.service_type}\n- Client: ${serviceRequest.client_company}\n- Status: ${serviceRequest.status}\n\n**I can help you with:**\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nWhat would you like to know?`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [isOpen, serviceRequest]);

  const getContextualSuggestions = (request) => {
    const service = request.service_type?.toLowerCase() || '';

    if (service.includes('usmca')) {
      return [
        'Find Mexico suppliers to replace non-USMCA components',
        'Draft USMCA qualification assessment',
        'Check crisis alerts affecting this product',
        'Look up required USMCA threshold for this industry'
      ];
    } else if (service.includes('supplier')) {
      return [
        'Search genius database for similar suppliers',
        'Check supplier reliability scores and certifications',
        'Find USMCA-compliant alternatives',
        'Review past successful supplier matches'
      ];
    } else if (service.includes('crisis')) {
      return [
        'Search recent trade policy changes',
        'Find similar crisis resolutions',
        'Check tariff rate impacts',
        'Draft crisis response recommendations'
      ];
    } else if (service.includes('market')) {
      return [
        'Research market entry strategies for this country',
        'Find similar market entry cases',
        'Check regulatory requirements',
        'Analyze competitive landscape'
      ];
    } else if (service.includes('manufacturing')) {
      return [
        'Research manufacturing feasibility in target country',
        'Find similar manufacturing assessments',
        'Check infrastructure and labor availability',
        'Analyze cost-benefit of relocation'
      ];
    }

    return [
      'Search genius database for similar cases',
      'Draft initial analysis for client',
      'Check relevant trade policies',
      'Find supplier or manufacturing recommendations'
    ];
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: inputText,
          serviceRequest: serviceRequest,
          conversationHistory: messages.slice(-6) // Last 3 exchanges for context
        })
      });

      if (!response.ok) {
        throw new Error('AI assistant request failed');
      }

      const data = await response.json();

      const aiMessage = {
        role: 'assistant',
        content: data.response,
        sources: data.sources || [],
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('AI assistant error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary"
        style={{ fontSize: '14px', padding: '8px 16px' }}
      >
        🤖 AI Assistant
      </button>
    );
  }

  return (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 className="card-title" style={{ margin: '0 0 5px 0' }}>🤖 AI Research Assistant</h3>
            <p className="card-description" style={{ margin: 0, fontSize: '13px' }}>
              Context: {serviceRequest.service_type} - {serviceRequest.client_company}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="btn-secondary"
            style={{ fontSize: '20px', padding: '4px 12px' }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: '#f9fafb'
        }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '15px',
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: msg.role === 'user' ? '#2563eb' : '#ffffff',
                color: msg.role === 'user' ? '#ffffff' : '#1f2937',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {msg.content}

                {/* Show sources if AI found data in genius DB */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid #e5e7eb',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    <strong>Sources:</strong>
                    <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                      {msg.sources.map((source, i) => (
                        <li key={i}>{source}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{
                  fontSize: '11px',
                  marginTop: '5px',
                  opacity: 0.7
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              🤖 Searching genius database...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '15px 20px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about this service request..."
              className="form-input"
              disabled={isLoading}
              style={{
                flex: 1,
                minHeight: '60px',
                maxHeight: '120px',
                resize: 'vertical',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="btn-primary"
              style={{
                height: '60px',
                minWidth: '80px',
                fontSize: '14px'
              }}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            💡 Tip: Ask about suppliers, crisis alerts, USMCA rules, or past similar cases
          </p>
        </div>
      </div>
    </div>
  );
}
