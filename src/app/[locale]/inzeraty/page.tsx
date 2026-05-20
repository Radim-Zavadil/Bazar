import { Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { eq } from "drizzle-orm";
import { ListingCard } from "../../../components/ListingCard";
import { db } from "../../../db";
import { listings } from "../../../db/schemas";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ kategorie?: string }>;
};

export default async function ListingsPage({ searchParams }: Props) {
  const { kategorie } = await searchParams;

  // Zkontrolujeme, zda jsou v databázi nějaké inzeráty
  let allListings = await db.select().from(listings);

  // Pokud je databáze prázdná, přidáme 5 ukázkových inzerátů
  if (allListings.length === 0) {
    await db.insert(listings).values([
      {
        title: "Zimní bunda North Face",
        description: "Velmi teplá zimní bunda, velikost L. Nošená jednu sezónu, ve výborném stavu.",
        sellerName: "Jan Novák",
        price: 800,
        category: "Oblečení",
        status: "Dostupné",
        imageUrl: null,
      },
      {
        title: "Dřevěná jídelní židle",
        description: "Starší, ale pevná dřevěná židle. Stačí trochu přebrousit a nalakovat.",
        sellerName: "Petra Malá",
        price: null, // Zdarma
        category: "Nábytek",
        status: "Dostupné",
        imageUrl: null,
      },
      {
        title: "Lego Duplo krabice",
        description: "Velká krabice plná kostek Lego Duplo. Chybí původní obal, ale kostek je tam hodně.",
        sellerName: "Tomáš Dvořák",
        price: 450,
        category: "Dětské věci",
        status: "Rezervováno",
        imageUrl: null,
      },
      {
        title: "Monitor Dell 24 palců",
        description: "Plně funkční Full HD monitor Dell. Má HDMI i DisplayPort. Bez poškození.",
        sellerName: "Karel Svoboda",
        price: 1200,
        category: "Elektronika",
        status: "Dostupné",
        imageUrl: null,
      },
      {
        title: "Série knih Harry Potter (1-7)",
        description: "Kompletní série knih o Harrym Potterovi v pevných deskách. Přečteno jen jednou.",
        sellerName: "Lucie Černá",
        price: 1500,
        category: "Knihy",
        status: "Prodáno / předáno",
        imageUrl: null,
      },
    ]);

    // Načteme je znovu
    allListings = await db.select().from(listings);
  }

  // Filtrujeme podle kategorie, pokud je zadána
  const filtered = kategorie ? await db.select().from(listings).where(eq(listings.category, kategorie)) : allListings;

  return (
    <Container size="lg" py={40}>
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={1} size="h2" c="#202020">
            {kategorie ? kategorie : "Aktuální inzeráty"}
          </Title>
          <Text c="#6C6C6C">
            {kategorie ? `Inzeráty v kategorii „${kategorie}".` : "Prohlédněte si nejnovější věci v našem bazaru."}
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
