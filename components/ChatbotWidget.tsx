'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: 'Bonjour ! Je suis **NexBot**, votre assistant Nexflow. 👋\n\nJe peux vous aider à utiliser l\'application ou vous conseiller sur la qualification des appels immobiliers. Comment puis-je vous aider ?',
}

const SUGGESTIONS = [
  'Comment qualifier un appel entrant ?',
  'Script pour gérer une objection prix',
  'Comment inviter un membre d\'équipe ?',
  'Comment exporter un rapport PDF ?',
]

function formatMessage(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ))
  })
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, isOpen, isMinimized])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch(`${window.location.origin}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      const reply = data.message || data.error || 'Une erreur est survenue.'
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Impossible de contacter le serveur. Vérifiez votre connexion.' }])
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE])
    setInput('')
    setIsLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleOpen = () => {
    setIsOpen(true)
    setIsMinimized(false)
  }

  return (
    <>
      {/* ── Styles injectés ── */}
      <style>{`
        @keyframes nexbot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes nexbot-pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes nexbot-fadein {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nexbot-dot { animation: nexbot-bounce 1.4s infinite ease-in-out; }
        .nexbot-dot:nth-child(2) { animation-delay: 0.16s; }
        .nexbot-dot:nth-child(3) { animation-delay: 0.32s; }
        .nexbot-window { animation: nexbot-fadein 0.22s ease; }
        .nexbot-pulse-ring {
          animation: nexbot-pulse-ring 1.8s ease-out infinite;
        }
      `}</style>

      {/* ── Bouton flottant ── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          aria-label="Ouvrir NexBot"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 50,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            boxShadow: '0 4px 24px rgba(34,197,94,0.45), 0 2px 8px rgba(0,0,0,0.4)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Anneau pulse */}
          <span
            className="nexbot-pulse-ring"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid rgba(34,197,94,0.6)',
            }}
          />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      )}

      {/* ── Fenêtre chatbot ── */}
      {isOpen && (
        <div
          className="nexbot-window"
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            zIndex: 50,
            width: 'min(384px, calc(100vw - 48px))',
            height: isMinimized ? '60px' : '520px',
            borderRadius: '20px',
            background: 'rgba(10,26,15,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(34,197,94,0.25)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(34,197,94,0.08), 0 8px 32px rgba(34,197,94,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(22,163,74,0.10) 100%)',
              borderBottom: '1px solid rgba(34,197,94,0.15)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
              cursor: isMinimized ? 'pointer' : 'default',
            }}
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            {/* Avatar */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(34,197,94,0.4)',
            }}>N</div>

            {/* Nom + statut */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '14px', lineHeight: 1 }}>NexBot</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 6px #22c55e',
                  animation: 'nexbot-pulse-ring 1.8s ease-out infinite',
                  display: 'inline-block',
                }}/>
                <span style={{ color: '#4ade80', fontSize: '11px' }}>En ligne</span>
              </div>
            </div>

            {/* Bouton reset */}
            <button
              onClick={(e) => { e.stopPropagation(); handleReset() }}
              title="Nouvelle conversation"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#86efac',
                flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </svg>
            </button>

            {/* Bouton minimize */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized) }}
              title={isMinimized ? 'Agrandir' : 'Réduire'}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#86efac',
                flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {isMinimized
                  ? <polyline points="18 15 12 9 6 15"/>
                  : <polyline points="6 9 12 15 18 9"/>}
              </svg>
            </button>

            {/* Bouton fermer */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsMinimized(false) }}
              title="Fermer"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#86efac',
                flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* ── Corps (messages) ── */}
          {!isMinimized && (
            <>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(34,197,94,0.2) transparent',
                }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '9px 13px',
                        borderRadius: msg.role === 'user'
                          ? '16px 16px 4px 16px'
                          : '16px 16px 16px 4px',
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                          : 'rgba(255,255,255,0.07)',
                        border: msg.role === 'user'
                          ? 'none'
                          : '1px solid rgba(255,255,255,0.1)',
                        color: msg.role === 'user' ? 'white' : '#e2fce8',
                        fontSize: '13px',
                        lineHeight: '1.55',
                        boxShadow: msg.role === 'user'
                          ? '0 2px 8px rgba(34,197,94,0.25)'
                          : '0 1px 4px rgba(0,0,0,0.2)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {formatMessage(msg.content)}
                    </div>
                  </div>
                ))}

                {/* Suggestions */}
                {messages.length === 1 && !isLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        style={{
                          textAlign: 'left',
                          background: 'rgba(34,197,94,0.07)',
                          border: '1px solid rgba(34,197,94,0.2)',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          color: '#86efac',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'background 0.15s, border-color 0.15s',
                          lineHeight: 1.4,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.14)'
                          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.4)'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.07)'
                          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.2)'
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Typing indicator */}
                {isLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px 16px 16px 4px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      {[0,1,2].map((i) => (
                        <span
                          key={i}
                          className="nexbot-dot"
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#22c55e',
                            display: 'inline-block',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Input ── */}
              <div style={{
                padding: '10px 12px 8px',
                borderTop: '1px solid rgba(34,197,94,0.12)',
                flexShrink: 0,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: '12px',
                  padding: '6px 6px 6px 12px',
                  transition: 'border-color 0.2s',
                }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Posez votre question…"
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f0fdf4',
                      fontSize: '13px',
                      lineHeight: 1.4,
                    }}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={isLoading || !input.trim()}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: input.trim() && !isLoading
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                        : 'rgba(34,197,94,0.15)',
                      border: 'none',
                      cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.2s',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !isLoading ? 'white' : 'rgba(34,197,94,0.4)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>

                {/* Footer */}
                <p style={{
                  textAlign: 'center',
                  color: 'rgba(134,239,172,0.3)',
                  fontSize: '10px',
                  marginTop: '6px',
                  letterSpacing: '0.02em',
                }}>
                  Powered by Nexflow AI
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
