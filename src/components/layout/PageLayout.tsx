"use client";

import { ActionIcon, Anchor, AppShell, Box, Container, Group, Stack, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { IoChatbubbleEllipses, IoChatbubbleEllipsesOutline, IoFilter, IoFilterOutline } from "react-icons/io5";
import { MdAdd } from "react-icons/md";
import { AuthNav } from "@/components/AuthNav";
import { CreateListingModal } from "@/components/CreateListingModal";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { FilterDrawer } from "@/components/FilterDrawer";
import { PageLogo } from "@/components/layout/PageLogo";
import { useSession } from "@/lib/auth-client";

const HEADER_HEIGHT = 90;
const BODY_MAX_WIDTH = 1280;

// ── Context so ListingCard (deep in the tree) can open the chat drawer ──
interface OpenChatContextValue {
  openChat: (chatId: number) => void;
}

export const OpenChatContext = createContext<OpenChatContextValue>({
  openChat: () => {},
});

export function useOpenChat() {
  return useContext(OpenChatContext);
}

export function PageLayout({ children }: PropsWithChildren) {
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [chatOpen, setChatOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingChatId, setPendingChatId] = useState<number | null>(null);

  const isLoggedIn = mounted ? !!session?.user : false;
  const currentUser = mounted ? (session?.user?.name ?? "") : "";

  // Called by ListingCard after chat is created
  const openChat = useCallback((chatId: number) => {
    setPendingChatId(chatId);
    setChatOpen(true);
  }, []);

  function handleCloseDrawer() {
    setChatOpen(false);
    setPendingChatId(null);
  }

  return (
    <OpenChatContext.Provider value={{ openChat }}>
      <CreateListingModal opened={modalOpened} onClose={closeModal} />
      <AppShell header={{ height: HEADER_HEIGHT }} padding="md" withBorder={false}>
        <AppShell.Header px="md" bg="white" style={{ borderBottom: "1px solid #E5E5E5" }}>
          <Container size={BODY_MAX_WIDTH} h="100%">
            <Group h="100%" align="center" justify="space-between">
              <PageLogo />
              <Group gap="sm">
                <AuthNav />
                <Tooltip label="Přihlaste se nebo si vytvořte účet" disabled={isLoggedIn} withArrow position="bottom">
                  <ActionIcon
                    id="btn-create-listing"
                    onClick={isLoggedIn ? openModal : undefined}
                    variant="subtle"
                    color="gray"
                    radius={9}
                    h={36}
                    w={36}
                    aria-label="Vytvořit inzerát"
                    style={{
                      opacity: isLoggedIn ? 1 : 0.4,
                      cursor: isLoggedIn ? "pointer" : "default",
                    }}
                  >
                    <MdAdd size={20} color={isLoggedIn ? "#333" : "#999"} />
                  </ActionIcon>
                </Tooltip>

                <Tooltip label={filterOpen ? "Zavřít filtry" : "Filtry"} withArrow position="bottom">
                  <ActionIcon
                    variant={filterOpen ? "light" : "subtle"}
                    color="gray"
                    size="lg"
                    radius="md"
                    aria-label="Filtry"
                    onClick={() => {
                      setFilterOpen((v) => !v);
                      if (chatOpen) setChatOpen(false);
                    }}
                  >
                    {filterOpen ? <IoFilter size={22} /> : <IoFilterOutline size={22} />}
                  </ActionIcon>
                </Tooltip>

                <Tooltip label={chatOpen ? "Zavřít zprávy" : "Zprávy"} withArrow position="bottom">
                  <ActionIcon
                    variant={chatOpen ? "light" : "subtle"}
                    color="gray"
                    size="lg"
                    radius="md"
                    aria-label="Zprávy"
                    onClick={() => {
                      setChatOpen((v) => !v);
                      if (filterOpen) setFilterOpen(false);
                    }}
                  >
                    {chatOpen ? <IoChatbubbleEllipses size={22} /> : <IoChatbubbleEllipsesOutline size={22} />}
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Container>
        </AppShell.Header>

        <AppShell.Main>
          <Container size={BODY_MAX_WIDTH} px="md" style={{ minHeight: "calc(100vh - 250px)" }}>
            {children}
          </Container>

          <Box component="footer" bg="white" style={{ borderTop: "1px solid #E5E5E5" }} py="xl" mt="xl">
            <Container size={BODY_MAX_WIDTH}>
              <Stack align="center" gap="md">
                <Group gap="lg">
                  <Anchor href="#" c="#8A8A8A" fw={500} underline="never">
                    Privacy
                  </Anchor>
                  <Anchor href="#" c="#8A8A8A" fw={500} underline="never">
                    Terms
                  </Anchor>
                </Group>
                <Group gap="md">
                  <Anchor href="https://www.facebook.com/blogic" target="_blank" c="#575757">
                    <FaFacebook size={24} />
                  </Anchor>
                  <Anchor href="https://www.instagram.com/blogic.cz/" target="_blank" c="#575757">
                    <FaInstagram size={24} />
                  </Anchor>
                </Group>
              </Stack>
            </Container>
          </Box>
        </AppShell.Main>
      </AppShell>

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} />

      {/* ChatDrawer outside AppShell so it overlays the full page */}
      <ChatDrawer
        isOpen={chatOpen}
        onClose={handleCloseDrawer}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        initialChatId={pendingChatId}
        onChatOpened={() => setPendingChatId(null)}
      />
    </OpenChatContext.Provider>
  );
}
