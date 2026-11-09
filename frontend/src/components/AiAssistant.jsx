import React, { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  SparklesIcon,
  SendIcon,
  TrashIcon,
  UserIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  LockIcon,
  ZapIcon
} from './Icons';

const SUGGESTED_QUESTIONS = [
  {
    title: '💼 Fake Job Offer',
    query: 'How do I identify a fake job offer?'
  },
  {
    title: '🔑 Asking for OTP',
    query: 'Someone is asking for my OTP. What should I do?'
  },
  {
    title: '🔗 Phishing Links',
    query: 'How can I identify phishing links?'
  },
  {
    title: '💳 UPI Scams',
    query: 'How do UPI scams happen?'
  },
  {
    title: '🚨 Sent Money Emergency',
    query: 'What should I do if I accidentally sent money to a scammer?'
  }
];

const INITIAL_MESSAGE = {
  id: 'welcome-msg',
  sender: 'ai',
  text: `👋 **Hello! I am your ScamLens Digital Safety Assistant.**

I'm here to help you spot deception, understand how scammers operate, and protect your hard-earned money and personal accounts.

You can ask me anything about:
• Suspicious SMS, WhatsApp alerts, or emails
• Fake job offers and Telegram recruitment tasks
• Bank KYC, electricity cutoff, or OTP demands
• How UPI payment scams work and how to stay safe

Select a popular question below or type your scenario to get started!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  modelUsed: 'ScamLens Safety Advisor'
};

export default function AiAssistant({ geminiConfigured }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const messageText = typeof textToSend === 'string' ? textToSend.trim() : inputValue.trim();
    if (!messageText || isLoading) return;

    setError(null);
    setInputValue('');

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const historyPayload = newMessages
        .filter((m) => m.id !== 'welcome-msg')
        .slice(-8)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text
        }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let data;
      try {
        data = await apiRequest('/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: messageText,
            history: historyPayload
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const aiResponse = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'I could not generate a response. Please try asking again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || 'Gemini 2.0 Flash',
        isFallback: data.isFallback
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error('Chat error:', err);
      if (err.name === 'AbortError') {
        setError('The assistant took too long to reply. Please check your connection and try again.');
      } else {
        setError(err.message || 'Could not connect to the AI Assistant. Please ensure the backend server is running.');
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setError(null);
    setInputValue('');
  };

  // Simple clean markdown-like text formatter
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      // Bold text formatting
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Monospace backticks
      formattedLine = formattedLine.replace(/`([^`]+)`/g, '<code class="chat-code">$1</code>');

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <li
            key={idx}
            className="chat-list-item"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[•\-]\s*/, '') }}
          />
        );
      }

      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <li
            key={idx}
            className="chat-list-num"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\d+\.\s*/, '') }}
          />
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="chat-spacer" />;
      }

      return (
        <p
          key={idx}
          className="chat-paragraph"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <div className="assistant-section-container">
      {/* Chat Window Container */}
      <div className="assistant-chat-card">
        {/* Chat Window Top Bar */}
        <div className="assistant-top-bar">
          <div className="assistant-profile-group">
            <div className="assistant-avatar">
              <SparklesIcon size={20} />
            </div>
            <div className="assistant-info">
              <div className="assistant-title-row">
                <h3 className="assistant-name">ScamLens AI Assistant</h3>
                <span className="assistant-verified-badge">
                  <ShieldCheckIcon size={12} />
                  <span>Digital Safety Advisor</span>
                </span>
              </div>
              <p className="assistant-role-desc">
                Educating and protecting you against online scams & cyber fraud
              </p>
            </div>
          </div>

          <div className="assistant-actions">
            <button
              type="button"
              className="chat-clear-btn"
              onClick={handleClearChat}
              title="Reset conversation"
            >
              <TrashIcon size={14} />
              <span>Clear Chat</span>
            </button>
          </div>
        </div>

        {/* Suggested Questions Quick Bar */}
        <div className="suggested-questions-bar">
          <div className="suggested-label">
            <ZapIcon size={13} className="suggested-icon" />
            <span>Suggested Safety Questions:</span>
          </div>
          <div className="suggested-chips-list">
            {SUGGESTED_QUESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className="suggested-chip-btn"
                onClick={() => handleSendMessage(item.query)}
                disabled={isLoading}
              >
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages Feed Area */}
        <div className="chat-messages-area">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`chat-message-row ${isUser ? 'user-row' : 'ai-row'}`}>
                {!isUser && (
                  <div className="chat-avatar-bubble ai">
                    <SparklesIcon size={16} />
                  </div>
                )}

                <div className={`chat-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
                  {!isUser && (
                    <div className="bubble-header-meta">
                      <span className="bubble-author">ScamLens AI</span>
                      <span className="bubble-model-tag">{msg.modelUsed || 'AI Advisor'}</span>
                    </div>
                  )}

                  <div className="bubble-content">
                    {renderFormattedText(msg.text)}
                  </div>

                  <span className="bubble-time">{msg.timestamp}</span>
                </div>

                {isUser && (
                  <div className="chat-avatar-bubble user">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator while waiting for AI */}
          {isLoading && (
            <div className="chat-message-row ai-row">
              <div className="chat-avatar-bubble ai">
                <SparklesIcon size={16} />
              </div>
              <div className="chat-bubble ai-bubble typing-bubble">
                <div className="typing-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <span className="typing-text">ScamLens AI is thinking...</span>
              </div>
            </div>
          )}

          {/* Inline Error Alert */}
          {error && (
            <div className="chat-error-card">
              <AlertTriangleIcon size={18} className="chat-error-icon" />
              <div className="chat-error-text">
                <strong>Assistant Notice:</strong> {error}
              </div>
              <button
                type="button"
                className="chat-retry-btn"
                onClick={() => handleSendMessage(messages[messages.length - 1]?.text)}
              >
                <RefreshIcon size={13} />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="chat-input-bar">
          <div className="chat-input-container">
            <textarea
              ref={inputRef}
              rows={1}
              className="chat-textarea"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about scams, fake job offers, OTPs, or UPI safety (e.g. 'Is this text safe?')..."
              disabled={isLoading}
            />
            <button
              type="button"
              className="chat-send-btn"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              title="Send message (Enter)"
            >
              <SendIcon size={17} />
              <span>Send</span>
            </button>
          </div>
          <div className="chat-footer-note">
            <LockIcon size={12} className="footer-lock-icon" />
            <span>Private & confidential. Educational guidance only — always verify independently.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

