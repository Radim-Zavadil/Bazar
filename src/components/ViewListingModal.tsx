"use client";

import {
  Box,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { Upload, X } from "lucide-react";
import type { Listing } from "./ListingCard";

const CATEGORIES = ["Elektronika", "Oblečení", "Nábytek", "Dětské věci", "Knihy", "Sport", "Ostatní"];

const CONDITIONS = ["Nové", "Použité"] as const;

type Props = {
  opened: boolean;
  onClose: () => void;
  listing: Listing;
};

export function ViewListingModal({ opened, onClose, listing }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      centered
      size={540}
      radius={15}
      overlayProps={{ blur: 4, backgroundOpacity: 0.45 }}
      styles={{
        content: {
          background: "#fff",
          border: "1px solid #D5D5D5",
          borderRadius: 15,
          padding: 0,
        },
        body: { padding: 0 },
      }}
    >
      {/* Header */}
      <Group justify="space-between" align="center" px={24} py={20} style={{ borderBottom: "1px solid #EFEFEF" }}>
        <Text fw={600} size="lg" c="#202020">
          Detail inzerátu
        </Text>
        <UnstyledButton onClick={onClose} style={{ lineHeight: 0 }}>
          <X size={20} color="#6C6C6C" />
        </UnstyledButton>
      </Group>

      {/* Body with opacity to indicate read-only */}
      <Box style={{ opacity: 0.65, pointerEvents: "none" }}>
        <Stack gap={20} px={24} py={20}>
          {/* Image display */}
          <Stack gap={6}>
            <Text size="sm" fw={500} c="#3A3A3A">
              Fotografie
            </Text>
            {listing.imageUrl ? (
              <Box
                style={{
                  border: "1px solid #D5D5D5",
                  borderRadius: 10,
                  height: 130,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* biome-ignore lint: img tag is appropriate for read-only preview */}
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  style={{
                    width: "100%",
                    height: 130,
                    objectFit: "cover",
                  }}
                />
              </Box>
            ) : (
              <Box
                style={{
                  border: "2px dashed #D0D0D0",
                  borderRadius: 10,
                  background: "#FAFAFA",
                  minHeight: 130,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Stack align="center" gap={8}>
                  <Box
                    style={{
                      background: "#EFEFEF",
                      borderRadius: 8,
                      padding: 10,
                      lineHeight: 0,
                    }}
                  >
                    <Upload size={22} color="#6C6C6C" />
                  </Box>
                  <Text size="sm" fw={500} c="#555">
                    Bez obrázku
                  </Text>
                </Stack>
              </Box>
            )}
          </Stack>

          {/* Title & Price */}
          <Group gap={12} align="flex-start" grow>
            <TextInput
              label="Název"
              value={listing.title}
              readOnly
              radius={8}
              styles={{
                label: { fontWeight: 500, fontSize: 14, color: "#3A3A3A", marginBottom: 4 },
                input: { borderColor: "#D5D5D5", fontSize: 14, background: "#FFF" },
              }}
            />
            <NumberInput
              label="Cena (Kč)"
              value={listing.price ?? 0}
              readOnly
              radius={8}
              description={listing.price === null || listing.price === 0 ? "Zadarmo" : undefined}
              styles={{
                label: { fontWeight: 500, fontSize: 14, color: "#3A3A3A", marginBottom: 4 },
                input: { borderColor: "#D5D5D5", fontSize: 14, background: "#FFF" },
                description: { color: "#1754D8", fontWeight: 500 },
              }}
            />
          </Group>

          {/* Category */}
          <Select
            label="Kategorie"
            value={listing.category}
            readOnly
            data={CATEGORIES}
            radius={8}
            styles={{
              label: { fontWeight: 500, fontSize: 14, color: "#3A3A3A", marginBottom: 4 },
              input: { borderColor: "#D5D5D5", fontSize: 14, background: "#FFF" },
            }}
          />

          {/* Condition */}
          <Stack gap={8}>
            <Text size="sm" fw={500} c="#3A3A3A">
              Stav produktu
            </Text>
            <Group gap={12}>
              {CONDITIONS.map((cond) => {
                const isActive = (listing.itemCondition ?? "Nové") === cond;
                return (
                  <UnstyledButton
                    key={cond}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "default",
                    }}
                  >
                    {/* Custom radio */}
                    <Box
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: isActive ? "#202020" : "transparent",
                        border: `2px solid ${isActive ? "#202020" : "#BBBBBB"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                        flexShrink: 0,
                      }}
                    >
                      {isActive && (
                        <Box
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "white",
                          }}
                        />
                      )}
                    </Box>
                    <Text size="sm" fw={500} c={isActive ? "#202020" : "#6C6C6C"}>
                      {cond}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </Group>
          </Stack>

          {/* Description */}
          <Textarea
            label="Popis"
            value={listing.description}
            readOnly
            minRows={4}
            autosize
            radius={8}
            styles={{
              label: { fontWeight: 500, fontSize: 14, color: "#3A3A3A", marginBottom: 4 },
              input: { borderColor: "#D5D5D5", fontSize: 14, resize: "none", background: "#FFF" },
            }}
          />
        </Stack>
      </Box>
    </Modal>
  );
}
