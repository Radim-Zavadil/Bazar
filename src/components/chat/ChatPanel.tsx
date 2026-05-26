"use client";

import { ActionIcon, Avatar, Box, Divider, Group, Stack, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoChatbubble, IoClose, IoExpand, IoSearch } from "react-icons/io5";
import { ChatWindow } from "./ChatWindow";

export interface ChatWithLastMessage {
  id: number;
  listingId: number;
  listingTitle: string;
  listingImage: string | null;
  listingPrice: number | null;
  listingStatus?: string;
  buyerName: string;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: {
    id: number;
    chatId: number;
    senderName: string;
    content: string;
    type: string;
    createdAt: string;
  } | null;
}

interface ChatPanelProps {
  isExpanded: boolean;
  onClose: () => void;
  onToggleExpand: () => void;
  currentUser: string;
  isLoggedIn: boolean;
  /** If set, automatically open this chat id when panel mounts */
  initialChatId?: number | null;
  onChatOpened?: () => void;
}

export function ChatPanel({
  isExpanded,
  onClose,
  onToggleExpand,
  currentUser,
  isLoggedIn,
  initialChatId,
  onChatOpened,
}: ChatPanelProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 250);
  const [chatList, setChatList] = useState<ChatWithLastMessage[]>([]);
  const [loading, setLoading] = useState(false);
  // null = show list, number = show chat window (compact mode only)
  const [activeChatId, setActiveChatId] = useState<number | null>(initialChatId ?? null);
  const abortRef = useRef<AbortController | null>(null);
  const initialHandled = useRef(false);

  const fetchChats = useCallback(async (q: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const url = q ? `/api/chats?search=${encodeURIComponent(q)}` : "/api/chats";
      const res = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error("fetch failed");
      const data: ChatWithLastMessage[] = await res.json();
      setChatList(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setChatList([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats(debouncedSearch);
  }, [debouncedSearch, fetchChats]);

  // Handle initial chat id (from listing card click)
  useEffect(() => {
    if (initialChatId && !initialHandled.current) {
      initialHandled.current = true;
      setActiveChatId(initialChatId);
      onChatOpened?.();
    }
  }, [initialChatId, onChatOpened]);

  const activeChat = chatList.find((c) => c.id === activeChatId) ?? null;

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0)
      return d.toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (diffDays === 1) return "Včera";
    if (diffDays < 7) return d.toLocaleDateString("cs-CZ", { weekday: "short" });
    return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
  }

  // ── Chat list column (always visible in expanded, hidden when chat open in compact) ──
  const showList = isExpanded || activeChatId === null;
  // ── Chat window (always visible in expanded when chat selected, full width in compact) ──
  const showWindow = activeChatId !== null;

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── LEFT: Chat list ── */}
      {showList && (
        <Box
          style={{
            width: isExpanded ? 320 : "100%",
            minWidth: isExpanded ? 280 : undefined,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            borderRight: isExpanded ? "1px solid #F0F0F0" : undefined,
            background: "#fff",
          }}
        >
          {/* Header */}
          <Group px={16} py={12} justify="space-between" wrap="nowrap" style={{ flexShrink: 0 }}>
            <Title order={5} fw={700} style={{ fontSize: 17 }}>
              Zprávy
            </Title>
            <Group gap={6}>
              <Tooltip label={isExpanded ? "Zmenšit" : "Celá obrazovka"} withArrow position="bottom">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  radius="xl"
                  size="md"
                  onClick={onToggleExpand}
                  aria-label="Resize chat"
                >
                  <IoExpand size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Zavřít" withArrow position="bottom">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  radius="xl"
                  size="md"
                  onClick={onClose}
                  aria-label="Zavřít panel"
                >
                  <IoClose size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          <Divider color="#F0F0F0" />

          {/* Search */}
          <Box px={12} py={10} style={{ flexShrink: 0 }}>
            <TextInput
              placeholder="Hledat..."
              leftSection={<IoSearch size={14} color="#A0A0A0" />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              radius="xl"
              size="sm"
              styles={{
                input: {
                  background: "#F5F5F5",
                  border: "none",
                  fontSize: 13,
                },
              }}
            />
          </Box>

          <Divider color="#F0F0F0" />

          {/* Chat rows */}
          <Box style={{ flex: 1, overflowY: "auto" }}>
            {!loading && chatList.length === 0 ? (
              <Stack align="center" gap={8} pt={40} c="dimmed">
                <IoChatbubble size={32} />
                <Text size="sm">Žádné zprávy</Text>
              </Stack>
            ) : (
              chatList.map((chat) => {
                const isActive = activeChatId === chat.id;
                const lastText = chat.lastMessage
                  ? chat.lastMessage.senderName === currentUser
                    ? `Vy: ${chat.lastMessage.content}`
                    : chat.lastMessage.content
                  : "Žádné zprávy";

                return (
                  <Box
                    key={chat.id}
                    px={16}
                    py={10}
                    onClick={() => setActiveChatId(chat.id)}
                    style={{
                      cursor: "pointer",
                      background: isActive ? "#F0F4FF" : "transparent",
                      borderLeft: isActive ? "3px solid #1754D8" : "3px solid transparent",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F8F8F8";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <Group gap={10} wrap="nowrap" align="center">
                      <Avatar
                        src={chat.listingImage ?? undefined}
                        radius="xl"
                        size={42}
                        color="blue"
                        style={{ flexShrink: 0 }}
                      >
                        {chat.listingTitle.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Group justify="space-between" wrap="nowrap" gap={4} mb={1}>
                          <Text size="sm" fw={600} truncate style={{ flex: 1, fontSize: 13 }}>
                            {chat.listingTitle}
                          </Text>
                          <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap", fontSize: 11 }}>
                            {formatTime(chat.updatedAt)}
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed" truncate style={{ fontSize: 12 }}>
                          {lastText}
                        </Text>
                      </Box>
                    </Group>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      )}

      {/* ── RIGHT: Chat window ── */}
      {showWindow && (
        <Box
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            minWidth: 0,
          }}
        >
          {activeChat ? (
            <ChatWindow
              chat={activeChat}
              currentUser={currentUser}
              isLoggedIn={isLoggedIn}
              onBack={() => setActiveChatId(null)}
              onMessagesUpdate={() => fetchChats(debouncedSearch)}
            />
          ) : (
            // activeChat not in list yet (still loading) — show nothing or loader
            <Box style={{ flex: 1 }} />
          )}
        </Box>
      )}

      {/* ── Expanded + no chat selected: empty state ── */}
      {isExpanded && !showWindow && (
        <Box
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FAFAFA",
          }}
        >
          <Box
            style={{
              textAlign: "center",
              padding: "40px 48px",
              background: "#F0F0F0",
              borderRadius: 20,
            }}
          >
            <Text size="xl" mb={8}>
              💬
            </Text>
            <Text fw={600} mb={4} size="sm">
              Vyber konverzaci
            </Text>
            <Text size="xs" c="dimmed">
              Klikni na konverzaci vlevo nebo zahaj novou kliknutím na ikonu zprávy u inzerátu.
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
