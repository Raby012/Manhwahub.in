import axios from 'axios';
import { MangaResponse, ChapterResponse, ChapterPages, Manga } from '../types/mangadex';

const BASE_URL = '/api/mangadex';
const COVER_BASE_URL = '/api/covers/covers';

export const mangadexApi = {
  async searchManga(params: {
    title?: string;
    limit?: number;
    offset?: number;
    originalLanguage?: string[];
    order?: { [key: string]: string };
    includedTags?: string[];
    excludedTags?: string[];
    status?: string[];
  }) {
    if (params.title) {
       // Use our unified search for better content coverage
       const response = await axios.get(`/api/unified/search`, {
         params: { q: params.title }
       });
       // Map unified results to the expected MangaDex component format for compatibility
       return { 
         data: response.data.map((m: any) => ({
           id: m.id,
           type: 'manga',
           attributes: {
             title: { en: m.title },
             description: { en: m.description },
             status: m.status,
             originalLanguage: 'ko',
             year: 2024,
             lastChapter: '??'
           },
           relationships: [
             { type: 'author', attributes: { name: m.author } },
             { type: 'cover_art', attributes: { fileName: m.cover } }
           ]
         })),
         limit: 10, offset: 0, total: response.data.length
       };
    }
    const response = await axios.get<MangaResponse>(`${BASE_URL}/manga`, {
      params: {
        ...params,
        'contentRating[]': ['safe', 'suggestive', 'erotica', 'pornographic'],
        'includes[]': ['cover_art', 'author', 'artist'],
      },
    });
    return response.data;
  },

  async getPopular(limit = 20, offset = 0, languages: string[] = ['ko']) {
    return this.searchManga({
      limit,
      offset,
      order: { followedCount: 'desc' },
      originalLanguage: languages,
    });
  },

  async getTrending(limit = 20, languages: string[] = ['ko']) {
    return this.searchManga({
      limit,
      order: { followedCount: 'desc' },
      originalLanguage: languages,
    });
  },

  async getLatestUpdates(limit = 20, languages: string[] = ['ko']) {
    const response = await axios.get(`${BASE_URL}/manga`, {
      params: {
        limit,
        'contentRating[]': ['safe', 'suggestive', 'erotica', 'pornographic'],
        'order[latestUploadedChapter]': 'desc',
        'includes[]': ['cover_art', 'author'],
        'originalLanguage[]': languages,
      },
    });
    return response.data;
  },

  async getMangaDetails(id: string) {
    const response = await axios.get<{ data: Manga }>(`${BASE_URL}/manga/${id}`, {
      params: {
        'includes[]': ['cover_art', 'author', 'artist'],
      },
    });
    return response.data.data;
  },

  async getMangaFeed(id: string, offset = 0, limit = 500) {
    const response = await axios.get<ChapterResponse>(`${BASE_URL}/manga/${id}/feed`, {
      params: {
        'translatedLanguage[]': ['en'],
        'order[chapter]': 'asc',
        limit,
        offset,
        'contentRating[]': ['safe', 'suggestive', 'erotica', 'pornographic'],
        'includeFutureUpdates': '1',
      },
    });
    return response.data;
  },

  async getUnifiedChapters(mangaId: string, title?: string, altTitles: string[] = [], refresh = false) {
    const response = await axios.get(`/api/unified/${mangaId}/chapters`, {
      params: { 
        title,
        altTitles: altTitles.join(','),
        refresh: refresh ? 'true' : undefined
      }
    });
    // Handle both direct array and object-wrapped responses
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.chapters) return response.data.chapters;
    return [];
  },

  async getUnifiedPages(chapterId: string, source: string, provider?: string) {
    const response = await axios.get(`/api/unified/chapter/${encodeURIComponent(chapterId)}/pages`, {
      params: { source, provider }
    });
    return response.data;
  },

  async getChapterPages(chapterId: string) {
    // If chapterId is a full URL (from scraper), handle differently or pass it through a proxy
    if (chapterId.startsWith('http')) {
        // Scraper reader logic would go here. For now, we prioritize MangaDex for images
        // but can add a scraper-image-proxy if needed.
    }
    const response = await axios.get<ChapterPages>(`${BASE_URL}/at-home/server/${chapterId}`);
    return response.data;
  },

  getCoverUrl(mangaId: string, fileName: string, quality: 'original' | '256' | '512' = '256') {
    if (fileName && (fileName.startsWith('http') || fileName.startsWith('/api/'))) return fileName;
    const suffix = quality === 'original' ? '' : `.${quality}.jpg`;
    return `${COVER_BASE_URL}/${mangaId}/${fileName}${suffix}`;
  },
};
