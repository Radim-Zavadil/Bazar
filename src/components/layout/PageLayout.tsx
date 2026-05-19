"use client";

import { Anchor, AppShell, Box, Button, Container, Group, Stack } from "@mantine/core";
import type { PropsWithChildren } from "react";
import { FaFacebook, FaInstagram } from "react-icons/fa";

import { PageLogo } from "@/components/layout/PageLogo";

const HEADER_HEIGHT = 90;
const BODY_MAX_WIDTH = 1280;

export function PageLayout({ children }: PropsWithChildren) {
  return (
    <AppShell header={{ height: HEADER_HEIGHT }} padding="md" withBorder={false}>
      <AppShell.Header px="md" bg="white" style={{ borderBottom: "1px solid #E5E5E5" }}>
        <Container size={BODY_MAX_WIDTH} h="100%">
          <Group h="100%" align="center" justify="space-between">
            <PageLogo />
            <Group gap="sm">
              <Button
                variant="outline"
                color="gray"
                radius={9}
                h={36}
                px="md"
                fz="sm"
                fw={500}
                c="black"
                styles={{ root: { borderColor: "#E9E9E9" } }}
              >
                Přihlásit se
              </Button>

              <Button radius={9} h={36} px="md" fz="sm" fw={500} bg="#194AD1">
                Začít prodávat
              </Button>
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
  );
}
