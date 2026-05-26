"use client";

import { ActionIcon, Box, Button, Group, ScrollArea, Text, TextInput, Tooltip, UnstyledButton } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { FaCirclePlus } from "react-icons/fa6";
import { HiPaperAirplane } from "react-icons/hi2";
import { IoChevronBack, IoClose } from "react-icons/io5";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import type { ChatWithLastMessage } from "./ChatPanel";
import { PaymentModal } from "./PaymentModal";

interface Message {
  id: number;
  chatId: number;
  senderName: string;
  content: string;
  type: string;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [paymentOpened, setPaymentOpened] = useState(false);
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
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: "smooth",
      });
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
        body: JSON.stringify({ content, type: "text" }),
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

  async function handlePayment() {
    if (sending || !isLoggedIn) return;
    setSending(true);
    setMenuOpen(false);
    try {
      const priceText = chat.listingPrice === null || chat.listingPrice === 0 ? "Zdarma" : `${chat.listingPrice} Kč`;
      const res = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: priceText,
          type: "payment",
        }),
      });
      if (!res.ok) return;
      const msg: Message = await res.json();
      setMessages((prev) => [...prev, msg]);
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
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#fff",
        position: "relative",
      }}
    >
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
          <Group gap={6} align="center" wrap="nowrap">
            <Text fw={600} size="sm" truncate>
              {chat.listingTitle}
            </Text>
            {chat.listingStatus && chat.listingStatus !== "Dostupné" && (
              <Box
                px={6}
                py={1}
                style={{
                  background: chat.listingStatus === "Rezervováno" ? "#FFF9DB" : "#F1F3F5",
                  borderRadius: 4,
                  border: `1px solid ${chat.listingStatus === "Rezervováno" ? "#F59F00" : "#CED4DA"}`,
                }}
              >
                <Text size="10px" fw={700} c={chat.listingStatus === "Rezervováno" ? "#F59F00" : "#495057"}>
                  {chat.listingStatus.toUpperCase()}
                </Text>
              </Box>
            )}
          </Group>
          <Text size="xs" c="dimmed" truncate>
            {otherPerson}
          </Text>
        </Box>
      </Box>

      {/* ── Messages ── */}
      <ScrollArea
        viewportRef={viewport}
        style={{
          flex: 1,
          filter: menuOpen ? "blur(4px)" : "none",
          transition: "filter 0.2s ease",
        }}
        px={16}
        py={12}
      >
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
                      style={{
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: 10,
                      }}
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
                    {msg.type === "payment" ? (
                      <Box
                        style={{
                          background: "#fff",
                          border: "1px solid #EFEFEF",
                          borderRadius: 16,
                          padding: 20,
                          width: "100%",
                          maxWidth: 280,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                          opacity: chat.listingStatus !== "Dostupné" ? 0.8 : 1,
                        }}
                      >
                        <Text size="xs" c="#8E8E93" fw={500} mb={4}>
                          Platba
                        </Text>
                        <Text size="xl" fw={700} c="#000" mb={2}>
                          {msg.content}
                        </Text>
                        <Text size="xs" c="#AEAEB2" mb={20}>
                          {chat.listingStatus === "Dostupné" ? "Zaplatit teď" : "Zaplaceno"}
                        </Text>
                        <Button
                          fullWidth
                          radius="md"
                          onClick={() => chat.listingStatus === "Dostupné" && setPaymentOpened(true)}
                          disabled={chat.listingStatus !== "Dostupné"}
                          style={{
                            background: chat.listingStatus === "Dostupné" ? "#185EDB" : "#4CAF50",
                            color: "#fff",
                            fontWeight: 600,
                          }}
                        >
                          {chat.listingStatus === "Dostupné" ? "Zaplatit" : "Zaplaceno"}
                        </Button>
                      </Box>
                    ) : (
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
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </ScrollArea>

      {/* ── Backdrop to close menu ── */}
      {menuOpen && (
        <Box
          onClick={() => setMenuOpen(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 90,
          }}
        />
      )}

      {/* ── Menu Overlay ── */}
      {menuOpen && (
        <Box
          style={{
            position: "absolute",
            bottom: 70,
            left: 12,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {chat.sellerName === currentUser && (
            <UnstyledButton onClick={handlePayment}>
              <Group gap={12} wrap="nowrap">
                <Box
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    backgroundColor: "#965BCC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  <RiMoneyDollarCircleFill size={26} color="#fff" />
                </Box>
                <Text fw={600} size="xs">
                  Platba
                </Text>
              </Group>
            </UnstyledButton>
          )}

          <UnstyledButton onClick={() => setMenuOpen(false)}>
            <Group gap={12} wrap="nowrap">
              <Box
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  backgroundColor: "#E7E7E7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                <IoClose size={18} color="#AAA" />
              </Box>
              <Text fw={600} size="sm">
                Close
              </Text>
            </Group>
          </UnstyledButton>
        </Box>
      )}

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
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              radius="xl"
              aria-label="Příloha"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <FaCirclePlus size={22} color={menuOpen ? "#1754D8" : "#A0A0A0"} />
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

      <PaymentModal
        opened={paymentOpened}
        onClose={() => setPaymentOpened(false)}
        amount={chat.listingPrice || 0}
        chatId={chat.id}
        listingId={chat.listingId}
        buyerName={chat.buyerName}
        sellerName={chat.sellerName}
        onSuccess={() => {
          onMessagesUpdate();
        }}
      />
    </Box>
  );
}
