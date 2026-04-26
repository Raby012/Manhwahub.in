export interface UnifiedManga {
  id: string;
  sourceId: string;
  source: string;
  title: string;
  altTitles: string[];
  description: string;
  cover: string;
  status: string;
  author: string;
  artist?: string;
  year?: number;
  genres: string[];
  type: string;
}

export interface UnifiedChapter {
  id: string;
  mangaId: string;
  number: number;
  title: string;
  date: string;
  source: string;
}
