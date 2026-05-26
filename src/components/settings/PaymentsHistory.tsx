"use client";

import { Badge, Box, Group, Loader, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { IoWalletOutline } from "react-icons/io5";
import { useSession } from "@/lib/auth-client";

export function PaymentsHistory() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      if (!session?.user?.name) return;
      try {
        const res = await fetch(`/api/payments/user?name=${encodeURIComponent(session.user.name)}`);
        if (res.ok) {
          const data = await res.json();
          setPayments(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [session]);

  if (loading)
    return (
      <Stack align="center" py={50}>
        <Loader size="md" color="blue" />
      </Stack>
    );

  return (
    <Stack gap="xl">
      <Group gap="sm">
        <Box
          style={{
            background: "#F0F4FF",
            padding: 10,
            borderRadius: 10,
            lineHeight: 0,
          }}
        >
          <IoWalletOutline size={24} color="#1754D8" />
        </Box>
        <Text fw={700} size="xl">
          Historie plateb
        </Text>
      </Group>

      {payments.length === 0 ? (
        <Box
          py={60}
          style={{
            textAlign: "center",
            border: "2px dashed #E5E5E5",
            borderRadius: 15,
          }}
        >
          <Text c="dimmed" fw={500}>
            Zatím jste neprovedli žádné platby.
          </Text>
        </Box>
      ) : (
        <Stack gap="md">
          {payments.map((p) => (
            <Box
              key={p.id}
              p="lg"
              style={{
                border: "1px solid #E5E5E5",
                borderRadius: "12px",
                background: "white",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={700} size="md" truncate>
                    {p.listingTitle || "Produkt"}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Prodejce:{" "}
                    <Text component="span" fw={600} c="gray.7">
                      {p.sellerName}
                    </Text>{" "}
                    • {new Date(p.createdAt).toLocaleDateString("cs-CZ")}
                  </Text>
                </Stack>
                <Stack align="flex-end" gap={6} style={{ flexShrink: 0 }}>
                  <Text fw={800} size="lg" c="#1754D8">
                    {p.amount} Kč
                  </Text>
                  <Badge color={p.status === "completed" ? "green" : "orange"} variant="light" radius="sm" h={24}>
                    {p.status === "completed" ? "Dokončeno" : "Probíhá"}
                  </Badge>
                </Stack>
              </Group>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
