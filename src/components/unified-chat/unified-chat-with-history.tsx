'use client';

/**
 * UnifiedChatWithHistory - Chat interface with persistent history
 * 
 * Extends UnifiedChatInterface with:
 * - Persistent chat sessions for authenticated users
 * - Auto-save on message send
 * - Load previous conversations
 * - ChatGPT/Claude-style sidebar
 */

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, AlertTriangle } from 'lucide-react';
import { Markdown } from '@/components/ui/markdown';
import { useSession } from '@/lib/auth-client';
import {
  CitationRenderer,
  EmergencyAlertRenderer,
  ProgramCardRenderer,
  InlineProgramCardRenderer,
  InlineActionButtonRenderer,
} from './message-parts';
import { ChatHistorySidebar } from '@/components/chat-history-sidebar';

interface UnifiedChatWithHistoryProps {
  className?: string;
  showExamples?: boolean;
}

export function UnifiedChatWithHistory({
  className = '',
  showExamples = true,
}: UnifiedChatWithHistoryProps) {
  const [input, setInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { data: session } = useSession();

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const isBusy = status !== 'ready';
  const busyLabel =
    status === 'submitted'
      ? 'Menghubungkan...'
      : status === 'streaming'
        ? 'Sedang mengetik...'
        : '';

  // Auto-save messages when they change
  useEffect(() => {
    if (messages.length === 0 || !session) return;

    const saveSession = async () => {
      setIsSaving(true);
      try {
        if (currentSessionId) {
          // Update existing session
          await fetch(`/api/chat/history/${currentSessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
          });
        } else {
          // Create new session
          const response = await fetch('/api/chat/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
          });
          const data = await response.json();
          setCurrentSessionId(data.session.id);
        }
      } catch (error) {
        console.error('Failed to save chat session:', error);
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce saves - only save after messages stop changing for 1s
    const timeoutId = setTimeout(saveSession, 1000);
    return () => clearTimeout(timeoutId);
  }, [messages, session, currentSessionId]);

  // Load a previous session
  const loadSession = useCallback(async (sessionId: string | null) => {
    if (!sessionId) {
      setMessages([]);
      setCurrentSessionId(null);
      return;
    }

    try {
      const response = await fetch(`/api/chat/history/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.session.messages);
        setCurrentSessionId(sessionId);
      }
    } catch (error) {
      console.error('Failed to load chat session:', error);
    }
  }, [setMessages]);

  // Start a new chat
  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isBusy) return;

    sendMessage({ text: input });
    setInput('');
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  const examplePrompts = [
    'Saya buruh bangunan, penghasilan Rp 1,5 juta/bulan, punya 3 anak sekolah',
    'Suami saya jatuh dari perancah dan sekarang di rumah sakit',
    'Ibu saya berusia 70 tahun dan tinggal sendiri, apakah bisa dapat bantuan?',
    'Bagaimana cara mendaftar PKH? Apa saja syaratnya?',
  ];

  const isEmpty = messages.length === 0;

  return (
    <div className={`flex h-full min-h-0 ${className}`}>
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        currentSessionId={currentSessionId}
        onSessionSelect={loadSession}
        onNewChat={handleNewChat}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Messages area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 flex flex-col space-y-6">
          {isEmpty && showExamples ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-primary">
                  SAHABAT AI Assistant
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Ceritakan situasi Anda, dan saya akan membantu menemukan
                  program bantuan sosial yang sesuai
                </p>
                {session && (
                  <p className="text-xs text-muted-foreground">
                    Riwayat chat Anda akan disimpan otomatis
                  </p>
                )}
              </div>

              {/* Example prompts */}
              <div className="w-full max-w-2xl space-y-3">
                <p className="text-sm text-muted-foreground font-medium">
                  Contoh pertanyaan:
                </p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
                      onClick={() => handleExampleClick(example)}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={`max-w-[80%] p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="space-y-2">
                      {message.role === 'assistant' && (
                        <div className="text-xs font-semibold text-primary mb-2">
                          SAHABAT AI
                        </div>
                      )}

                      {/* Render message parts */}
                      {message.parts.map((part, index) => {
                        if (part.type === 'text') {
                          let textContent = part.text;

                          // Strip markdown code block wrappers
                          if (
                            textContent.trim().startsWith('```') &&
                            textContent.trim().endsWith('```')
                          ) {
                            textContent = textContent.replace(/^```\s*/, '');
                            textContent = textContent.replace(/\s*```$/, '');
                            textContent = textContent.replace(/^[a-z]+\n/, '');
                          }

                          return (
                            <div key={`text-${index}`}>
                              {message.role === 'user' ? (
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                  {textContent}
                                </div>
                              ) : (
                                <Markdown>{textContent}</Markdown>
                              )}
                            </div>
                          );
                        } else if (part.type === 'data-program-inline') {
                          const programId = (part as any).data?.program_id;
                          const programData = (part as any).data?.program;

                          if (programId || programData) {
                            return (
                              <InlineProgramCardRenderer
                                key={`inline-program-${index}`}
                                programId={programId}
                                program={programData}
                              />
                            );
                          }
                          return null;
                        } else if (part.type === 'data-action-inline') {
                          const actionType = (part as any).data?.action_type;

                          if (actionType) {
                            return (
                              <InlineActionButtonRenderer
                                key={`inline-action-${index}`}
                                actionType={actionType}
                              />
                            );
                          }
                          return null;
                        } else if (part.type === 'data-emergency') {
                          return (
                            <EmergencyAlertRenderer
                              key={`emergency-${index}`}
                              {...(part as any).data}
                            />
                          );
                        } else if (part.type === 'data-program') {
                          return (
                            <ProgramCardRenderer
                              key={`program-${index}`}
                              program={(part as any).data.program}
                            />
                          );
                        } else if (part.type === 'data-citation') {
                          return (
                            <CitationRenderer
                              key={`citation-${index}`}
                              citations={(part as any).data.citations}
                              sectionLabel={(part as any).data.sectionLabel}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  </Card>
                </div>
              ))}

              {/* Loading indicator */}
              {isBusy && (
                <div className="flex justify-start">
                  <Card
                    className="max-w-[80%] p-4 bg-muted"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <div
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <div
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {busyLabel}
                      </span>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* Error display */}
          {error && (
            <Card className="border-destructive bg-destructive/10 p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive">
                    Terjadi kesalahan
                  </p>
                  <p className="text-xs text-destructive/80 mt-1">
                    {error.message ||
                      'Gagal menghubungi server. Silakan coba lagi.'}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Input area */}
        <div className="border-t bg-background p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isBusy ? busyLabel : 'Ceritakan situasi Anda...'}
              disabled={isBusy}
              className="flex-1"
              autoComplete="off"
              aria-label="Tulis pesan untuk AI"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isBusy || !input.trim()}
              aria-busy={isBusy}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Kirim pesan</span>
            </Button>
          </form>

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              SAHABAT AI memberikan informasi umum. Verifikasi ke Dinas Sosial
              untuk kepastian kelayakan.
            </p>
            {session && isSaving && (
              <span className="text-xs text-muted-foreground">
                Menyimpan...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
