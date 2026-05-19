"use client";

import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Image from "next/image";
import { ViewListingModal } from "./ViewListingModal";

export type Listing = {
  id: number;
  title: string;
  description: string;
  sellerName: string;
  price: number | null;
  category: string;
  status: string;
  imageUrl: string | null;
  itemCondition?: string;
};

type ListingCardProps = {
  listing: Listing;
};

export function ListingCard({ listing }: ListingCardProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const isFree = listing.price === null || listing.price === 0;

  return (
    <>
      <Card
        withBorder
        radius={15}
        padding="md"
        onClick={open}
        style={{
          backgroundColor: "transparent",
          borderColor: "#E5E5E5",
          cursor: "pointer",
        }}
      >
        <Card.Section>
          {listing.imageUrl ? (
            <div className="relative w-full h-48">
              <Image src={listing.imageUrl} alt={listing.title} fill unoptimized style={{ objectFit: "cover" }} />
            </div>
          ) : (
            <div className="w-full h-48 bg-[#333333] flex items-center justify-center">
              <Text c="white" size="sm">
                Bez obrázku
              </Text>
            </div>
          )}
        </Card.Section>

        <Stack gap="xs" mt="md" flex={1}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Text fw={600} size="lg" c="#202020" lineClamp={1}>
              {listing.title}
            </Text>
            <Badge
              variant="light"
              color={listing.status === "Dostupné" ? "green" : listing.status === "Rezervováno" ? "yellow" : "gray"}
              style={{ flexShrink: 0 }}
            >
              {listing.status}
            </Badge>
          </Group>

          <Text fw={500} size="sm" c="#6C6C6C" lineClamp={2}>
            {listing.description}
          </Text>

          <Badge variant="outline" color="gray" size="sm" mt={4}>
            {listing.category}
          </Badge>
        </Stack>

        <Stack gap={4} mt="xl">
          <Text size="xs" c="#8A8A8A" fw={500}>
            Prodává
          </Text>
          <Group justify="space-between" align="flex-end">
            <Text size="sm" c="#AEAEAE" fw={400}>
              {listing.sellerName}
            </Text>
            <Text fw={700} size="lg" c="#1753D7">
              {isFree ? "Zdarma" : `${listing.price} Kč`}
            </Text>
          </Group>
        </Stack>
      </Card>
      <ViewListingModal opened={opened} onClose={close} listing={listing} />
    </>
  );
}
