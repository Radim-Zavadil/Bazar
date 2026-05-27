import { Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { eq } from "drizzle-orm";
import { ListingCard } from "../../../components/ListingCard";
import { db } from "../../../db";
import { listings } from "../../../db/schemas";
import { user } from "../../../db/schemas/auth";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    kategorie?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
};

export default async function ListingsPage({ searchParams }: Props) {
  const { kategorie, q, minPrice, maxPrice } = await searchParams;

  // Zkontrolujeme, zda jsou v databázi nějaké inzeráty
  let allListings = await db.select().from(listings);

  // Pokud je databáze prázdná, přidáme 5 ukázkových inzerátů
  if (allListings.length === 0) {
    let seedUser = await db.query.user.findFirst({
      where: eq(user.email, "seed@example.com"),
    });

    if (!seedUser) {
      const seedUserId = crypto.randomUUID();
      await db.insert(user).values({
        id: seedUserId,
        name: "Seed User",
        email: "seed@example.com",
        emailVerified: true,
        role: "User",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      seedUser = {
        id: seedUserId,
        name: "Seed User",
        email: "seed@example.com",
        emailVerified: true,
        image: null,
        role: "User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    await db.insert(listings).values([
      {
        title: "Zimní bunda North Face",
        description:
          "Velmi teplá zimní bunda, velikost L. Nošená jednu sezónu, ve výborném stavu.",
        sellerName: "Jan Novák",
        contactEmail: "jan.novak@example.com",
        price: 800,
        category: "Oblečení",
        status: "Dostupné",
        imageUrl: null,
        userId: seedUser.id,
      },
      {
        title: "Dřevěná jídelní židle",
        description:
          "Starší, ale pevná dřevěná židle. Stačí trochu přebrousit a nalakovat.",
        sellerName: "Petra Malá",
        contactEmail: "petra.mala@example.com",
        price: null, // Zdarma
        category: "Nábytek",
        status: "Dostupné",
        imageUrl: null,
        userId: seedUser.id,
      },
      {
        title: "Lego Duplo krabice",
        description:
          "Velká krabice plná kostek Lego Duplo. Chybí původní obal, ale kostek je tam hodně.",
        sellerName: "Tomáš Dvořák",
        contactEmail: "tomas.dvorak@example.com",
        price: 450,
        category: "Dětské věci",
        status: "Rezervováno",
        imageUrl: null,
        userId: seedUser.id,
      },
      {
        title: "Monitor Dell 24 palců",
        description:
          "Plně funkční Full HD monitor Dell. Má HDMI i DisplayPort. Bez poškození.",
        sellerName: "Karel Svoboda",
        contactEmail: "karel.svoboda@example.com",
        price: 1200,
        category: "Elektronika",
        status: "Dostupné",
        imageUrl: null,
        userId: seedUser.id,
      },
      {
        title: "Série knih Harry Potter (1-7)",
        description:
          "Kompletní série knih o Harrym Potterovi v pevných deskách. Přečteno jen jednou.",
        sellerName: "Lucie Černá",
        contactEmail: "lucie.cerna@example.com",
        price: 1500,
        category: "Knihy",
        status: "Prodáno / předáno",
        imageUrl: null,
        userId: seedUser.id,
      },
    ]);

    // Načteme je znovu
    allListings = await db.select().from(listings);
  }

  // Filtrujeme podle kategorie a/nebo hledaného výrazu
  let filtered =
    kategorie && kategorie !== "Všechno"
      ? allListings.filter((l) => l.category === kategorie)
      : allListings;

  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.title.toLowerCase().includes(lower) ||
        (l.description ?? "").toLowerCase().includes(lower),
    );
  }

  if (minPrice) {
    const min = Number(minPrice);
    if (!isNaN(min)) {
      filtered = filtered.filter((l) => (l.price ?? 0) >= min);
    }
  }

  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) {
      filtered = filtered.filter((l) => l.price !== null && l.price <= max);
    }
  }

  return (
    <Container size="lg" py={40}>
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={1} size="h2" c="#202020">
            {kategorie && kategorie !== "Všechno"
              ? kategorie
              : q
                ? `Výsledky pro „${q}"`
                : "Aktuální inzeráty"}
          </Title>
          <Text c="#6C6C6C">
            {kategorie && kategorie !== "Všechno"
              ? `Inzeráty v kategorii „${kategorie}".`
              : q
                ? `Nalezeno ${filtered.length} inzerátů pro „${q}".`
                : "Prohlédněte si nejnovější věci v našem bazaru."}
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 3 }} spacing="lg">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
