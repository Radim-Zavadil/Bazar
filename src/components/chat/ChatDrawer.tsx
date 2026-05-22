"use client";

import { Box, Paper } from "@mantine/core";
import { useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  isLoggedIn: boolean;
  /** Open drawer directly on a specific chat */
  initialChatId?: number | null;
  onChatOpened?: () => void;
}

const NAV_HEIGHT = 90; // matches HEADER_HEIGHT in PageLayout

export function ChatDrawer({ isOpen, onClose, currentUser, isLoggedIn, initialChatId, onChatOpened }: ChatDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expanded state when drawer closes
  useEffect(() => {
    if (!isOpen) setIsExpanded(false);
  }, [isOpen]);

  if (!isOpen) return null;

  // When expanded: cover the full viewport below the nav
  // When compact: fixed right panel 380px wide
  const style = isExpanded
    ? {
        position: "fixed" as const,
        top: NAV_HEIGHT,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
      }
    : {
        position: "fixed" as const,
        top: NAV_HEIGHT,
        right: 0,
        bottom: 0,
        width: 380,
        zIndex: 200,
      };

  return (
    <Box style={{ ...style, transition: "width 0.22s ease" }}>
      <Paper
        shadow="lg"
        withBorder
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 0,
          borderRight: "none",
          borderBottom: "none",
          borderLeft: isExpanded ? "none" : undefined,
        }}
      >
        <ChatPanel
          isExpanded={isExpanded}
          onClose={onClose}
          onToggleExpand={() => setIsExpanded((v) => !v)}
          currentUser={currentUser}
          isLoggedIn={isLoggedIn}
          initialChatId={initialChatId}
          onChatOpened={onChatOpened}
        />
      </Paper>
    </Box>
  );
}
