import { Container, Flex, Group, Text } from "@mantine/core";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CategoryGrid } from "../../components/CategoryGrid";
import { MotionWrapper } from "../../components/infrastructure/MotionWrapper";
import { SearchBar } from "../../components/SearchBar";
import { db } from "../../db";
import { listings } from "../../db/schemas";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("page.home.title"),
    description: t("page.home.description"),
  };
}

export default async function Page(_: PageProps<"/[locale]">) {
  const allListings = await db.select().from(listings);
  const listingsCount = allListings.length;

  return (
    <Container size="md" py={{ base: 20, sm: 40 }}>
      <Flex direction="column" align="center" gap={{ base: 24, sm: 40 }}>
        <MotionWrapper>
          <Flex direction="column" align="center" gap={{ base: 12, sm: 16 }}>
            <Image src="/blogic-logo.png" alt="Blogic Logo" width={160} height={50} style={{ objectFit: "contain" }} />
            <Text c="#434343" fw={500} size="lg" ta="center">
              Kde věci nacházejí nový domov
            </Text>
          </Flex>
        </MotionWrapper>

        <SearchBar />

        <CategoryGrid />

        <MotionWrapper>
          <Group justify="center" gap={8}>
            <Text c="#505050" fw={500} size="xl">
              {listingsCount}
            </Text>
            <Text c="#808080" size="lg">
              aktivních inzerátů
            </Text>
          </Group>
        </MotionWrapper>
      </Flex>
    </Container>
  );
}
