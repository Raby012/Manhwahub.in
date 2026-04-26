export type Genre = "Action" | "Fantasy" | "Romance" | "Isekai" | "Martial Arts" | "Drama" | "Comedy";

export interface Chapter {
  id: string;
  number: number;
  title: string;
  createdAt: string;
  images: string[];
}

export interface Manhwa {
  id: string;
  title: string;
  thumbnail: string;
  banner: string;
  description: string;
  genres: Genre[];
  author: string;
  artist: string;
  status: "Ongoing" | "Completed" | "Hiatus";
  rating: number;
  views: string;
  chapters: Chapter[];
}

export interface UserLibraryItem {
  manhwaId: string;
  lastReadChapterId?: string;
  isBookmarked: boolean;
}
