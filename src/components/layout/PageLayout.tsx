"use client";

import { AppShell, Button, Container, Group } from "@mantine/core";
import type { PropsWithChildren } from "react";
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
        <Container size={BODY_MAX_WIDTH} px="md">
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
