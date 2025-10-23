/**
 * FloatingTeamChat.js - Real-time chat between Jorge and Cristina
 * Floating widget in bottom-right corner with real-time Supabase updates
 */

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function FloatingTeamChat({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Determine sender role based on currentUser
  const senderRole = currentUser === 'Jorge' ? 'Jorge' : 'Cristina';
  const recipientRole = currentUser === 'Jorge' ? 'Cristina' : 'Jorge';

  // Load messages
  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('team_messages')
        .insert([{
          sender_name: currentUser,
          sender_role: senderRole,
          message: newMessage.trim()
        }]);

      if (error) throw error;

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set up real-time subscription
  useEffect(() => {
    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('team_messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages'
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages(prev => [...prev, newMsg]);

          // Increment unread count if chat is closed and message is from other person
          if (!isOpen && newMsg.sender_role !== senderRole) {
            setUnreadCount(prev => prev + 1);
          }

          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isOpen, senderRole]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen]);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="floating-chat-button" onClick={() => setIsOpen(!isOpen)}>
        <span className="chat-icon">💬</span>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="floating-chat-window">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-content">
              <h3>Team Chat</h3>
              <p className="chat-subtitle">
                {currentUser === 'Jorge' ? '👨‍💼 Jorge → 👩‍💼 Cristina' : '👩‍💼 Cristina → 👨‍💼 Jorge'}
              </p>
            </div>
            <button
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div className="chat-messages" ref={chatContainerRef}>
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <p>No messages yet</p>
                <p className="chat-empty-subtitle">Start a conversation with {recipientRole}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.sender_role === senderRole ? 'message-sent' : 'message-received'}`}
                >
                  <div className="message-header">
                    <span className="message-sender">
                      {msg.sender_role === 'Jorge' ? '👨‍💼' : '👩‍💼'} {msg.sender_name}
                    </span>
                    <span className="message-time">{formatTime(msg.created_at)}</span>
                  </div>
                  <div className="message-content">
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form className="chat-input-form" onSubmit={sendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder={`Message ${recipientRole}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!newMessage.trim() || loading}
            >
              {loading ? '⏳' : '📤'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
