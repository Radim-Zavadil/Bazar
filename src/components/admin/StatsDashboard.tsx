"use client";

import { Container, Grid, Paper, Stack, Text, Title, Group, SimpleGrid, Box } from "@mantine/core";
import { BarChart, DonutChart, LineChart } from "@mantine/charts";
import { IoPeopleOutline, IoStorefrontOutline, IoCartOutline } from "react-icons/io5";

type Props = {
  stats: any;
};

export function StatsDashboard({ stats }: Props) {
  // Prepare data for charts
  const signupData = stats.userSignups.map((s: any) => ({
    date: s.date,
    Uživatelé: s.count,
  }));

  const listingsData = stats.listingsOverTime.map((l: any) => ({
    date: l.date,
    Inzeráty: l.count,
  }));

  const categoryData = stats.categoryBreakdown.map((c: any) => ({
    category: c.category,
    Počet: c.count,
  }));

  const paymentData = stats.paymentMethods.map((p: any, index: number) => ({
    name: p.method === "qr" ? "QR Platba" : "Bankovní převod",
    value: p.count,
    color: index === 0 ? "indigo.6" : "cyan.6",
  }));

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Title order={2} fw={700} c="#202020">
          Statistiky obchodu
        </Title>

        {/* Top Row: User Signups and Main Stats */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper p="xl" radius="md" withBorder style={{ height: "100%" }}>
              <Stack gap="md">
                <Text fw={600} size="lg">
                  Nové registrace uživatelů
                </Text>
                <Box h={300}>
                  <LineChart
                    h={300}
                    data={signupData}
                    dataKey="date"
                    series={[{ name: "Uživatelé", color: "blue.6" }]}
                    curveType="monotone"
                    tickLine="none"
                    gridAxis="xy"
                  />
                </Box>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md" style={{ height: "100%" }}>
              <Paper p="xl" radius="md" withBorder>
                <Group justify="space-between">
                  <Stack gap={0}>
                    <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                      Celkem uživatelů
                    </Text>
                    <Text fw={700} size="xl">
                      {stats.sellerStats.total}
                    </Text>
                  </Stack>
                  <IoPeopleOutline size={24} color="#194AD1" />
                </Group>
              </Paper>

              <Paper p="xl" radius="md" withBorder flex={1}>
                <Stack gap="md">
                  <Text fw={600} size="sm">
                    Struktura uživatelů
                  </Text>
                  <Group grow>
                    <Stack gap={4}>
                      <Group gap={8}>
                        <IoStorefrontOutline size={16} color="blue" />
                        <Text size="xs" fw={500}>Prodejci</Text>
                      </Group>
                      <Text fw={700} size="lg">{stats.sellerStats.sellers}</Text>
                    </Stack>
                    <Stack gap={4}>
                      <Group gap={8}>
                        <IoCartOutline size={16} color="green" />
                        <Text size="xs" fw={500}>Kupující</Text>
                      </Group>
                      <Text fw={700} size="lg">{stats.sellerStats.buyers}</Text>
                    </Stack>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Kupující jsou uživatelé, kteří zatím nevytvořili žádný inzerát.
                  </Text>
                </Stack>
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Bottom Row: Listings and Payments */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Text fw={600} size="md">
                Aktivní inzeráty
              </Text>
              <LineChart
                h={200}
                data={listingsData}
                dataKey="date"
                series={[{ name: "Inzeráty", color: "indigo.6" }]}
                curveType="monotone"
                tickLine="none"
              />
            </Stack>
          </Paper>

          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Text fw={600} size="md">
                Kategorie inzerátů
              </Text>
              <BarChart
                h={200}
                data={categoryData}
                dataKey="category"
                series={[{ name: "Počet", color: "teal.6" }]}
                tickLine="none"
              />
            </Stack>
          </Paper>

          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md" align="center">
              <Text fw={600} size="md" style={{ alignSelf: "flex-start" }}>
                Platební metody
              </Text>
              <DonutChart
                data={paymentData}
                withLabels
                withLabelsLine
                size={160}
                thickness={20}
              />
              <Stack gap={4} w="100%" mt="sm">
                {paymentData.map((item: any) => (
                  <Group key={item.name} justify="space-between">
                    <Group gap={8}>
                      <Box w={10} h={10} style={{ borderRadius: "50%", background: `var(--mantine-color-${item.color.split('.')[0]}-${item.color.split('.')[1]})` }} />
                      <Text size="xs">{item.name}</Text>
                    </Group>
                    <Text size="xs" fw={700}>{item.value}</Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
