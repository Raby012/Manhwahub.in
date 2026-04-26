import { fetcher } from '../utils/fetcher';
import { UnifiedManga, UnifiedChapter } from '../utils/types';
import { normalizeChapterNumber } from '../utils/helpers';

const API_URL = 'https://api.mangadex.org';

export class MangaDexService {
  static async search(query: string): Promise<UnifiedManga[]> {
    try {
      const res = await fetcher(`${API_URL}/manga`, {
        params: {
          title: query,
          limit: 10,
          'contentRating[]': ['safe', 'suggestive'],
          'includes[]': ['cover_art', 'author', 'artist']
        }
      });

      return res.data.data.map((m: any) => {
        const coverRel = m.relationships.find((r: any) => r.type === 'cover_art');
        const fileName = coverRel?.attributes?.fileName;
        const authorRel = m.relationships.find((r: any) => r.type === 'author');
        
        return {
          id: m.id,
          sourceId: m.id,
          source: 'mangadex',
          title: m.attributes.title.en || Object.values(m.attributes.title)[0],
          altTitles: m.attributes.altTitles.map((a: any) => Object.values(a)[0]),
          description: m.attributes.description.en || Object.values(m.attributes.description)[0],
          cover: fileName ? `https://uploads.mangadex.org/covers/${m.id}/${fileName}.256.jpg` : '',
          status: m.attributes.status,
          author: authorRel?.attributes?.name || 'Unknown',
          genres: m.attributes.tags.map((t: any) => t.attributes.name.en),
          type: m.attributes.originalLanguage === 'ko' ? 'Manhwa' : m.attributes.originalLanguage === 'ja' ? 'Manga' : 'Manhua'
        };
      });
    } catch (err) {
      console.error('MangaDex Search Error:', err);
      return [];
    }
  }

  static async getChapters(mangaId: string): Promise<UnifiedChapter[]> {
    let allChapters: any[] = [];
    let offset = 0;
    const limit = 100;

    try {
      while (true) {
        const res = await fetcher(`${API_URL}/manga/${mangaId}/feed`, {
          params: {
            'translatedLanguage[]': ['en'],
            'order[chapter]': 'desc',
            limit,
            offset,
            'contentRating[]': ['safe', 'suggestive', 'erotica', 'pornographic']
          }
        });
        
        const data = res.data;
        allChapters = [...allChapters, ...data.data];
        
        if (offset + limit >= data.total) break;
        offset += limit;
      }

      return allChapters.map((c: any) => ({
        id: c.id,
        mangaId: mangaId,
        number: normalizeChapterNumber(c.attributes.chapter),
        title: c.attributes.title || `Chapter ${c.attributes.chapter}`,
        date: c.attributes.publishAt,
        source: 'mangadex'
      }));
    } catch (err) {
      console.error('MangaDex Chapters Error:', err);
      return [];
    }
  }

  static async getChapterPages(chapterId: string) {
    const res = await fetcher(`${API_URL}/at-home/server/${chapterId}`, {
      headers: { 'Referer': 'https://mangadex.org/' }
    });
    return res.data;
  }

  static async getChapterInfo(chapterId: string) {
    const res = await fetcher(`${API_URL}/chapter/${chapterId}`, {
      params: { 'includes[]': ['manga'] }
    });
    return res.data.data;
  }
}
