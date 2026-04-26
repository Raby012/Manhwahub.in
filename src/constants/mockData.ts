import { Manhwa, Genre } from "../types";

const generateChapters = (manhwaId: string, count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${manhwaId}-ch-${i + 1}`,
    number: i + 1,
    title: `Chapter ${i + 1}`,
    createdAt: new Date(Date.now() - (count - i) * 86400000).toISOString(),
    images: [
      `https://picsum.photos/seed/${manhwaId}${i}1/800/1200`,
      `https://picsum.photos/seed/${manhwaId}${i}2/800/1200`,
      `https://picsum.photos/seed/${manhwaId}${i}3/800/1200`,
      `https://picsum.photos/seed/${manhwaId}${i}4/800/1200`,
    ],
  }));
};

export const MOCK_MANHWA: Manhwa[] = [
  {
    id: "solo-leveling",
    title: "Solo Leveling",
    thumbnail: "https://picsum.photos/seed/sl_thumb/400/600",
    banner: "https://picsum.photos/seed/sl_banner/1200/400",
    description: "In a world where hunters, humans who possess magical abilities, must battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival.",
    genres: ["Action", "Fantasy", "Martial Arts"],
    author: "Chugong",
    artist: "DUBU (REDICE STUDIO)",
    status: "Completed",
    rating: 9.8,
    views: "1.2B",
    chapters: generateChapters("solo-leveling", 15),
  },
  {
    id: "the-beginning-after-the-end",
    title: "The Beginning After The End",
    thumbnail: "https://picsum.photos/seed/tbate_thumb/400/600",
    banner: "https://picsum.photos/seed/tbate_banner/1200/400",
    description: "King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power. Beneath the glamorous exterior of a powerful king lurks the shell of man, devoid of purpose and will.",
    genres: ["Action", "Fantasy", "Isekai", "Drama"],
    author: "TurtleMe",
    artist: "Fuyu",
    status: "Ongoing",
    rating: 9.6,
    views: "850M",
    chapters: generateChapters("tbate", 10),
  },
  {
    id: "omniscient-readers-viewpoint",
    title: "Omniscient Reader's Viewpoint",
    thumbnail: "https://picsum.photos/seed/orv_thumb/400/600",
    banner: "https://picsum.photos/seed/orv_banner/1200/400",
    description: "Only I know the end of this world. One day our MC finds himself stuck in the world of his favorite webnovel. What does he do to survive? It is a world struck by catastrophe and danger all around.",
    genres: ["Action", "Action", "Drama", "Fantasy"],
    author: "singNsong",
    artist: "Sleepy-C",
    status: "Ongoing",
    rating: 9.9,
    views: "920M",
    chapters: generateChapters("orv", 12),
  },
  {
    id: "tower-of-god",
    title: "Tower of God",
    thumbnail: "https://picsum.photos/seed/tog_thumb/400/600",
    banner: "https://picsum.photos/seed/tog_banner/1200/400",
    description: "What do you desire? Fortune? Glory? Power? Revenge? Or something that surpasses all others? Whatever you desire, 'that is here.' Tower of God.",
    genres: ["Action", "Fantasy", "Drama"],
    author: "SIU",
    artist: "SIU",
    status: "Ongoing",
    rating: 9.4,
    views: "2.1B",
    chapters: generateChapters("tog", 20),
  },
  {
    id: "villains-are-destined-to-die",
    title: "Villains Are Destined to Die",
    thumbnail: "https://picsum.photos/seed/vadd_thumb/400/600",
    banner: "https://picsum.photos/seed/vadd_banner/1200/400",
    description: "This game has taken over my life! Now I'm stuck as the villainess Penelope Eckart in a hard-mode reverse harem dating sim. I have to find a way to escape death!",
    genres: ["Romance", "Fantasy", "Drama", "Isekai"],
    author: "Gwon Gyeoeul",
    artist: "Suol",
    status: "Ongoing",
    rating: 9.7,
    views: "450M",
    chapters: generateChapters("vadd", 8),
  }
];

export const GENRES: Genre[] = ["Action", "Fantasy", "Romance", "Isekai", "Martial Arts", "Drama", "Comedy"];
