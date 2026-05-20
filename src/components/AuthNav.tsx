"use client";

import { Button, Group } from "@mantine/core";
import { useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { AuthModal } from "./AuthModal";

export function AuthNav() {
  const { data: session } = useSession();
  const [modal, setModal] = useState<"login" | "register" | null>(null);

  if (session?.user) {
    return (
      <Button variant="subtle" color="gray" onClick={() => signOut()} style={{ fontWeight: 500 }}>
        Odhlásit se
      </Button>
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
        <Button radius={9} h={36} px="md" fz="sm" fw={500} bg="#194AD1" onClick={() => setModal("register")}>
          Začít prodávat
        </Button>
      </Group>

      <AuthModal opened={modal !== null} mode={modal ?? "login"} onClose={() => setModal(null)} />
    </>
  );
}
