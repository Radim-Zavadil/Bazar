"use client";

import { Box, Paper } from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: string;
}

/**
 * ChatDrawer renders the chat side panel as a fixed overlay
 * that appears on the RIGHT side, below the top navigation bar.
 *
 * NAV_HEIGHT must match the actual height of your <PageLayout> navbar.
 * Adjust it here if your navbar is taller or shorter.
 */
const NAV_HEIGHT = 90; // px — matches HEADER_HEIGHT in PageLayout.tsx

export function ChatDrawer({ isOpen, onClose, currentUser }: ChatDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expanded state when drawer closes
  useEffect(() => {
    if (!isOpen) setIsExpanded(false);
  }, [isOpen]);

  const ref = useClickOutside(() => {
    if (isOpen) onClose();
  });

  if (!isOpen) return null;

  const panelWidth = isExpanded ? "min(860px, 95vw)" : 380;

  return (
    <Box
      ref={ref}
      style={{
        position: "fixed",
        top: NAV_HEIGHT,
        right: 0,
        bottom: 0,
        width: panelWidth,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        // Smooth width transition when toggling expand
        transition: "width 0.25s ease",
      }}
    >
      <Paper
        shadow="lg"
        withBorder
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "0",
          borderRight: "none",
          borderBottom: "none",
        }}
      >
        <ChatPanel
          isExpanded={isExpanded}
          onClose={onClose}
          onToggleExpand={() => setIsExpanded((v) => !v)}
          currentUser={currentUser}
        />
      </Paper>
    </Box>
  );
}
