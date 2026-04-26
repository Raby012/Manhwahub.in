import { fetcher } from '../utils/fetcher';
import { UnifiedManga, UnifiedChapter } from '../utils/types';
import { normalizeChapterNumber } from '../utils/helpers';

const API_URL = 'https://api.comick.io';

export class ComickService {
  static async search(query: string): Promise<UnifiedManga[]> {
    try {
      const res = await fetcher(`${API_URL}/v1.1/search`, {
        params: { q: query, limit: 10 },
        headers: { 'Referer': 'https://comick.app/' }
      });

      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      
      return data.map((m: any) => ({
        id: m.hid,
        sourceId: m.hid,
        source: 'comick',
        title: m.title,
        altTitles: [], 
        description: m.desc || '',
        cover: m.md_covers?.[0]?.b2key ? `https://meo.comick.pictures/${m.md_covers[0].b2key}` : '',
        status: m.status === 1 ? 'ongoing' : 'completed',
        author: 'Multiple',
        genres: m.genres || [],
        type: 'General'
      }));
    } catch (err) {
      console.error('Comick Search Error:', err);
      return [];
    }
  }

  static async getChaptersByMangaId(hid: string): Promise<UnifiedChapter[]> {
    try {
      const res = await fetcher(`${API_URL}/comic/${hid}/chapters`, {
        params: { lang: 'en', limit: 1000 },
        headers: { 'Referer': 'https://comick.app/' }
      });

      return res.data.chapters.map((c: any) => ({
        id: c.hid,
        mangaId: hid,
        number: normalizeChapterNumber(c.chap),
        title: c.title || `Chapter ${c.chap}`,
        date: c.created_at,
        source: 'comick'
      }));
    } catch (err) {
      console.error('Comick Chapters Error:', err);
      return [];
    }
  }

  static async getPages(chapterHid: string): Promise<string[]> {
    try {
      const res = await fetcher(`${API_URL}/chapter/${chapterHid}`, {
        headers: { 'Referer': 'https://comick.app/' }
      });
      return res.data.chapter.images.map((img: any) => `https://meo.comick.pictures/${img.b2key}`);
    } catch (err) {
      console.error('Comick Pages Error:', err);
      return [];
    }
  }
}
