import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, DollarSign, Users, BarChart3, Target, Loader } from 'lucide-react';

export default function PartnershipSalesChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize session on component mount
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `partnership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      
      // Add welcome message
      setMessages([{
        id: 1,
        type: 'bot',
        content: `🤝 ¡Hola! Soy tu especialista en partnerships mexicanos.

💰 Puedo ayudarte con:
• **Cálculos de comisión** - ¿Cuánto ganarás por deal?
• **Matching de partners** - Conectar clientes con especialistas mexicanos
• **Analytics de performance** - Análisis de tu pipeline
• **Calificación de leads** - Evaluar oportunidades

¿En qué puedo ayudarte hoy?`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [sessionId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickActions = [
    {
      id: 'commission',
      icon: DollarSign,
      label: 'Calcular Comisión',
      prompt: 'Tengo un cliente con $2.5M en ahorros anuales. ¿Cuál sería mi comisión?'
    },
    {
      id: 'partners',
      icon: Users,
      label: 'Buscar Partners',
      prompt: 'Necesito un partner mexicano para electrónicos en Tijuana'
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: 'Ver Analytics',
      prompt: 'Muéstrame el performance de mi pipeline de partnerships'
    },
    {
      id: 'qualify',
      icon: Target,
      label: 'Calificar Lead',
      prompt: 'Tengo un nuevo lead. ¿Cómo evalúo si vale la pena?'
    }
  ];

  const sendMessage = async (messageContent = null) => {
    const messageToSend = messageContent || inputMessage.trim();
    if (!messageToSend || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/partnership/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: messageToSend,
          sessionId: sessionId,
          language: 'es'
        }),
      });

      const data = await response.json();

      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response,
          timestamp: data.timestamp
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Error en la respuesta');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `❌ Error: ${error.message}

🔧 **Solución temporal:**
Mientras resuelvo el problema técnico, puedes:
• Revisar el dashboard de partnerships existente
• Contactar directamente a los partners mexicanos
• Usar las calculadoras de comisión manual

¡Disculpa las molestias!`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content) => {
    // Simple formatting for bot messages
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  if (!isOpen) {
    return (
      <div className="bloomberg-chat-trigger">
        <button
          onClick={() => setIsOpen(true)}
          className="bloomberg-chat-trigger-btn"
          title="Partnership Sales Assistant"
        >
          <MessageCircle size={24} />
          <div className="bloomberg-chat-trigger-badge">
            🇲🇽
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="bloomberg-chat-container">
      {/* Header */}
      <div className="bloomberg-chat-header">
        <div className="bloomberg-chat-header-content">
          <Users size={20} />
          <div className="bloomberg-chat-header-text">
            <h3 className="bloomberg-chat-title">Partnership Sales Assistant</h3>
            <p className="bloomberg-chat-subtitle">Especialista en Partners Mexicanos</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="bloomberg-chat-close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bloomberg-chat-quick-actions">
        <div className="bloomberg-chat-actions-grid">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => sendMessage(action.prompt)}
              className="bloomberg-chat-action-btn"
              disabled={isLoading}
            >
              <action.icon size={14} className="bloomberg-chat-action-icon" />
              <span className="bloomberg-chat-action-label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="bloomberg-flex-1 bloomberg-overflow-y-auto bloomberg-p-md bloomberg-card">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] bloomberg-p-md bloomberg-rounded-lg ${
                message.type === 'user'
                  ? 'bloomberg-btn-primary'
                  : 'bloomberg-card bloomberg-border-info'
              }`}
            >
              {message.type === 'bot' ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(message.content)
                  }}
                  className="bloomberg-text-sm"
                />
              ) : (
                <p className="bloomberg-text-sm">{message.content}</p>
              )}
              <div className={`bloomberg-text-xs bloomberg-mt-sm bloomberg-text-muted ${
                message.type === 'user' ? 'bloomberg-text-muted' : 'bloomberg-text-muted'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bloomberg-card bloomberg-border-info bloomberg-p-md bloomberg-rounded-lg bloomberg-flex bloomberg-items-center bloomberg-gap-sm">
              <Loader size={16} className="bloomberg-pulse text-primary" />
              <span className="bloomberg-text-muted">Analizando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bloomberg-p-md bloomberg-border-top bloomberg-card">
        <div className="bloomberg-flex bloomberg-gap-sm">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregunta sobre partnerships, comisiones, analytics..."
            className="bloomberg-input bloomberg-flex-1"
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="bloomberg-btn bloomberg-btn-primary"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="bloomberg-text-xs bloomberg-text-muted bloomberg-mt-sm bloomberg-text-center">
          💡 Usa los botones rápidos o escribe tu pregunta
        </div>
      </div>
    </div>
  );
}