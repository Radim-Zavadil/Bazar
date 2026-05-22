"use client";

import { ActionIcon, Avatar, Box, Divider, Group, Stack, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoChatbubble, IoClose, IoExpand, IoSearch } from "react-icons/io5";
import { ChatWindow } from "./ChatWindow";

export interface Chat {
  id: number;
  listingId: number;
  listingTitle: string;
  listingImage: string | null;
  buyerName: string;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatPanelProps {
  isExpanded: boolean;
  onClose: () => void;
  onToggleExpand: () => void;
  /** Name of the currently logged-in user (or a default) */
  currentUser?: string;
}

export function ChatPanel({ isExpanded, onClose, onToggleExpand, currentUser = "Já" }: ChatPanelProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 250);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchChats = useCallback(async (q: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const url = q ? `/api/chats?search=${encodeURIComponent(q)}` : "/api/chats";
      const res = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setChats(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setChats([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats(debouncedSearch);
  }, [debouncedSearch, fetchChats]);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  // Format time
  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Včera";
    if (diffDays < 7) {
      return d.toLocaleDateString("cs-CZ", { weekday: "short" });
    }
    return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
  }

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Left column: chat list ── */}
      <Box
        style={{
          width: isExpanded ? 360 : "100%",
          minWidth: isExpanded ? 320 : undefined,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          borderRight: isExpanded ? "1px solid var(--mantine-color-gray-2)" : undefined,
          background: "white",
        }}
      >
        {/* Header */}
        <Group px="md" py="sm" justify="space-between" wrap="nowrap">
          <Title order={5} fw={700}>
            Zprávy
          </Title>
          <Group gap={6}>
            <Tooltip label={isExpanded ? "Zmenšit" : "Zvětšit"} withArrow position="bottom">
              <ActionIcon
                variant="filled"
                color="gray.2"
                c="dark"
                radius="xl"
                size="md"
                onClick={onToggleExpand}
                aria-label="Resize chat"
              >
                <IoExpand size={15} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Zavřít" withArrow position="bottom">
              <ActionIcon
                variant="filled"
                color="gray.2"
                c="dark"
                radius="xl"
                size="md"
                onClick={onClose}
                aria-label="Close chat panel"
              >
                <IoClose size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <Divider />

        {/* Search */}
        <Box px="md" py="sm">
          <TextInput
            placeholder="Hledat..."
            leftSection={<IoSearch size={15} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            radius="md"
            size="sm"
          />
        </Box>

        <Divider />

        {/* Chat list */}
        <Box style={{ flex: 1, overflowY: "auto" }}>
          {!loading && chats.length === 0 ? (
            <Stack align="center" gap="xs" pt="xl" c="dimmed">
              <IoChatbubble size={36} />
              <Text size="sm">Bez výsledku</Text>
            </Stack>
          ) : (
            chats.map((chat) => (
              <Box
                key={chat.id}
                px="md"
                py="sm"
                onClick={() => setActiveChatId(chat.id)}
                style={{
                  cursor: "pointer",
                  background: activeChatId === chat.id ? "var(--mantine-color-gray-1)" : "transparent",
                  borderLeft:
                    activeChatId === chat.id ? "3px solid var(--mantine-color-blue-5)" : "3px solid transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (activeChatId !== chat.id)
                    (e.currentTarget as HTMLElement).style.background = "var(--mantine-color-gray-0)";
                }}
                onMouseLeave={(e) => {
                  if (activeChatId !== chat.id) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  {/* Avatar / image */}
                  <Avatar src={chat.listingImage ?? undefined} radius="md" size={44} color="blue">
                    {chat.listingTitle.charAt(0).toUpperCase()}
                  </Avatar>

                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group justify="space-between" wrap="nowrap" gap={4}>
                      <Text size="sm" fw={600} truncate style={{ flex: 1 }}>
                        {chat.listingTitle}
                      </Text>
                      <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                        {formatTime(chat.updatedAt)}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed" truncate>
                      {chat.sellerName}
                    </Text>
                  </Box>
                </Group>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* ── Right column: active chat window (only in expanded mode) ── */}
      {isExpanded && (
        <Box style={{ flex: 1, display: "flex", flexDirection: "column", background: "white" }}>
          {activeChat ? (
            <ChatWindow
              chat={activeChat}
              currentUser={currentUser}
              onMessagesUpdate={() => fetchChats(debouncedSearch)}
            />
          ) : (
            <Stack align="center" justify="center" style={{ flex: 1 }} gap="sm">
              <Box
                style={{
                  background: "#f1f3f5",
                  borderRadius: 20,
                  padding: "40px 56px",
                  textAlign: "center",
                }}
              >
                <Text size="xl" mb="xs">
                  👀
                </Text>
                <Text fw={600} mb={4}>
                  Vyber zprávu
                </Text>
                <Text size="sm" c="dimmed">
                  Vyber konverzaci ze seznamu vlevo, nebo začni novou.
                </Text>
              </Box>
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}
