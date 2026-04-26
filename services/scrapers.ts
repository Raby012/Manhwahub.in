import { fetcher } from '../utils/fetcher';
import { UnifiedManga, UnifiedChapter } from '../utils/types';
import { normalizeChapterNumber, compareTitles } from '../utils/helpers';

const BASE_URL = 'https://manga-scrapers.onrender.com';
const PROVIDERS = ['manganato', 'mangareader', 'mangapill', 'asurascans'];

export class ScraperService {
  /**
   * Searches through all scrapers providers in parallel and returns the best matching result.
   */
  static async search(query: string): Promise<UnifiedManga[]> {
    const promises = PROVIDERS.map(async (provider) => {
      try {
        const res = await fetcher(`${BASE_URL}/${provider}/search/${encodeURIComponent(query)}`);
        
        let items: any[] = [];
        if (res.data && Array.isArray(res.data)) {
          items = res.data;
        } else if (res.data && Array.isArray(res.data.results)) {
          items = res.data.results;
        } else {
          return [];
        }
        
        return items.map((m: any) => ({
          id: m.id,
          sourceId: m.id,
          source: 'scrapers',
          provider: provider,
          title: m.title,
          altTitles: [],
          description: m.description || '',
          cover: m.image || '',
          status: 'unknown',
          author: 'Unknown',
          genres: [],
          type: 'Scraper'
        }));
      } catch (err) {
        return [];
      }
    });

    const results = await Promise.all(promises);
    const allResults = results.flat();

    // Group by title similarity to find the best match for the query
    return allResults.sort((a, b) => {
      const scoreA = compareTitles(query, a.title);
      const scoreB = compareTitles(query, b.title);
      return scoreB - scoreA;
    });
  }

  /**
   * Fetches manga details and chapters for a specific provider and id.
   */
  static async getChapters(id: string, provider: string): Promise<UnifiedChapter[]> {
    try {
      console.log(`[SCRAPERS] Fetching info for ${id} via ${provider}`);
      const res = await fetcher(`${BASE_URL}/${provider}/info/${encodeURIComponent(id)}`);
      
      let chaptersData = [];
      if (res.data && Array.isArray(res.data.chapters)) {
        chaptersData = res.data.chapters;
      } else if (res.data && res.data.results && Array.isArray(res.data.results.chapters)) {
        chaptersData = res.data.results.chapters;
      } else {
        console.warn(`[SCRAPERS] No chapters found for ${id} on ${provider}`);
        return [];
      }

      return chaptersData.map((c: any) => ({
        id: c.id,
        mangaId: id,
        number: normalizeChapterNumber(c.number || c.chapterNumber || c.title),
        title: c.title || `Chapter ${c.number || c.chapterNumber}`,
        date: c.date || new Date().toISOString(),
        source: 'scrapers',
        provider: provider
      }));
    } catch (err) {
      console.error(`[SCRAPERS] Error fetching chapters for ${id}:`, err);
      return [];
    }
  }

  /**
   * Fetches pages for a specific chapter.
   */
  static async getPages(chapterId: string, provider: string): Promise<string[]> {
    try {
      console.log(`[SCRAPERS] Fetching pages for ${chapterId} via ${provider}`);
      const res = await fetcher(`${BASE_URL}/${provider}/pages/${encodeURIComponent(chapterId)}`);
      
      const data = Array.isArray(res.data) ? res.data : (res.data?.pages || res.data?.images || (Array.isArray(res.data?.results) ? res.data.results : []));
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`[SCRAPERS] No pages found for ${chapterId} on ${provider}. Data context:`, !!res.data);
        return [];
      }

      // Return array of image URLs
      return data.map((page: any) => {
        if (typeof page === 'string') return page;
        return page.image || page.img || page.url;
      }).filter(Boolean);
    } catch (err) {
      console.error(`[SCRAPERS] Error fetching pages for ${chapterId}:`, err);
      return [];
    }
  }
}
