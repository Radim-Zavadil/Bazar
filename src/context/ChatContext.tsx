"use client";

import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

interface ChatContextValue {
  isOpen: boolean;
  activeChatId: number | null;
  openChat: (chatId: number) => void;
  openPanel: () => void;
  closePanel: () => void;
  setActiveChatId: (id: number | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  const openChat = useCallback((chatId: number) => {
    setActiveChatId(chatId);
    setIsOpen(true);
  }, []);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  return (
    <ChatContext.Provider value={{ isOpen, activeChatId, openChat, openPanel, closePanel, setActiveChatId }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}
