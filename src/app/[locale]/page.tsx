import { Container, Group, Stack, Text } from "@mantine/core";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CategoryGrid } from "../../components/CategoryGrid";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("page.home.title"),
    description: t("page.home.description"),
  };
}

export default async function Page(_: PageProps<"/[locale]">) {
  return (
    <Container size="md" py={40}>
      <Stack align="center" gap={40}>
        <Stack align="center" gap={16}>
          <Image src="/blogic-logo.png" alt="Blogic Logo" width={160} height={50} style={{ objectFit: "contain" }} />
          <Text c="#434343" fw={500} size="lg">
            Kde věci nacházejí nový domov
          </Text>
        </Stack>

        <CategoryGrid />

        <Group justify="center" gap={8}>
          <Text c="#505050" fw={500} size="xl">
            10
          </Text>
          <Text c="#7B7B7B" fw={400} size="xl">
            inzerátů
          </Text>
        </Group>
      </Stack>
    </Container>
  );
}
