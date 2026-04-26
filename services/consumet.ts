import { fetcher } from '../utils/fetcher';
import { UnifiedManga, UnifiedChapter } from '../utils/types';
import { normalizeChapterNumber } from '../utils/helpers';

const INSTANCES = [
  'https://consumet-api.vercel.app/manga',
  'https://api.consumet.org/manga',
  'https://c.delusionz.xyz/manga'
];

export class ConsumetService {
  private static activeInstance = INSTANCES[0];

  static async search(query: string): Promise<UnifiedManga[]> {
    const providers = ['mangakakalot', 'mangadex'];
    
    for (const instance of INSTANCES) {
      for (const provider of providers) {
        try {
          const res = await fetcher(`${instance}/${provider}/${query}`);
          if (res.data.results && res.data.results.length > 0) {
            this.activeInstance = instance; // Remember working instance
            return res.data.results.map((m: any) => ({
              id: m.id,
              sourceId: m.id,
              source: 'consumet',
              provider: provider,
              title: m.title,
              altTitles: [],
              description: m.description || '',
              cover: m.image || '',
              status: m.status || 'unknown',
              author: m.author || 'Unknown',
              genres: m.genres || [],
              type: 'Consumet'
            }));
          }
        } catch (err) {
          continue;
        }
      }
    }
    return [];
  }

  static async getChapters(mangaId: string, provider: string = 'mangakakalot'): Promise<UnifiedChapter[]> {
    try {
      const res = await fetcher(`${this.activeInstance}/${provider}/info`, {
        params: { id: mangaId }
      });

      if (!res.data.chapters) return [];

      return res.data.chapters.map((c: any) => ({
        id: c.id,
        mangaId: mangaId,
        number: normalizeChapterNumber(c.chapterNumber || c.number),
        title: c.title || `Chapter ${c.chapterNumber || c.number}`,
        date: new Date().toISOString(),
        source: 'consumet',
        provider: provider
      }));
    } catch (err) {
      console.error('Consumet Chapters Error:', err);
      // Fallback: search instances if active one fails
      return [];
    }
  }

  static async getPages(chapterId: string, provider: string = 'mangakakalot'): Promise<string[]> {
    try {
      const res = await fetcher(`${this.activeInstance}/${provider}/read`, {
        params: { chapterId }
      });
      
      const data = Array.isArray(res.data) ? res.data : (res.data?.pages || res.data?.images || []);
      if (!Array.isArray(data)) return [];

      return data.map((page: any) => {
        if (typeof page === 'string') return page;
        return page.img || page.image || page.url;
      }).filter(Boolean);
    } catch (err) {
      console.error('Consumet Pages Error:', err);
      return [];
    }
  }
}
