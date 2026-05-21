"use client";

import { ActionIcon, Anchor, AppShell, Box, Container, Group, Stack, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Plus } from "lucide-react";
import type { PropsWithChildren } from "react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { AuthNav } from "@/components/AuthNav";
import { CreateListingModal } from "@/components/CreateListingModal";
import { PageLogo } from "@/components/layout/PageLogo";
import { useSession } from "@/lib/auth-client";

const HEADER_HEIGHT = 90;
const BODY_MAX_WIDTH = 1280;

export function PageLayout({ children }: PropsWithChildren) {
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const { data: session } = useSession();

  const isLoggedIn = !!session?.user;

  return (
    <>
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
                    <Plus size={20} color={isLoggedIn ? "#333" : "#999"} />
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
    </>
  );
}
