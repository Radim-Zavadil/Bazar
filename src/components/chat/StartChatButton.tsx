"use client";

import { Button, Notification } from "@mantine/core";
import { useState } from "react";

interface StartChatButtonProps {
  listingId: number;
  listingTitle: string;
  listingImage?: string | null;
  listingPrice?: number | null;
  sellerName: string;
  /** Name of the currently logged-in user */
  currentUser?: string;
  onSuccess?: (chatId: number) => void;
  fullWidth?: boolean;
}

/**
 * Place this button on the listing detail page.
 * It calls POST /api/chats to create (or re-use) a chat
 * and then calls onSuccess so the parent can open the chat drawer.
 */
export function StartChatButton({
  listingId,
  listingTitle,
  listingImage,
  listingPrice,
  sellerName,
  currentUser = "Já",
  onSuccess,
  fullWidth = true,
}: StartChatButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          listingTitle,
          listingImage: listingImage ?? null,
          listingPrice: listingPrice ?? null,
          buyerName: currentUser,
          sellerName,
        }),
      });
      if (!res.ok) throw new Error("Nepodařilo se zahájit chat");
      const chat = await res.json();
      onSuccess?.(chat.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Neznámá chyba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        loading={loading}
        onClick={handleClick}
        fullWidth={fullWidth}
        h={44}
        radius="md"
        bg="#1753D7"
        styles={{
          root: {
            border: "none",
            "&:hover": {
              backgroundColor: "#144bb2",
            },
          },
          label: {
            fontWeight: 600,
            fontSize: 15,
          },
        }}
      >
        Napsat prodejci
      </Button>
      {error && (
        <Notification color="red" title="Chyba" onClose={() => setError(null)} mt="xs">
          {error}
        </Notification>
      )}
    </>
  );
}
