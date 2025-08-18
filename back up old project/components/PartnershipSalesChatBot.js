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
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          title="Partnership Sales Assistant"
        >
          <MessageCircle size={24} />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            🇲🇽
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Users size={20} />
          <div>
            <h3 className="font-semibold">Partnership Sales Assistant</h3>
            <p className="text-sm opacity-90">Especialista en Partners Mexicanos</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 p-1 rounded"
        >
          <X size={20} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b bg-gray-50">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => sendMessage(action.prompt)}
              className="flex items-center space-x-2 p-2 text-sm bg-white border rounded hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              <action.icon size={14} className="text-blue-600" />
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.type === 'bot' ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(message.content)
                  }}
                  className="prose prose-sm max-w-none"
                />
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
              <div className={`text-xs mt-2 opacity-70 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
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
            <div className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
              <Loader size={16} className="animate-spin text-blue-600" />
              <span className="text-gray-600">Analizando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregunta sobre partnerships, comisiones, analytics..."
            className="flex-1 p-2 border rounded-lg resize-none h-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          💡 Usa los botones rápidos o escribe tu pregunta
        </div>
      </div>
    </div>
  );
}