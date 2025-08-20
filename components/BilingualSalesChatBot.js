/**
 * BILINGUAL SALES CHATBOT - Triangle Intelligence Integration
 * Supports English/Spanish with current i18n system
 * Bloomberg Terminal styling with professional sales assistance
 */

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, DollarSign, Users, BarChart3, Target, Loader, Globe } from 'lucide-react';
import { useSmartT } from '../lib/smartT';

export default function BilingualSalesChatBot() {
  const { smartT, currentLanguage, changeLanguage } = useSmartT();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [chatLanguage, setChatLanguage] = useState('en');
  const messagesEndRef = useRef(null);

  // Initialize session and set language
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `sales_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      
      // Set chat language based on current platform language
      const lang = currentLanguage || 'en';
      setChatLanguage(lang);
      
      // Add welcome message in appropriate language
      const welcomeMessages = {
        en: {
          content: `🤝 Hello! I'm your Triangle Intelligence Sales Specialist.

💰 I can help you with:
• **Commission Calculations** - How much will you earn per deal?
• **Lead Qualification** - Evaluate partnership opportunities  
• **Specialist Matching** - Connect with Mexican trade experts
• **Pipeline Analytics** - Analyze your sales performance

How can I assist you today?`,
          timestamp: new Date().toISOString()
        },
        es: {
          content: `🤝 ¡Hola! Soy tu especialista en ventas de Triangle Intelligence.

💰 Puedo ayudarte con:
• **Cálculos de comisión** - ¿Cuánto ganarás por deal?
• **Calificación de leads** - Evaluar oportunidades de partnership
• **Matching de especialistas** - Conectar con expertos comerciales mexicanos  
• **Analytics de pipeline** - Analizar tu rendimiento de ventas

¿En qué puedo ayudarte hoy?`,
          timestamp: new Date().toISOString()
        }
      };

      setMessages([{
        id: 1,
        type: 'bot',
        ...welcomeMessages[lang]
      }]);
    }
  }, [sessionId, currentLanguage]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Language toggle
  const toggleLanguage = () => {
    const newLang = chatLanguage === 'en' ? 'es' : 'en';
    setChatLanguage(newLang);
    changeLanguage(newLang);
    
    // Add language switch message
    const switchMessage = {
      id: Date.now(),
      type: 'system',
      content: newLang === 'es' 
        ? '🌎 Idioma cambiado a Español' 
        : '🌎 Language switched to English',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, switchMessage]);
  };

  // Quick actions with bilingual support
  const getQuickActions = () => {
    if (chatLanguage === 'es') {
      return [
        {
          id: 'commission',
          icon: DollarSign,
          label: 'Calcular Comisión',
          prompt: 'Tengo un cliente con $2.5M en ahorros anuales. ¿Cuál sería mi comisión?'
        },
        {
          id: 'qualify',
          icon: Target,
          label: 'Calificar Lead',
          prompt: 'Tengo un nuevo lead de manufactura. ¿Cómo evalúo si vale la pena?'
        },
        {
          id: 'specialists',
          icon: Users,
          label: 'Buscar Especialistas',
          prompt: 'Necesito un especialista mexicano para electrónicos en Tijuana'
        },
        {
          id: 'analytics',
          icon: BarChart3,
          label: 'Ver Analytics',
          prompt: 'Muéstrame el performance de mi pipeline de partnerships'
        }
      ];
    } else {
      return [
        {
          id: 'commission',
          icon: DollarSign,
          label: 'Calculate Commission',
          prompt: 'I have a client with $2.5M annual savings. What would be my commission?'
        },
        {
          id: 'qualify',
          icon: Target,
          label: 'Qualify Lead',
          prompt: 'I have a new manufacturing lead. How do I evaluate if it\'s worth pursuing?'
        },
        {
          id: 'specialists',
          icon: Users,
          label: 'Find Specialists',
          prompt: 'I need a Mexican specialist for electronics manufacturing in Tijuana'
        },
        {
          id: 'analytics',
          icon: BarChart3,
          label: 'View Analytics',
          prompt: 'Show me my partnership pipeline performance analytics'
        }
      ];
    }
  };

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
      // Try to call the partnership chat API
      const response = await fetch('/api/partnership/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: messageToSend,
          sessionId: sessionId,
          language: chatLanguage,
          context: 'sales_operations'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response,
          timestamp: data.timestamp || new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback response system
      const fallbackResponse = getFallbackResponse(messageToSend, chatLanguage);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: fallbackResponse,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback response system for offline capability
  const getFallbackResponse = (message, language) => {
    const msg = message.toLowerCase();
    
    if (language === 'es') {
      if (msg.includes('comisi') || msg.includes('ganancia')) {
        return `💰 **Cálculo de Comisión**

Las comisiones se basan en los ahorros generados:
• **Platinum** (>$10M ahorros): 2.5% comisión
• **Gold** ($5M-$10M): 2.0% comisión  
• **Silver** ($2M-$5M): 1.8% comisión
• **Bronze** ($500K-$2M): 1.5% comisión

¿Cuál es el volumen de ahorros estimado de tu cliente?`;
      }
      
      if (msg.includes('lead') || msg.includes('calificar')) {
        return `🎯 **Calificación de Leads**

Para calificar un lead evalúa:
• Volumen de importación anual
• Tipo de negocio (electrónicos = mayor valor)
• País de origen (China/India = mejor oportunidad)
• Urgencia de implementación

¿Puedes compartir estos detalles de tu lead?`;
      }
      
      if (msg.includes('especialista') || msg.includes('mexico')) {
        return `🇲🇽 **Red de Especialistas Mexicanos**

Tenemos especialistas certificados en:
• **Carlos Mendez** - Ciudad de México (Electrónicos)
• **Ana Gutierrez** - Guadalajara (Manufactura Industrial)  
• **Roberto Silva** - Tijuana (Automotriz)

¿Qué tipo de especialista necesitas?`;
      }
      
      return `🤝 Entiendo tu consulta sobre ventas. 

**Opciones disponibles:**
• Usar los botones rápidos arriba
• Contactar al equipo de ventas directamente
• Revisar el dashboard de partnerships

¿Hay algo específico en lo que pueda ayudarte?`;
    } else {
      if (msg.includes('commission') || msg.includes('earn')) {
        return `💰 **Commission Calculation**

Commissions are based on generated savings:
• **Platinum** (>$10M savings): 2.5% commission
• **Gold** ($5M-$10M): 2.0% commission
• **Silver** ($2M-$5M): 1.8% commission  
• **Bronze** ($500K-$2M): 1.5% commission

What's the estimated savings volume for your client?`;
      }
      
      if (msg.includes('qualify') || msg.includes('lead')) {
        return `🎯 **Lead Qualification**

To qualify a lead, evaluate:
• Annual import volume
• Business type (electronics = higher value)
• Origin country (China/India = better opportunity)
• Implementation urgency

Can you share these details about your lead?`;
      }
      
      if (msg.includes('specialist') || msg.includes('mexico')) {
        return `🇲🇽 **Mexican Specialist Network**

We have certified specialists in:
• **Carlos Mendez** - Mexico City (Electronics)
• **Ana Gutierrez** - Guadalajara (Industrial Manufacturing)
• **Roberto Silva** - Tijuana (Automotive)

What type of specialist do you need?`;
      }
      
      return `🤝 I understand your sales inquiry.

**Available options:**
• Use the quick action buttons above
• Contact the sales team directly
• Review the partnerships dashboard

Is there something specific I can help you with?`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content) => {
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
          className="bloomberg-chat-trigger-btn"
          title={smartT('salesChat.title', 'Sales Partnership Assistant')}
        >
          <MessageCircle size={24} />
          <div className="bloomberg-chat-trigger-badge">
            {chatLanguage === 'es' ? '🇲🇽' : '💼'}
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
          <div>
            <h3 className="bloomberg-chat-title">
              {smartT('salesChat.title', 'Sales Partnership Assistant')}
            </h3>
            <p className="bloomberg-chat-subtitle">
              {chatLanguage === 'es' 
                ? 'Especialista en Partners y Comisiones'
                : 'Partnership & Commission Specialist'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleLanguage}
            className="bloomberg-chat-close"
            title={smartT('salesChat.toggleLanguage', 'Toggle Language')}
          >
            <Globe size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="bloomberg-chat-close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bloomberg-chat-quick-actions">
        <div className="bloomberg-chat-actions-grid">
          {getQuickActions().map((action) => (
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
                  : message.type === 'system'
                  ? 'bloomberg-status bloomberg-status-warning bloomberg-text-center'
                  : 'bloomberg-card bloomberg-border-info'
              }`}
            >
              {message.type === 'bot' || message.type === 'system' ? (
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
          <div className="bloomberg-flex bloomberg-justify-start">
            <div className="bloomberg-card bloomberg-border-info bloomberg-p-md bloomberg-rounded-lg bloomberg-flex bloomberg-items-center bloomberg-gap-sm">
              <Loader size={16} className="bloomberg-pulse text-primary" />
              <span className="bloomberg-text-muted">
                {chatLanguage === 'es' ? 'Analizando...' : 'Analyzing...'}
              </span>
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
            placeholder={
              chatLanguage === 'es' 
                ? "Pregunta sobre partnerships, comisiones, analytics..."
                : "Ask about partnerships, commissions, analytics..."
            }
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
          {chatLanguage === 'es' 
            ? '💡 Usa los botones rápidos o escribe tu pregunta'
            : '💡 Use quick buttons or type your question'
          }
        </div>
      </div>
    </div>
  );
}