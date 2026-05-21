"use client";

import { Badge, Box, Card, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Image from "next/image";
import { TbArrowUpRight } from "react-icons/tb";
import { ViewListingModal } from "./ViewListingModal";

export type Listing = {
  id: number;
  title: string;
  description: string;
  sellerName: string;
  contactEmail: string | null;
  price: number | null;
  category: string;
  status: string;
  imageUrl: string | null;
  itemCondition?: string;
  userId: string;
};

type ListingCardProps = {
  listing: Listing;
};

const statusColor: Record<string, string> = {
  Dostupné: "#1A6B3C",
  Rezervováno: "#92620A",
  Prodáno: "#555555",
};

const statusBg: Record<string, string> = {
  Dostupné: "#DCFCE790",
  Rezervováno: "#CFBE9E90",
  Prodáno: "#EBEBEB90",
};

export function ListingCard({ listing }: ListingCardProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const isFree = listing.price === null || listing.price === 0;

  return (
    <>
      <Card
        withBorder
        radius="lg"
        p={0}
        onClick={open}
        style={{
          borderColor: "#E5E5E5",
          cursor: "pointer",
          background: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Image area — square */}
        <Box
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "8 / 7",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Status badge — top left */}
          <Box style={{ position: "absolute", top: 14, left: 14, zIndex: 2 }}>
            <Badge
              size="sm"
              radius="xl"
              style={{
                background: statusBg[listing.status] ?? "#EBEBEB",
                color: statusColor[listing.status] ?? "#555555",
                fontWeight: 500,
                fontSize: 11,
                letterSpacing: 0.3,
                border: "none",
                padding: "4px 10px",
              }}
            >
              {listing.status}
            </Badge>
          </Box>

          {/* Arrow circle — top right, decorative */}
          <Box
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              zIndex: 2,
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#F5F5F5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TbArrowUpRight size={18} color="#222" strokeWidth={1.8} />
          </Box>

          {listing.imageUrl ? (
            <div style={{ position: "relative", width: "78%", height: "78%" }}>
              <Image src={listing.imageUrl} alt={listing.title} fill unoptimized style={{ objectFit: "contain" }} />
            </div>
          ) : (
            <Text size="xs" c="#aaa" style={{ fontWeight: 400 }}>
              Bez obrázku
            </Text>
          )}
        </Box>

        {/* Text content */}
        <Stack gap={2} p="md" pt={12} pb={16}>
          <Text size="xs" style={{ color: "#828282", fontWeight: 400, letterSpacing: 0.2 }}>
            {listing.category}
          </Text>

          <Group justify="space-between" align="flex-start" gap={8} wrap="nowrap">
            <Text size="sm" style={{ color: "#111", fontWeight: 500, lineHeight: 1.35, flex: 1 }} lineClamp={2}>
              {listing.title}
            </Text>
            <Text size="sm" style={{ color: "#111", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
              {isFree ? "Zdarma" : `${listing.price} Kč`}
            </Text>
          </Group>

          <Text size="xs" style={{ color: "#ABABAB", fontWeight: 400, marginTop: 2 }}>
            Prodává · {listing.sellerName}
          </Text>
        </Stack>
      </Card>

      <ViewListingModal opened={opened} onClose={close} listing={listing} />
    </>
  );
}
