import { fetcher } from '../utils/fetcher';
import { UnifiedManga, UnifiedChapter } from '../utils/types';
import { normalizeChapterNumber } from '../utils/helpers';

const BASE_URL = 'https://juju-manhwa-2-0.vercel.app';

export class JujuService {
  /**
   * Search for manhwa/manga using the Juju API.
   */
  static async search(query: string): Promise<UnifiedManga[]> {
    try {
      console.log(`[JUJU] Searching: ${query}`);
      // Common endpoint for Juju-style mirrors
      const res = await fetcher(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
      
      // Try to handle different response formats
      const data = res.data?.results || res.data?.list || (Array.isArray(res.data) ? res.data : []);
      
      if (!Array.isArray(data)) return [];

      return data.map((m: any) => ({
        id: m.id || m.slug || m.hid,
        sourceId: m.id || m.slug || m.hid,
        source: 'juju',
        title: m.title || m.name,
        altTitles: m.altTitles || [],
        description: m.description || m.desc || '',
        cover: m.image || m.cover || m.img || '',
        status: m.status || 'unknown',
        author: m.author || 'Unknown',
        genres: m.genres || [],
        type: 'Manhwa'
      }));
    } catch (err) {
      console.error('[JUJU] Search Error:', err);
      return [];
    }
  }

  /**
   * Get chapters for a specific manhwa.
   */
  static async getChapters(id: string): Promise<UnifiedChapter[]> {
    try {
      console.log(`[JUJU] Fetching chapters for: ${id}`);
      // Usually Juju uses /api/manga/:id or /api/info/:id
      const res = await fetcher(`${BASE_URL}/api/manga/${encodeURIComponent(id)}`);
      
      const chapters = res.data?.chapters || (res.data?.chapter_list) || [];
      if (!Array.isArray(chapters)) return [];

      return chapters.map((c: any) => ({
        id: c.id || c.slug || c.hid,
        mangaId: id,
        number: normalizeChapterNumber(c.number || c.title || c.chapter_number),
        title: c.title || `Chapter ${c.number || c.chapter_number}`,
        date: c.date || c.updated_at || new Date().toISOString(),
        source: 'juju'
      }));
    } catch (err) {
      console.error('[JUJU] Chapters Error:', err);
      return [];
    }
  }

  /**
   * Get pages for a specific chapter.
   */
  static async getPages(chapterId: string): Promise<string[]> {
    try {
      console.log(`[JUJU] Fetching pages for: ${chapterId}`);
      // Usually /api/chapter/:id or /api/pages/:id
      const res = await fetcher(`${BASE_URL}/api/chapter/${encodeURIComponent(chapterId)}`);
      
      const images = res.data?.images || res.data?.pages || (Array.isArray(res.data) ? res.data : []);
      if (!Array.isArray(images)) return [];

      return images.map((img: any) => {
        if (typeof img === 'string') return img;
        return img.url || img.image || img.img;
      }).filter(Boolean);
    } catch (err) {
      console.error('[JUJU] Pages Error:', err);
      return [];
    }
  }
}
