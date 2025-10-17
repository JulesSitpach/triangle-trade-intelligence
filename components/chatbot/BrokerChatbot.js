/**
 * Broker Chatbot Component
 * Friendly trade terminology assistant with broker personality
 * Database-driven (no external AI calls) - fast & free
 */

import { useState, useEffect, useRef } from 'react';

export default function BrokerChatbot({ currentFormField, sessionId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hi! I'm your Triangle trade assistant. Think of me like your friendly customs broker - here to explain the confusing stuff in plain English! 😊\n\nAsk me anything about the forms, or try one of the quick questions below!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const lastMessageRef = useRef(null);

  // Auto-scroll to TOP of new message when it arrives (better UX)
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages]);

  // Generate session ID if not provided
  const chatSessionId = sessionId || `chat_${Date.now()}`;

  const handleSubmit = async (questionText) => {
    const question = questionText || inputValue.trim();
    if (!question) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: question }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/broker-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          formField: currentFormField,
          sessionId: chatSessionId
        })
      });

      const data = await response.json();

      if (data.success && data.response) {
        const botMessage = {
          type: 'bot',
          text: data.response.broker_response,
          quickTip: data.response.quick_tip,
          realExample: data.response.real_example,
          encouragement: data.response.encouragement,
          relatedQuestions: data.response.related_questions,
          nextSteps: data.response.next_steps,
          responseId: data.response.id
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: "Hmm, I'm having trouble understanding that one. Can you try asking in a different way? 🤔"
        }]);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Oops! Something went wrong on my end. Can you try asking again? 😅"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    handleSubmit(question);
  };

  const handleHelpful = async (responseId, helpful) => {
    try {
      await fetch('/api/broker-chat-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId,
          helpful,
          sessionId: chatSessionId
        })
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  // Context-aware quick questions based on current form field
  const getQuickQuestions = () => {
    const fieldQuestions = {
      origin_criterion: [
        "What is Origin Criterion?",
        "Which criterion should I use?",
        "Do I have to fill this out?"
      ],
      method_of_qualification: [
        "What is Method of Qualification?",
        "What does TV mean?",
        "Do I need to fill this?"
      ],
      hs_code: [
        "What's an HS code?",
        "How do I find my HS code?",
        "Can AI help me find it?"
      ],
      default: [
        "What is USMCA?",
        "How do I know if I qualify?",
        "What is MFN Rate?"
      ]
    };

    return fieldQuestions[currentFormField] || fieldQuestions.default;
  };

  if (!isOpen) {
    return (
      <button
        className="chatbot-trigger"
        onClick={() => setIsOpen(true)}
        title="Ask your Triangle broker"
      >
        💬 Need help?
      </button>
    );
  }

  return (
    <div className="chatbot-overlay" onClick={() => setIsOpen(false)}>
      <div className="chatbot-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-content">
            <span className="chatbot-icon">🤝</span>
            <div>
              <h3 className="chatbot-title">Your Triangle Broker</h3>
              <p className="chatbot-subtitle">Friendly trade expert</p>
            </div>
          </div>
          <button
            className="chatbot-close"
            onClick={() => setIsOpen(false)}
            title="Close chat"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message chat-message-${msg.type}`}
              ref={index === messages.length - 1 ? lastMessageRef : null}
            >
              <div className="chat-message-content">
                <div className="chat-message-text">
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} style={{ margin: line ? '0 0 0.5rem 0' : 0 }}>
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>

                {/* Quick Tip */}
                {msg.quickTip && (
                  <div className="chat-quick-tip">
                    <strong>💡 Pro tip:</strong> {msg.quickTip}
                  </div>
                )}

                {/* Real Example */}
                {msg.realExample && (
                  <div className="chat-real-example">
                    <strong>📖 Real example:</strong> {msg.realExample}
                  </div>
                )}

                {/* Encouragement */}
                {msg.encouragement && (
                  <div className="chat-encouragement">
                    🌟 {msg.encouragement}
                  </div>
                )}

                {/* Related Questions */}
                {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                  <div className="chat-related-questions">
                    <p className="chat-section-title">📌 Related questions:</p>
                    {msg.relatedQuestions.map((q, i) => (
                      <button
                        key={i}
                        className="chat-related-question"
                        onClick={() => handleQuickQuestion(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Next Steps */}
                {msg.nextSteps && msg.nextSteps.length > 0 && (
                  <div className="chat-next-steps">
                    <p className="chat-section-title">⏭️ Next steps:</p>
                    {msg.nextSteps.map((step, i) => (
                      <div key={i} className="chat-next-step">• {step}</div>
                    ))}
                  </div>
                )}

                {/* Feedback buttons */}
                {msg.type === 'bot' && msg.responseId && (
                  <div className="chat-feedback">
                    <span className="chat-feedback-label">Was this helpful?</span>
                    <button
                      className="chat-feedback-btn"
                      onClick={() => handleHelpful(msg.responseId, true)}
                      title="Yes, helpful"
                    >
                      👍
                    </button>
                    <button
                      className="chat-feedback-btn"
                      onClick={() => handleHelpful(msg.responseId, false)}
                      title="No, not helpful"
                    >
                      👎
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-message chat-message-bot">
              <div className="chat-message-content">
                <div className="chat-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        <div className="chatbot-quick-questions">
          <p className="chatbot-quick-title">⚡ Quick help:</p>
          <div className="chatbot-quick-buttons">
            {getQuickQuestions().map((q, i) => (
              <button
                key={i}
                className="chatbot-quick-button"
                onClick={() => handleQuickQuestion(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="chatbot-input-container">
          <input
            type="text"
            className="chatbot-input"
            placeholder="Ask me anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isLoading}
          />
          <button
            className="chatbot-send-button"
            onClick={() => handleSubmit()}
            disabled={isLoading || !inputValue.trim()}
            title="Send message"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
