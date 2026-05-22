"use client";

import { ActionIcon, Box, Divider, Group, ScrollArea, Text, TextInput, Title } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import type { Chat } from "./ChatPanel";

interface Message {
  id: number;
  chatId: number;
  senderName: string;
  content: string;
  createdAt: string;
}

interface ChatWindowProps {
  chat: Chat;
  currentUser: string;
  onMessagesUpdate?: () => void;
}

export function ChatWindow({ chat, currentUser, onMessagesUpdate }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);

  // Load messages for this chat
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

  // Auto-scroll to bottom
  // biome-ignore lint/correctness/useExhaustiveDependencies: We want to scroll whenever a new message arrives
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderName: currentUser, content }),
      });
      if (!res.ok) return;
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setInput("");
      onMessagesUpdate?.();
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

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <Box style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box px="md" py="sm">
        <Title order={6} fw={700}>
          {chat.listingTitle}
        </Title>
        <Text size="xs" c="dimmed">
          {chat.sellerName}
        </Text>
      </Box>

      <Divider />

      {/* Messages */}
      <ScrollArea viewportRef={viewport} style={{ flex: 1 }} px="md" py="sm">
        {messages.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" pt="xl">
            Zatím žádné zprávy. Pozdrav první!
          </Text>
        ) : (
          <Box style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map((msg) => {
              const isMe = msg.senderName === currentUser;
              return (
                <Box
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMe ? "flex-end" : "flex-start",
                  }}
                >
                  {!isMe && (
                    <Text size="xs" c="dimmed" mb={2}>
                      {msg.senderName}
                    </Text>
                  )}
                  <Box
                    style={{
                      background: isMe ? "var(--mantine-color-blue-6)" : "var(--mantine-color-gray-1)",
                      color: isMe ? "white" : "inherit",
                      borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      padding: "8px 14px",
                      maxWidth: "75%",
                      wordBreak: "break-word",
                    }}
                  >
                    <Text size="sm">{msg.content}</Text>
                  </Box>
                  <Text size="xs" c="dimmed" mt={2}>
                    {formatTime(msg.createdAt)}
                  </Text>
                </Box>
              );
            })}
          </Box>
        )}
      </ScrollArea>

      <Divider />

      {/* Input */}
      <Group px="md" py="sm" gap="xs" wrap="nowrap">
        <TextInput
          style={{ flex: 1 }}
          placeholder="Napsat zprávu..."
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          radius="xl"
          size="sm"
          disabled={sending}
        />
        <ActionIcon
          size="lg"
          radius="xl"
          variant="filled"
          color="blue"
          onClick={handleSend}
          loading={sending}
          disabled={!input.trim()}
          aria-label="Odeslat zprávu"
        >
          <IoSend size={15} />
        </ActionIcon>
      </Group>
    </Box>
  );
}
