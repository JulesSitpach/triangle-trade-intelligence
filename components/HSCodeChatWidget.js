/**
 * Marcus Triangle Intelligence Chat Widget
 * Full Triangle Intelligence assistant with pattern tracking
 */

import { useState, useEffect } from 'react'
import { useSafeTranslation } from '../hooks/useSafeTranslation'

export default function MarcusIntelligenceChat({ onSelectCode, onClose }) {
  const { t, i18n } = useSafeTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: t('chat.introMessage'),
      isIntro: true
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [intelligenceInsights, setIntelligenceInsights] = useState(null)

  // Initialize session ID
  useEffect(() => {
    if (!sessionId) {
      setSessionId(`marcus_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [])

  // Update intro message when language changes
  useEffect(() => {
    setMessages(prev => prev.map((msg, index) => 
      index === 0 && msg.isIntro ? { ...msg, text: t('chat.introMessage') } : msg
    ))
  }, [i18n.language, t])

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage = inputText.trim()
    setInputText('')
    setIsLoading(true)

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])

    try {
      // Call enhanced Marcus Triangle Intelligence API
      const response = await fetch('/api/trade-intelligence-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          sessionId: sessionId,
          language: i18n.language || 'en'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const botResponse = {
          type: 'bot',
          text: data.response,
          followUpQuestion: data.followUpQuestion,
          dataSource: data.dataSource,
          confidence: data.confidence,
          intelligenceGathered: data.intelligenceGathered
        }
        
        setMessages(prev => [...prev, botResponse])
        
        // Update intelligence insights
        if (data.intelligenceGathered) {
          setIntelligenceInsights(data.intelligenceGathered)
        }

        // Add follow-up question as a separate message
        if (data.followUpQuestion) {
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              type: 'bot', 
              text: data.followUpQuestion,
              isFollowUp: true,
              source: 'marcus_intelligence'
            }])
          }, 1500)
        }
      } else {
        setMessages(prev => [...prev, { 
          type: 'bot', 
          text: data.error || t('chat.errorProcessing')
        }])
      }
    } catch (error) {
      console.error('Marcus chat error:', error)
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: t('chat.errorTrouble')
      }])
    }

    setIsLoading(false)
  }

  const handleUseCode = (message) => {
    if (onSelectCode) {
      onSelectCode(message.hsCode)
    }
    setIsOpen(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <div style={{ textAlign: 'center', margin: '10px 0' }}>
        <div style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280', 
          marginBottom: '8px' 
        }}>
          {t('chat.needHelp')}
        </div>
        <div style={{ 
          fontSize: '0.75rem', 
          color: '#9ca3af', 
          marginBottom: '8px' 
        }}>
          {t('chat.services')}
        </div>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
          }}
        >
          {t('chat.askMarcus')}
        </button>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '350px',
      maxHeight: '400px',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontWeight: '600' }}>{t('chat.header')}</div>
        <button
          onClick={() => {
            setIsOpen(false)
            if (onClose) onClose()
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0',
            width: '20px',
            height: '20px'
          }}
        >
          {t('chat.close')}
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '16px',
        maxHeight: '250px',
        overflowY: 'auto'
      }}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              marginBottom: '12px',
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              backgroundColor: message.type === 'user' ? '#3b82f6' : 
                             message.isFollowUp ? '#fef3c7' : 
                             message.isIntro ? '#ede9fe' : '#f3f4f6',
              color: message.type === 'user' ? 'white' : 
                     message.isFollowUp ? '#92400e' : 
                     message.isIntro ? '#5b21b6' : '#1f2937',
              padding: '8px 12px',
              borderRadius: '8px',
              maxWidth: '80%',
              fontSize: '0.875rem',
              border: message.isFollowUp ? '1px solid #f59e0b' : 
                      message.isIntro ? '1px solid #8b5cf6' : 'none'
            }}>
              {typeof message.text === 'string' ? message.text : JSON.stringify(message.text)}
              
              {/* Data source and confidence */}
              {message.dataSource && message.confidence && (
                <div style={{ 
                  marginTop: '6px', 
                  fontSize: '0.65rem', 
                  opacity: 0.7,
                  fontStyle: 'italic'
                }}>
                  {t('chat.sourceInfo', { dataSource: message.dataSource, confidence: message.confidence })}
                </div>
              )}
              
              {/* Follow-up question indicator */}
              {message.isFollowUp && (
                <div style={{ 
                  marginTop: '4px', 
                  fontSize: '0.65rem', 
                  fontWeight: '600',
                  color: '#d97706'
                }}>
                  {t('chat.followupIndicator')}
                </div>
              )}

              {/* HS Code action button */}
              {message.hsCode && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={() => handleUseCode(message)}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {t('chat.useCode')}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '12px'
          }}>
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              {t('chat.searching')}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat.placeholder')}
            style={{
              flex: 1,
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '8px 12px',
              fontSize: '0.875rem'
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {t('chat.send')}
          </button>
        </div>
      </div>

      {/* Intelligence Insights Panel */}
      {intelligenceInsights && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc',
          fontSize: '0.75rem'
        }}>
          <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
            {t('chat.intelligenceInsights')}
          </div>
          <div style={{ color: '#6b7280' }}>
            {t('chat.trendingQuestions', {
              totalQuestions: intelligenceInsights.totalQuestions,
              trends: intelligenceInsights.trendingKeywords?.slice(0, 2).map(k => k.keyword).join(', ')
            })}
          </div>
        </div>
      )}
    </div>
  )
}