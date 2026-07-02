'use client';

/**
 * UserContext - Preserves user state across features
 * 
 * Context7 reference: /facebook/react - Context API best practices
 * 
 * Maintains:
 * - chatHistory: Conversation history for AI chat (max 50 messages)
 * - userCriteria: Filter values for marketplace eligibility (persisted in localStorage)
 * - draftDocuments: In-progress Auto-Birokrasi documents
 * 
 * This allows seamless navigation between features while preserving state
 */

import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import type { UIMessage } from 'ai';

// User criteria for marketplace filtering
export interface UserCriteria {
  income?: number;
  familySize?: number;
  location?: {
    province?: string;
    city?: string;
    district?: string;
  };
  occupation?: string;
  hasChildren?: boolean;
  childrenCount?: number;
  hasDisability?: boolean;
  isPregnant?: boolean;
  age?: number;
  // Agriculture-specific (conditional fields)
  landSize?: number;
  cropType?: string;
  // Additional criteria
  hasElectricity?: boolean;
  housingStatus?: 'own' | 'rent' | 'family' | 'other';
  educationLevel?: string;
}

// Draft document for Auto-Birokrasi
export interface DraftDocument {
  id: string;
  programId: string;
  programName: string;
  documentType: string;
  fields: Record<string, any>;
  lastModified: Date;
  isComplete: boolean;
}

interface UserContextValue {
  // Chat history
  chatHistory: UIMessage[];
  addChatMessage: (message: UIMessage) => void;
  clearChatHistory: () => void;
  
  // User criteria for marketplace
  userCriteria: UserCriteria;
  updateUserCriteria: (criteria: Partial<UserCriteria>) => void;
  clearUserCriteria: () => void;
  
  // Draft documents for Auto-Birokrasi
  draftDocuments: Map<string, DraftDocument>;
  saveDraft: (draft: DraftDocument) => void;
  getDraft: (documentId: string) => DraftDocument | undefined;
  deleteDraft: (documentId: string) => void;
  clearAllDrafts: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const MAX_CHAT_HISTORY = 50;
const USER_CRITERIA_STORAGE_KEY = 'bantu-arah:user-criteria';

export function UserContextProvider({ children }: { children: ReactNode }) {
  const [chatHistory, setChatHistory] = useState<UIMessage[]>([]);
  const [userCriteria, setUserCriteria] = useState<UserCriteria>({});
  const [draftDocuments, setDraftDocuments] = useState<Map<string, DraftDocument>>(
    new Map()
  );
  const [isHydrated, setIsHydrated] = useState(false);

  // Load user criteria from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(USER_CRITERIA_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUserCriteria(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load user criteria from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save user criteria to localStorage whenever it changes (client-side only)
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return; // Don't save during initial hydration or SSR
    
    try {
      if (Object.keys(userCriteria).length > 0) {
        localStorage.setItem(USER_CRITERIA_STORAGE_KEY, JSON.stringify(userCriteria));
      } else {
        localStorage.removeItem(USER_CRITERIA_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save user criteria to localStorage:', error);
    }
  }, [userCriteria, isHydrated]);

  // Chat history management
  const addChatMessage = (message: UIMessage) => {
    setChatHistory((prev) => {
      const updated = [...prev, message];
      // Keep only the last MAX_CHAT_HISTORY messages
      if (updated.length > MAX_CHAT_HISTORY) {
        return updated.slice(-MAX_CHAT_HISTORY);
      }
      return updated;
    });
  };

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  // User criteria management
  const updateUserCriteria = (criteria: Partial<UserCriteria>) => {
    setUserCriteria((prev) => ({
      ...prev,
      ...criteria,
    }));
  };

  const clearUserCriteria = () => {
    setUserCriteria({});
  };

  // Draft documents management
  const saveDraft = (draft: DraftDocument) => {
    setDraftDocuments((prev) => {
      const updated = new Map(prev);
      updated.set(draft.id, {
        ...draft,
        lastModified: new Date(),
      });
      return updated;
    });
  };

  const getDraft = (documentId: string): DraftDocument | undefined => {
    return draftDocuments.get(documentId);
  };

  const deleteDraft = (documentId: string) => {
    setDraftDocuments((prev) => {
      const updated = new Map(prev);
      updated.delete(documentId);
      return updated;
    });
  };

  const clearAllDrafts = () => {
    setDraftDocuments(new Map());
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      chatHistory,
      addChatMessage,
      clearChatHistory,
      userCriteria,
      updateUserCriteria,
      clearUserCriteria,
      draftDocuments,
      saveDraft,
      getDraft,
      deleteDraft,
      clearAllDrafts,
    }),
    [chatHistory, userCriteria, draftDocuments]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook to use the UserContext
export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
}
