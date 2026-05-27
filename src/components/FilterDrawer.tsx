"use client";

import { Box, Button, Group, NumberInput, Paper, Select, Stack, Text, Title } from "@mantine/core";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { usePathname, useRouter } from "@/i18n/navigation";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_HEIGHT = 90;

const CATEGORIES = ["Všechno", "Oblečení", "Nábytek", "Dětské věci", "Elektronika", "Knihy"];

export function FilterDrawer({ isOpen, onClose }: FilterDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  useEffect(() => {
    if (isOpen) {
      setCategory(searchParams.get("kategorie") || "Všechno");
      setMinPrice(searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : "");
      setMaxPrice(searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : "");
    }
  }, [isOpen, searchParams]);

  if (!isOpen) return null;

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (category && category !== "Všechno") {
      params.set("kategorie", category);
    } else {
      params.delete("kategorie");
    }

    if (minPrice !== "" && minPrice !== null) {
      params.set("minPrice", minPrice.toString());
    } else {
      params.delete("minPrice");
    }

    if (maxPrice !== "" && maxPrice !== null) {
      params.set("maxPrice", maxPrice.toString());
    } else {
      params.delete("maxPrice");
    }

    // Reset page if there was pagination (though not implemented yet)
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
    onClose();
  };

  const handleClear = () => {
    setCategory("Všechno");
    setMinPrice("");
    setMaxPrice("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("kategorie");
    params.delete("minPrice");
    params.delete("maxPrice");

    router.push(`${pathname}?${params.toString()}`);
    onClose();
  };

  return (
    <Box
      style={{
        position: "fixed",
        top: NAV_HEIGHT,
        left: 0,
        bottom: 0,
        width: 380,
        zIndex: 200,
      }}
    >
      <Paper
        shadow="lg"
        withBorder
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 0,
          borderLeft: "none",
          borderBottom: "none",
          borderTop: "none",
        }}
      >
        <Stack p="xl" gap="xl" style={{ flex: 1, overflowY: "auto" }}>
          <Group justify="space-between">
            <Title order={3} fw={600}>
              Filtry
            </Title>
            <Button variant="subtle" color="gray" onClick={onClose} p={0} h="auto">
              <IoClose size={24} />
            </Button>
          </Group>

          <Stack gap="sm">
            <Text fw={500} size="sm" c="#4A4A4A">
              KATEGORIE
            </Text>
            <Select
              placeholder="Všechny kategorie"
              data={CATEGORIES}
              value={category}
              onChange={setCategory}
              radius="md"
              size="md"
            />
          </Stack>

          <Stack gap="sm">
            <Text fw={500} size="sm" c="#4A4A4A">
              CENA (Kč)
            </Text>
            <Group grow gap="md">
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Od
                </Text>
                <NumberInput
                  placeholder="0"
                  value={minPrice}
                  onChange={(val) => setMinPrice(val as number | "")}
                  min={0}
                  radius="md"
                  size="md"
                  hideControls
                />
              </Stack>
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Do
                </Text>
                <NumberInput
                  placeholder="Není omezeno"
                  value={maxPrice}
                  onChange={(val) => setMaxPrice(val as number | "")}
                  min={0}
                  radius="md"
                  size="md"
                  hideControls
                />
              </Stack>
            </Group>
          </Stack>
        </Stack>

        <Stack p="xl" gap="sm" style={{ borderTop: "1px solid #F1F1F1" }}>
          <Button fullWidth radius={9} h={48} bg="#194AD1" fw={500} onClick={handleApply}>
            Použít filtry
          </Button>
          <Button fullWidth variant="subtle" color="gray" h={40} onClick={handleClear} c="#8A8A8A">
            Vymazat vše
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
