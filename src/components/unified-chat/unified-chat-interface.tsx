'use client';

/**
 * UnifiedChatInterface - Multi-capability chat component with persistence
 * 
 * Integrates 4 capabilities:
 * 1. Rights Navigation - Guide users to social assistance programs
 * 2. Evidence Citation - Cite regulations (Permensos, UU, Perpres)
 * 3. Fact Checking - Verify claims against official sources
 * 4. Emergency Escalation - Detect urgent situations and prioritize help
 * 
 * With automatic chat history saving for authenticated users
 */

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, AlertTriangle } from 'lucide-react';
import { Markdown } from '@/components/ui/markdown';
import { useSession } from '@/lib/auth-client';
import { useChatPersistence } from './use-chat-persistence';
import { cleanupStreamedText } from '@/lib/streamed-text-cleanup';
import {
  CitationRenderer,
  EmergencyAlertRenderer,
  ProgramCardRenderer,
  InlineProgramCardRenderer,
  InlineActionButtonRenderer,
} from './message-parts';

interface UnifiedChatInterfaceProps {
  className?: string;
  showExamples?: boolean;
}

export function UnifiedChatInterface({ 
  className = '',
  showExamples = true 
}: UnifiedChatInterfaceProps) {
  const [input, setInput] = useState('');
  const { data: session } = useSession();
  
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const { isSaving, isLoadingSession } = useChatPersistence(messages, setMessages);

  // Debug log messages changes
  useEffect(() => {
    console.log("[UnifiedChatInterface] Messages changed:", {
      count: messages.length,
      messages: messages.map(m => ({ role: m.role, id: m.id, partCount: m.parts.length })),
    });
  }, [messages]);

  const isBusy = status !== 'ready';
  const busyLabel = status === 'submitted'
    ? 'Menghubungkan...'
    : status === 'streaming'
      ? 'Sedang mengetik...'
      : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isBusy) return;

    sendMessage({
      text: input,
    });

    setInput('');
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  const examplePrompts = [
    "Saya buruh bangunan, penghasilan Rp 1,5 juta/bulan, punya 3 anak sekolah",
    "Suami saya jatuh dari perancah dan sekarang di rumah sakit",
    "Ibu saya berusia 70 tahun dan tinggal sendiri, apakah bisa dapat bantuan?",
    "Bagaimana cara mendaftar PKH? Apa saja syaratnya?"
  ];

  const isEmpty = messages.length === 0;

  if (isLoadingSession) {
    return (
      <div className={`flex flex-col h-full min-h-0 items-center justify-center ${className}`}>
        <div className="text-center space-y-2">
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-sm text-muted-foreground">Memuat chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 flex flex-col space-y-6">
        {isEmpty && showExamples ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-primary">
                SAHABAT AI Assistant
              </h2>
              <p className="text-muted-foreground max-w-md">
                Ceritakan situasi Anda, dan saya akan membantu menemukan program bantuan sosial yang sesuai
              </p>
            </div>
            
            {/* Example prompts as chips */}
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
                <Card className={`max-w-[80%] p-4 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <div className="space-y-2">
                    {message.role === 'assistant' && (
                      <div className="text-xs font-semibold text-primary mb-2">
                        SAHABAT AI
                      </div>
                    )}
                    
                    {/* Render message parts in specific order */}
                    {(() => {
                      const allParts = message.parts;
                      
                      return allParts.map((part, index) => {
                        if (part.type === 'text') {
                          // Single-pass cleanup: strip leaked intent-JSON
                          // and apply formal→conversational Indonesian tone
                          // transformation. Fixes Bug 1 (transform computed in
                          // Python but never delivered) and Bug 3 (token-by-token
                          // JSON filter was fragile). See src/lib/streamed-text-cleanup.ts.
                          let textContent = cleanupStreamedText(part.text).trim();

                          // Skip rendering if text is empty after cleanup
                          if (!textContent) return null;
                          
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
                          return <EmergencyAlertRenderer key={`emergency-${index}`} {...(part as any).data} />;
                        } else if (part.type === 'data-program') {
                          return <ProgramCardRenderer key={`program-${index}`} program={(part as any).data.program} />;
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
                      });
                    })()}
                  </div>
                </Card>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isBusy && (
              <div className="flex justify-start">
                <Card className="max-w-[80%] p-4 bg-muted" role="status" aria-live="polite">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{busyLabel}</span>
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
                  {error.message || 'Gagal menghubungi server. Silakan coba lagi.'}
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
            SAHABAT AI memberikan informasi umum. Verifikasi ke Dinas Sosial untuk kepastian kelayakan.
          </p>
          {session && isSaving && (
            <span className="text-xs text-muted-foreground">Menyimpan...</span>
          )}
        </div>
      </div>
    </div>
  );
}
