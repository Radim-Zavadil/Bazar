"use client";

import { SimpleGrid, Text } from "@mantine/core";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

const CATEGORIES = [
  { title: "Všechno", image: "/filters/all.jpg", href: "/inzeraty" },
  {
    title: "Oblečení",
    image: "/filters/clothes.jpg",
    href: "/inzeraty?kategorie=Oblečení",
  },
  {
    title: "Nábytek",
    image: "/filters/furniture.jpg",
    href: "/inzeraty?kategorie=Nábytek",
  },
  {
    title: "Dětské věci",
    image: "/filters/children.jpg",
    href: "/inzeraty?kategorie=Dětské věci",
  },
  {
    title: "Elektronika",
    image: "/filters/electronics.jpg",
    href: "/inzeraty?kategorie=Elektronika",
  },
  {
    title: "Knihy",
    image: "/filters/books.jpg",
    href: "/inzeraty?kategorie=Knihy",
  },
];

interface CategoryCardProps {
  category: (typeof CATEGORIES)[number];
}

function CategoryCard({ category }: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((_error) => {
          // ignore play interruption or autoplay blocks
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Derive video name from the image path
  // E.g., "/filters/clothes.jpg" -> "clothes" -> "/filters/video/clothes.mp4"
  const imageFilename = category.image.split("/").pop() || "";
  const nameWithoutExt = imageFilename.substring(0, imageFilename.lastIndexOf("."));
  const videoSrc = `/filters/video/${nameWithoutExt}.mp4`;

  return (
    <Link
      href={category.href}
      className="relative w-full h-48 rounded-[30px] overflow-hidden block group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Base Image */}
      <Image
        src={category.image}
        alt={category.title}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        priority
        style={{ objectFit: "cover" }}
        className="transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Video Overlay - loaded from public/filters/video/[name].mp4 */}
      <video
        ref={videoRef}
        src={videoSrc}
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out"
        style={{
          opacity: isHovered ? 1 : 0,
          pointerEvents: "none",
        }}
      />

      {/* Modern Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15 transition-opacity duration-300 group-hover:opacity-90" />

      {/* Text Container with smooth premium translate transition */}
      <Text
        className="absolute bottom-5 left-5 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5"
        c="white"
        fw={600}
        size="lg"
        style={{
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.4)",
        }}
      >
        {category.title}
      </Text>
    </Link>
  );
}

export function CategoryGrid() {
  return (
    <SimpleGrid cols={3} spacing={16} w="100%">
      {CATEGORIES.map((category) => (
        <motion.div
          key={category.title}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.5,
            ease: [0, 0.71, 0.2, 1.01],
          }}
        >
          <CategoryCard category={category} />
        </motion.div>
      ))}
    </SimpleGrid>
  );
}
