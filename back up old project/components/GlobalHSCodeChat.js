/**
 * Global Marcus Intelligence Chat Widget
 * Enhanced Triangle Intelligence assistant - floating chat button
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function GlobalMarcusIntelligenceChat() {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: t('chat.introMessageGlobal'),
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
      setSessionId(`global_marcus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [])

  // Update intro message when language changes
  useEffect(() => {
    setMessages(prev => prev.map((msg, index) => 
      index === 0 && msg.isIntro ? { ...msg, text: t('chat.introMessageGlobal') } : msg
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
          text: data.error || t('chat.errorNotFound')
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: t('chat.errorTrouble')
      }])
    }

    setIsLoading(false)
  }

  const handleCopyCode = (hsCode) => {
    navigator.clipboard.writeText(hsCode)
    setMessages(prev => [...prev, { 
      type: 'bot', 
      text: t('chat.copied', { code: hsCode })
    }])
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            fontSize: '24px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={t('chat.floating.tooltip')}
        >
          🧠
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '350px',
          maxHeight: '500px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '16px',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {t('chat.headerGlobal')}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {t('chat.close')}
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: '16px',
            maxHeight: '300px',
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
                                 message.isIntro ? '#ede9fe' : '#f8fafc',
                  color: message.type === 'user' ? 'white' : 
                         message.isFollowUp ? '#92400e' : 
                         message.isIntro ? '#5b21b6' : '#1f2937',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  maxWidth: '85%',
                  fontSize: '0.875rem',
                  border: message.isFollowUp ? '1px solid #f59e0b' : 
                          message.isIntro ? '1px solid #8b5cf6' : 
                          message.type === 'bot' ? '1px solid #e2e8f0' : 'none'
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

                  {message.hsCode && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleCopyCode(message.hsCode)}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {t('chat.copyCode')}
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
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  {t('chat.searchingDatabase')}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              gap: '8px',
              alignItems: 'flex-end'
            }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.placeholderGlobal')}
                style={{
                  flex: 1,
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.875rem',
                  outline: 'none'
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
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {t('chat.send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}