export interface Manga {
  id: string;
  type: string;
  attributes: {
    title: { [key: string]: string };
    altTitles: { [key: string]: string }[];
    description: { [key: string]: string };
    status: string;
    contentRating: string;
    originalLanguage: string;
    tags: Tag[];
    year: number | null;
    lastChapter: string | null;
  };
  relationships: Relationship[];
}

export interface Tag {
  id: string;
  attributes: {
    name: { [key: string]: string };
    group: string;
  };
}

export interface Relationship {
  id: string;
  type: string;
  attributes?: any;
}

export interface Chapter {
  id: string;
  attributes: {
    volume: string | null;
    chapter: string;
    title: string | null;
    translatedLanguage: string;
    pages: number;
    publishAt: string;
    readableAt: string;
    updatedAt: string;
  };
  relationships: Relationship[];
}

export interface ChapterPages {
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

export interface MangaResponse {
  data: Manga[];
  limit: number;
  offset: number;
  total: number;
}

export interface ChapterResponse {
  data: Chapter[];
  limit: number;
  offset: number;
  total: number;
}

export interface UnifiedChapter {
  id: string;
  mangaId: string;
  number: number;
  title: string;
  date: string;
  source: string;
}
