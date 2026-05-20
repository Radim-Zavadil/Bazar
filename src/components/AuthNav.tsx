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
        <Button variant="subtle" color="dark" onClick={() => setModal("login")} style={{ fontWeight: 500 }}>
          Přihlásit se
        </Button>
        <Button
          onClick={() => setModal("register")}
          style={{
            background: "#1754D8",
            borderRadius: "20px",
            fontWeight: 500,
          }}
        >
          Začít prodávat
        </Button>
      </Group>

      <AuthModal opened={modal !== null} mode={modal ?? "login"} onClose={() => setModal(null)} />
    </>
  );
}
