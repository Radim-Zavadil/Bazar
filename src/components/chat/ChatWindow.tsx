"use client";

import { ActionIcon, Box, Divider, Group, ScrollArea, Text, TextInput, Tooltip } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { FaCirclePlus } from "react-icons/fa6";
import { HiPaperAirplane } from "react-icons/hi2";
import { IoChevronBack } from "react-icons/io5";
import type { ChatWithLastMessage } from "./ChatPanel";

interface Message {
  id: number;
  chatId: number;
  senderName: string;
  content: string;
  createdAt: string;
}

interface ChatWindowProps {
  chat: ChatWithLastMessage;
  currentUser: string;
  isLoggedIn: boolean;
  onBack: () => void;
  onMessagesUpdate: () => void;
}

export function ChatWindow({ chat, currentUser, isLoggedIn, onBack, onMessagesUpdate }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);

  // Load messages when chat changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/chats/${chat.id}/messages`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setMessages(data);
      } catch {
        // ignore
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [chat.id]);

  // Auto-scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending || !isLoggedIn) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return;
      const msg: Message = await res.json();
      setMessages((prev) => [...prev, msg]);
      setInput("");
      onMessagesUpdate();
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Group messages by date for timestamp headers
  function formatDateHeader(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) {
      return `Dnes v ${d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (diffDays === 1) return "Včera";
    return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "long" });
  }

  // The other person in the chat
  const otherPerson = chat.buyerName === currentUser ? chat.sellerName : chat.buyerName;

  return (
    <Box style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>
      {/* ── Header ── */}
      <Box
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          borderBottom: "1px solid #F0F0F0",
          flexShrink: 0,
        }}
      >
        <ActionIcon variant="subtle" color="dark" size="md" onClick={onBack} aria-label="Zpět">
          <IoChevronBack size={20} />
        </ActionIcon>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} size="sm" truncate>
            {chat.listingTitle}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {otherPerson}
          </Text>
        </Box>
      </Box>

      {/* ── Messages ── */}
      <ScrollArea viewportRef={viewport} style={{ flex: 1 }} px={16} py={12}>
        {messages.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" pt="xl">
            Zatím žádné zprávy. Začněte konverzaci!
          </Text>
        ) : (
          <Box style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {messages.map((msg, i) => {
              const isMe = msg.senderName === currentUser;
              const prevMsg = messages[i - 1];
              // Show date header if first message or different day
              const showDateHeader =
                i === 0 || new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

              return (
                <Box key={msg.id}>
                  {showDateHeader && (
                    <Text
                      size="xs"
                      c="dimmed"
                      ta="center"
                      py={8}
                      style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10 }}
                    >
                      {formatDateHeader(msg.createdAt)}
                    </Text>
                  )}
                  <Box
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start",
                      marginBottom: 2,
                    }}
                  >
                    <Box
                      style={{
                        background: isMe ? "#1754D8" : "#EFEFEF",
                        color: isMe ? "#fff" : "#1A1A1A",
                        // iOS-style sharp tail on the bottom corner
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        padding: "9px 14px",
                        maxWidth: "78%",
                        wordBreak: "break-word",
                        lineHeight: 1.45,
                      }}
                    >
                      <Text size="sm" style={{ color: "inherit", lineHeight: 1.45 }}>
                        {msg.content}
                      </Text>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </ScrollArea>

      {/* ── Input bar ── */}
      <Box
        style={{
          borderTop: "1px solid #F0F0F0",
          padding: "10px 12px",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        {!isLoggedIn ? (
          <Text size="sm" c="dimmed" ta="center" py={4}>
            Pro psaní zpráv se musíte přihlásit.
          </Text>
        ) : (
          <Group gap={8} wrap="nowrap" align="center">
            {/* Plus button — decorative / future attachment */}
            <ActionIcon variant="subtle" color="gray" size="lg" radius="xl" aria-label="Příloha" disabled>
              <FaCirclePlus size={22} color="#A0A0A0" />
            </ActionIcon>

            <TextInput
              style={{ flex: 1 }}
              placeholder="Zpráva..."
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              radius="xl"
              size="sm"
              disabled={sending}
              styles={{
                input: {
                  border: "1px solid #E8E8E8",
                  background: "#F8F8F8",
                  fontSize: 14,
                  paddingLeft: 16,
                  paddingRight: 16,
                },
              }}
            />

            <Tooltip label="Odeslat" withArrow position="top" disabled={!input.trim()}>
              <ActionIcon
                size="lg"
                radius="xl"
                variant="filled"
                onClick={handleSend}
                loading={sending}
                disabled={!input.trim()}
                aria-label="Odeslat zprávu"
                style={{
                  background: input.trim() ? "#1754D8" : "#E0E0E0",
                  transition: "background 0.15s",
                }}
              >
                <HiPaperAirplane size={16} color={input.trim() ? "#fff" : "#999"} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Box>
    </Box>
  );
}
