"use client";

import { Box, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { useRouter } from "next/navigation";
import { IoPersonOutline, IoWalletOutline } from "react-icons/io5";
import { signOut } from "@/lib/auth-client";

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  const menuItems = [
    {
      id: "profil",
      label: "Upravit profil",
      icon: <IoPersonOutline size={20} />,
    },
    { id: "platby", label: "Platby", icon: <IoWalletOutline size={20} /> },
  ];

  const router = useRouter();

  return (
    <Stack gap={0} h="100%" justify="space-between" py="xl" px="md">
      <Stack gap="xl">
        <Text fw={700} size="lg" c="#000" px="sm" mb="md" style={{ whiteSpace: "nowrap" }}>
          Nastavení
        </Text>
        <Stack gap={4}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <UnstyledButton
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background: isActive ? "#F0F0F0" : "transparent",
                  transition: "all 0.2s ease",
                }}
              >
                <Group gap="md">
                  <Box
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: isActive ? "#000" : "#6C6C6C",
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Text fw={isActive ? 600 : 500} size="sm" c={isActive ? "#000" : "#6C6C6C"}>
                    {item.label}
                  </Text>
                </Group>
              </UnstyledButton>
            );
          })}
        </Stack>
      </Stack>

      <Box px="sm" pb="md">
        <UnstyledButton
          onClick={() =>
            signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/");
                },
              },
            })
          }
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #E5E5E5",
            textAlign: "center",
            background: "white",
          }}
        >
          <Text fw={600} size="sm" c="#000">
            Log out
          </Text>
        </UnstyledButton>
      </Box>
    </Stack>
  );
}
