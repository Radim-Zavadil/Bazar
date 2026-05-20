import { SimpleGrid, Text } from "@mantine/core";
import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  { title: "Všechno", image: "/filters/all.jpg", href: "/inzeraty" },
  { title: "Oblečení", image: "/filters/clothes.jpg", href: "/inzeraty?kategorie=Oblečení" },
  { title: "Nábytek", image: "/filters/furniture.jpg", href: "/inzeraty?kategorie=Nábytek" },
  { title: "Dětské věci", image: "/filters/children.jpg", href: "/inzeraty?kategorie=Dětské věci" },
  { title: "Elektronika", image: "/filters/electronics.jpg", href: "/inzeraty?kategorie=Elektronika" },
  { title: "Knihy", image: "/filters/books.jpg", href: "/inzeraty?kategorie=Knihy" },
];

export function CategoryGrid() {
  return (
    <SimpleGrid cols={3} spacing={16} w="100%">
      {CATEGORIES.map((category) => (
        <Link
          key={category.title}
          href={category.href}
          className="relative w-full h-48 rounded-[30px] overflow-hidden block"
        >
          <Image src={category.image} alt={category.title} fill style={{ objectFit: "cover" }} />
          <div className="absolute inset-0 bg-black/50" />
          <Text className="absolute bottom-4 left-4" c="white" fw={500} size="lg">
            {category.title}
          </Text>
        </Link>
      ))}
    </SimpleGrid>
  );
}
