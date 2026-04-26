import { fetcher } from '../utils/fetcher';
import { UnifiedManga, UnifiedChapter } from '../utils/types';
import { normalizeChapterNumber } from '../utils/helpers';

const BASE_URL = 'https://manhwa-scraper-production.up.railway.app';

export class RailwayService {
  /**
   * Search for manga.
   */
  static async search(query: string): Promise<UnifiedManga[]> {
    try {
      console.log(`[RAILWAY] Searching: ${query}`);
      const res = await fetcher(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
      if (!res.data || !res.data.list || !Array.isArray(res.data.list)) return [];

      return res.data.list.map((m: any) => ({
        id: m.slug,
        sourceId: m.slug,
        source: 'railway', // We define it as railway so aggregator knows how to fetch pages
        title: m.title,
        altTitles: [],
        description: '',
        cover: m.image || '',
        status: 'unknown',
        author: 'Unknown',
        genres: [],
        type: 'Scraper'
      }));
    } catch (err) {
      console.error('[RAILWAY] Search Error:', err);
      return [];
    }
  }

  /**
   * Get chapters for a manga.
   */
  static async getChapters(slug: string): Promise<UnifiedChapter[]> {
    try {
      console.log(`[RAILWAY] Fetching chapters for: ${slug}`);
      const res = await fetcher(`${BASE_URL}/api/info/${encodeURIComponent(slug)}`);
      if (!res.data || !res.data.chapters || !Array.isArray(res.data.chapters)) return [];

      return res.data.chapters.map((c: any) => ({
        id: c.slug,
        mangaId: slug,
        number: normalizeChapterNumber(c.title),
        title: c.title,
        date: c.date || new Date().toISOString(),
        source: 'railway'
      }));
    } catch (err) {
      console.error('[RAILWAY] Chapters Error:', err);
      return [];
    }
  }

  /**
   * Get pages for a chapter.
   */
  static async getPages(chapterId: string): Promise<string[]> {
    try {
      console.log(`[RAILWAY] Fetching pages for: ${chapterId}`);
      const res = await fetcher(`${BASE_URL}/api/chapter/${encodeURIComponent(chapterId)}`);
      if (!res.data || !res.data.images || !Array.isArray(res.data.images)) return [];

      return res.data.images;
    } catch (err) {
      console.error('[RAILWAY] Pages Error:', err);
      return [];
    }
  }
}
