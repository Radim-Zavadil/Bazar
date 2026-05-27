"use client";

import { Avatar, Button, Group, Menu, UnstyledButton } from "@mantine/core";
import { useState } from "react";
import {
  IoLogOutOutline,
  IoSettingsOutline,
  IoStatsChartOutline,
  IoWalletOutline,
} from "react-icons/io5";
import { Link } from "@/i18n/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { AuthModal } from "./AuthModal";

export function AuthNav() {
  const { data: session } = useSession();
  const [modal, setModal] = useState<"login" | "register" | null>(null);

  if (session?.user) {
    const isAdmin = (session.user as any).role === "Admin";
    const initials = session.user.name
      ? session.user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "U";

    return (
      <Menu
        shadow="md"
        width={200}
        position="bottom-end"
        radius="md"
        withinPortal
      >
        <Menu.Target>
          <UnstyledButton style={{ display: "flex", alignItems: "center" }}>
            <Avatar
              src={session.user.image}
              alt={session.user.name}
              radius="xl"
              color="blue"
              size={36}
            >
              {initials}
            </Avatar>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          {isAdmin && (
            <Menu.Item
              component={Link}
              href="/admin/statistiky"
              leftSection={<IoStatsChartOutline size={16} />}
            >
              Statistiky
            </Menu.Item>
          )}
          <Menu.Item
            component={Link}
            href="/nastaveni"
            leftSection={<IoSettingsOutline size={16} />}
          >
            Nastavení
          </Menu.Item>
          <Menu.Item
            component={Link}
            href="/nastaveni?tab=platby"
            leftSection={<IoWalletOutline size={16} />}
          >
            Platby
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            color="red"
            leftSection={<IoLogOutOutline size={16} />}
            onClick={() => signOut()}
          >
            Odhlásit se
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <>
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
          onClick={() => setModal("login")}
        >
          Přihlásit se
        </Button>
        <Button
          radius={9}
          h={36}
          px="md"
          fz="sm"
          fw={500}
          bg="#194AD1"
          onClick={() => setModal("register")}
        >
          Začít prodávat
        </Button>
      </Group>

      <AuthModal
        opened={modal !== null}
        mode={modal ?? "login"}
        onClose={() => setModal(null)}
      />
    </>
  );
}
