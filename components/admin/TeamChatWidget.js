/**
 * Team Chat Widget - Clean AI Research Assistant
 * SAM.gov, Comtrade, Census, and OpenRouter integration with simple dropdown interface
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
  const [currentAgent, setCurrentAgent] = useState(null);
  const messagesEndRef = useRef(null);

  // Research types dropdown
  const researchTypes = [
    { value: 'compliance', label: 'Compliance Check', icon: '🏛️' },
    { value: 'market', label: 'Market Research', icon: '📊' },
    { value: 'trade', label: 'Trade Analysis', icon: '🚢' },
    { value: 'general', label: 'General Research', icon: '🔍' }
  ];


  useEffect(() => {
    // Add simple welcome message - AI will respond in user's language
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
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: userName,
      message: inputMessage,
      timestamp: new Date().toISOString(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/team-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          sender: userName,
          context: {
            dashboard: dashboardContext,
            researchType: selectedResearchType,
            preferredLanguage: language
          }
        })
      });

      if (response.ok) {
        const data = await response.json();

        const botMessage = {
          id: data.context.message_id,
          sender: data.agent,
          message: data.response,
          timestamp: data.timestamp,
          agent: data.agent,
          confidence: data.confidence,
          suggestions: data.suggestions,
          collaboration: data.collaboration,
          data: data.data
        };

        setMessages(prev => [...prev, botMessage]);
        setCurrentAgent(data.agent);

        // If there was collaboration, show additional messages
        if (data.collaboration && data.collaboration.length > 0) {
          data.collaboration.forEach((collab, index) => {
            setTimeout(() => {
              const collabMessage = {
                id: `collab_${data.context.message_id}_${index}`,
                sender: collab.agent,
                message: collab.contribution.message,
                timestamp: new Date().toISOString(),
                agent: collab.agent,
                isCollaboration: true
              };
              setMessages(prev => [...prev, collabMessage]);
            }, (index + 1) * 1000); // Stagger collaboration messages
          });
        }

      } else {
        throw new Error('Team chat API unavailable');
      }

    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage = {
        id: Date.now().toString(),
        sender: 'SystemBot',
        message: "I'm temporarily unavailable. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const useSuggestion = (suggestion) => {
    setInputMessage(suggestion);
  };

  const getContextSuggestions = (context) => {
    const suggestions = {
      'broker': [
        'Check SAM registration for company',
        'Show trade volume for HS code',
        'Verify supplier compliance',
        'Analyze customs delays'
      ],
      'collaboration': [
        'Mexico trade opportunities',
        'USMCA certificate requirements',
        'Triangle routing benefits',
        'Generate compliance report'
      ],
      'dev': [
        'System performance trends',
        'API optimization strategies',
        'Technical documentation',
        'Database performance'
      ],
      'client': [
        'Lead qualification criteria',
        'Customer usage patterns',
        'Market entry strategy',
        'Trade volume analysis'
      ]
    };
    return suggestions[context] || suggestions['broker'];
  };

  const getAgentIcon = (agent) => {
    const icons = {
      'ComplianceBot': '🏛️',
      'MarketBot': '📊',
      'ResearchBot': '🤖',
      'CoordinatorBot': '🎯',
      'TeamBot': '👥',
      'SystemBot': '⚙️'
    };
    return icons[agent] || '🤖';
  };

  const getAgentColor = (agent) => {
    const colors = {
      'ComplianceBot': 'text-blue-600',
      'MarketBot': 'text-green-600',
      'ResearchBot': 'text-purple-600',
      'CoordinatorBot': 'text-orange-600',
      'TeamBot': 'text-gray-600',
      'SystemBot': 'text-red-600'
    };
    return colors[agent] || 'text-gray-600';
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          <span className="text-xl">🤖</span>
          <span className="text-sm font-medium hidden md:block">Triangle AI</span>
          {currentAgent && (
            <span className="bg-blue-500 text-xs px-2 py-1 rounded-full">
              {getAgentIcon(currentAgent)}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h3 className="font-semibold">Triangle Intelligence AI</h3>
              <p className="text-xs opacity-90">
                {currentAgent ? `${getAgentIcon(currentAgent)} ${currentAgent}` : 'Multi-Agent Research Assistant'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                msg.isUser
                  ? 'bg-blue-600 text-white'
                  : msg.isError
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : msg.isCollaboration
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : 'bg-gray-100 text-gray-800'
              }`}>
                {!msg.isUser && (
                  <div className={`text-xs font-semibold mb-1 ${getAgentColor(msg.agent)}`}>
                    {getAgentIcon(msg.agent)} {msg.sender}
                    {msg.confidence && (
                      <span className="ml-1 opacity-60">
                        ({Math.round(msg.confidence * 100)}%)
                      </span>
                    )}
                  </div>
                )}

                <div className="text-sm whitespace-pre-wrap">{msg.message}</div>

                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs opacity-70">Suggestions:</div>
                    {msg.suggestions.slice(0, 2).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => useSuggestion(suggestion)}
                        className="block text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-2 py-1 transition-colors text-left w-full"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-lg p-3 max-w-[80%]">
                <div className="text-xs text-blue-600 mb-1">🤖 AI Assistant</div>
                <div className="text-sm">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse animation-delay-200">●</span>
                  <span className="animate-pulse animation-delay-400">●</span>
                  <span className="ml-2">Researching...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          {/* Research Type Selector */}
          <div className="mb-3">
            <select
              value={selectedResearchType}
              onChange={(e) => setSelectedResearchType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {researchTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about compliance, market data, or trade intelligence..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="2"
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={isTyping || !inputMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Send
            </button>
          </div>

          <div className="flex gap-1 mt-2 overflow-x-auto">
            {getContextSuggestions(dashboardContext).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => useSuggestion(suggestion)}
                className="flex-shrink-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
};

export default TeamChatWidget;