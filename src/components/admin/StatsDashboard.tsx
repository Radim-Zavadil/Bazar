"use client";

import { BarChart, LineChart } from "@mantine/charts";
import {
  Box,
  Container,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

type Props = {
  stats: any;
};

const CAT_COLORS = ["#4BC34D", "#24ACD0", "#7035DE", "#C4372B", "#CC9E3D"];
const PAYMENT_COLORS = ["#4BC34D", "#24ACD0"];

export function StatsDashboard({ stats }: Props) {
  const signupData = stats.userSignups.map((s: any) => ({
    date: s.date,
    Uživatelé: s.count,
  }));

  const listingsData = stats.listingsOverTime.map((l: any) => ({
    date: l.date,
    Inzeráty: l.count,
  }));

  const paymentData = stats.paymentMethods.map((p: any, index: number) => ({
    name: p.method === "qr" ? "QR Platba" : "Bankovní převod",
    value: p.count,
    color: PAYMENT_COLORS[index] ?? "#6E8596",
  }));

  const totalPayments = paymentData.reduce(
    (s: number, p: any) => s + p.value,
    0,
  );

  const noBorderPaper: React.CSSProperties = {
    background: "transparent",
    border: "none",
    boxShadow: "none",
    padding: 0,
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Title
          order={2}
          fw={700}
          fz={15}
          tt="uppercase"
          c="dimmed"
          style={{ letterSpacing: "0.15em" }}
        >
          Statistiky obchodu
        </Title>

        {/* ── ROW 1: Signups chart + user stats ── */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper p="xl" radius="md" style={noBorderPaper}>
              <Stack gap="md">
                <Text
                  fw={600}
                  size="sm"
                  tt="uppercase"
                  c="black"
                  style={{ letterSpacing: "0.12em" }}
                >
                  Nové registrace uživatelů
                </Text>
                <LineChart
                  h={260}
                  data={signupData}
                  dataKey="date"
                  series={[{ name: "Uživatelé", color: "#6E8596" }]}
                  curveType="monotone"
                  tickLine="none"
                  gridAxis="y"
                  withDots={false}
                />
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack
              gap="xl"
              style={{ height: "100%", justifyContent: "center" }}
            >
              {/* Celkem uživatelů — no border */}
              <Stack gap={2}>
                <Text fw={500} size="2.6rem" lh={1} c="dark.8">
                  {Number(stats.sellerStats.total).toLocaleString("cs-CZ")}
                </Text>
                <Text
                  c="dimmed"
                  size="xs"
                  tt="uppercase"
                  fw={700}
                  style={{ letterSpacing: "0.12em" }}
                >
                  Celkem uživatelů
                </Text>
              </Stack>

              {/* Prodejci & Kupující — no border */}
              <Group grow align="flex-start">
                <Stack gap={2}>
                  <Text fw={500} size="2rem" lh={1} c="dark.8">
                    {Number(stats.sellerStats.sellers).toLocaleString("cs-CZ")}
                  </Text>
                  <Text
                    size="xs"
                    c="dimmed"
                    tt="uppercase"
                    fw={700}
                    style={{ letterSpacing: "0.12em" }}
                  >
                    Prodejci
                  </Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="2rem" lh={1} c="dark.8">
                    {Number(stats.sellerStats.buyers).toLocaleString("cs-CZ")}
                  </Text>
                  <Text
                    size="xs"
                    c="dimmed"
                    tt="uppercase"
                    fw={700}
                    style={{ letterSpacing: "0.12em" }}
                  >
                    Kupující
                  </Text>
                </Stack>
              </Group>

              <Text size="xs" c="dimmed">
                Kupující jsou uživatelé, kteří zatím nevytvořili žádný inzerát.
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* ── ROW 2: Aktivní inzeráty + Kategorie + Platební metody ── */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {/* Aktivní inzeráty — WITH border */}
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Text
                fw={600}
                size="xs"
                tt="uppercase"
                c="black"
                style={{ letterSpacing: "0.12em" }}
              >
                Aktivní inzeráty
              </Text>
              <LineChart
                h={200}
                data={listingsData}
                dataKey="date"
                series={[{ name: "Inzeráty", color: "#6E8596" }]}
                curveType="monotone"
                tickLine="none"
                gridAxis="y"
                withDots={false}
              />
            </Stack>
          </Paper>

          {/* Kategorie inzerátů — WITH border, BarChart with per-category colours */}
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Text
                fw={600}
                size="xs"
                tt="uppercase"
                c="black"
                style={{ letterSpacing: "0.12em" }}
              >
                Kategorie inzerátů
              </Text>
              <BarChart
                h={200}
                data={stats.categoryBreakdown.map((c: any, i: number) => ({
                  category: c.category,
                  Počet: c.count,
                  color: CAT_COLORS[i % CAT_COLORS.length],
                }))}
                dataKey="category"
                series={[{ name: "Počet", color: "color" }]}
                tickLine="none"
                gridAxis="y"
                barProps={{ maxBarSize: 24, radius: 3 }}
              />
            </Stack>
          </Paper>

          {/* Platební metody — WITH border */}
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Text
                fw={600}
                size="xs"
                tt="uppercase"
                c="black"
                style={{ letterSpacing: "0.12em" }}
              >
                Platební metody
              </Text>

              {/* colour strip */}
              <Group
                gap={0}
                style={{ borderRadius: 3, overflow: "hidden", height: 14 }}
              >
                {paymentData.map((p: any) => (
                  <Box
                    key={p.name}
                    style={{
                      width: `${(p.value / totalPayments) * 100}%`,
                      height: 14,
                      background: p.color,
                    }}
                  />
                ))}
              </Group>

              <Stack gap={10} mt={4}>
                {paymentData.map((p: any) => (
                  <Group key={p.name} justify="space-between">
                    <Group gap={7}>
                      <Box
                        w={8}
                        h={8}
                        style={{
                          borderRadius: "50%",
                          background: p.color,
                          flexShrink: 0,
                        }}
                      />
                      <Text size="xs" c="dimmed">
                        {p.name}
                      </Text>
                    </Group>
                    <Text size="xs" fw={700}>
                      {p.value.toLocaleString("cs-CZ")}
                    </Text>
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
