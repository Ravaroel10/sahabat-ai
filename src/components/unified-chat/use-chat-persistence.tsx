"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import type { UIMessage } from "ai";

/**
 * Hook to manage chat persistence
 * - Auto-saves messages to database (only if messages exist)
 * - Loads sessions from URL params
 * - Creates new sessions automatically
 */
export function useChatPersistence(messages: UIMessage[], setMessages: (messages: UIMessage[]) => void) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const previousSessionIdRef = useRef<string | null>(null);

  // Load a session
  const loadSession = useCallback(
    async (sessionId: string) => {
      if (!session) {
        console.log("[useChatPersistence] Cannot load session - user not authenticated");
        return;
      }

      console.log("[useChatPersistence] Fetching session from API:", sessionId);
      setIsLoadingSession(true);
      try {
        const response = await fetch(`/api/chat/history/${sessionId}`);
        console.log("[useChatPersistence] API response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("[useChatPersistence] Session data received:", {
            sessionId: data.session.id,
            messageCount: data.session.messages?.length || 0,
            messages: data.session.messages,
          });
          
          console.log("[useChatPersistence] Setting messages:", data.session.messages);
          setCurrentSessionId(sessionId);
          
          // Ensure messages is always an array
          const loadedMessages = data.session.messages || [];
          setMessages(loadedMessages);
          
          // Verify messages were set
          console.log("[useChatPersistence] Messages should now be set. Count:", loadedMessages.length);
        } else {
          console.error("[useChatPersistence] API error:", await response.text());
        }
      } catch (error) {
        console.error("[useChatPersistence] Failed to load session:", error);
      } finally {
        setIsLoadingSession(false);
      }
    },
    [session, setMessages]
  );

  // Load session from URL on mount and when it changes
  useEffect(() => {
    const sessionId = searchParams.get("session");
    
    console.log("[useChatPersistence] URL effect triggered:", {
      newSessionId: sessionId,
      previousSessionId: previousSessionIdRef.current,
      currentMessages: messages.length,
      currentSessionId,
      pathname,
      isAuthenticated: !!session,
    });
    
    // Session ID changed - load new session or clear
    if (sessionId !== previousSessionIdRef.current) {
      if (sessionId && session) {
        // Load the session only if authenticated
        console.log("[useChatPersistence] Loading session:", sessionId);
        loadSession(sessionId);
        previousSessionIdRef.current = sessionId;
      } else if (!sessionId) {
        // No session ID - clear everything for new chat
        console.log("[useChatPersistence] Clearing for new chat");
        setCurrentSessionId(null);
        setMessages([]);
        previousSessionIdRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, session]);

  // Auto-save messages (only if messages exist)
  useEffect(() => {
    if (messages.length === 0 || !session) {
      return;
    }

    const saveSession = async () => {
      console.log("[useChatPersistence] Auto-saving session:", {
        currentSessionId,
        messageCount: messages.length,
      });
      
      setIsSaving(true);
      try {
        if (currentSessionId) {
          // Update existing session
          console.log("[useChatPersistence] Updating existing session:", currentSessionId);
          await fetch(`/api/chat/history/${currentSessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages }),
          });
        } else {
          // Create new session only if we have messages
          console.log("[useChatPersistence] Creating new session");
          const response = await fetch("/api/chat/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("[useChatPersistence] New session created:", data.session.id);
            setCurrentSessionId(data.session.id);
            previousSessionIdRef.current = data.session.id;
            
            // Update URL with session ID without triggering navigation
            const newUrl = `${pathname}?session=${data.session.id}`;
            window.history.replaceState(null, "", newUrl);
          }
        }
      } catch (error) {
        console.error("Failed to save session:", error);
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce saves
    const timeoutId = setTimeout(saveSession, 1000);
    return () => clearTimeout(timeoutId);
  }, [messages, session, currentSessionId, pathname]);

  return {
    currentSessionId,
    isSaving,
    isLoadingSession,
    loadSession,
  };
}
