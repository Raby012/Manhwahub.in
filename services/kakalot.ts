import { fetcher } from '../utils/fetcher';
import * as cheerio from 'cheerio';
import { UnifiedManga, UnifiedChapter } from '../utils/types';
import { normalizeChapterNumber } from '../utils/helpers';

export class KakalotService {
  static async search(query: string): Promise<UnifiedManga[]> {
    if (!query || query.trim().length < 2) return [];

    const domains = [
      'https://manganato.com',
      'https://mangakakalot.com'
    ];
    
    const querySlug = query.trim().replace(/\s+/g, '_').replace(/[^\w\s]/gi, '').toLowerCase();
    if (!querySlug || querySlug === '_') return [];

    for (const domain of domains) {
      try {
        // Try multiple URL patterns for search
        const urls = [
          `${domain}/search/story/${querySlug}`,
          `${domain}/search/story/${encodeURIComponent(query).replace(/%20/g, '_')}`
        ];

        let res;
        let successUrl = '';

        for (const searchUrl of urls) {
           try {
              console.log(`[KAKALOT] Trying ${searchUrl}`);
              res = await fetcher(searchUrl, {
                headers: { 
                  'Referer': domain,
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache'
                }
              });
              if (res.data) {
                successUrl = searchUrl;
                break;
              }
           } catch (e) {
              continue;
           }
        }

        if (!res?.data) continue;
        
        const $ = cheerio.load(res.data);
        const results: UnifiedManga[] = [];

        $('.story_item, .search-story-item, .item-story').each((i, el) => {
          const titleEl = $(el).find('.story_name a, .item-title, h3 a, a').first();
          const imgEl = $(el).find('img').first();
          const title = titleEl.text().trim();
          const path = titleEl.attr('href');
          const cover = imgEl.attr('src') || imgEl.attr('data-src');
          
          if (title && path && path.includes(domain.split('//')[1].split('/')[0])) {
            results.push({
              id: path.startsWith('http') ? path : `${domain}${path.startsWith('/') ? '' : '/'}${path}`,
              sourceId: path,
              source: 'kakalot',
              title,
              altTitles: [],
              description: '',
              cover: cover || '',
              status: 'unknown',
              author: $(el).find('span').first().text().replace('Author(s) : ', '').trim(),
              genres: [],
              type: 'Scraper'
            });
          }
        });

        if (results.length > 0) return results;
      } catch (err) {
        console.warn(`Kakalot search failed for ${domain}, trying next...`);
        continue;
      }
    }
    return [];
  }

  static async getChapters(storyUrl: string): Promise<UnifiedChapter[]> {
    try {
      const domain = new URL(storyUrl).origin;
      const res = await fetcher(storyUrl, {
        headers: {
          'Referer': domain
        }
      });
      const $ = cheerio.load(res.data);
      const chapters: UnifiedChapter[] = [];

      $('.chapter-list .row, .row-content-chapter li').each((i, el) => {
        const link = $(el).find('a');
        if (link.length) {
          const title = link.text().trim();
          const href = link.attr('href');
          chapters.push({
            id: href || '',
            mangaId: storyUrl,
            number: normalizeChapterNumber(title),
            title: title,
            date: new Date().toISOString(),
            source: 'kakalot'
          });
        }
      });

      return chapters;
    } catch (err) {
      console.error('Kakalot Chapters Error:', err);
      return [];
    }
  }

  static async getPages(chapterUrl: string): Promise<string[]> {
    try {
      const domain = new URL(chapterUrl).origin;
      const res = await fetcher(chapterUrl, {
        headers: {
          'Referer': domain
        }
      });
      const $ = cheerio.load(res.data);
      const pages: string[] = [];
      
      $('.container-chapter-reader img, .v-content-chapter img, .v-content img, #v-content img, .read-container img, .reading-content img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || $(el).attr('data-cdn') || $(el).attr('data-original-src');
        if (src) {
          const cleanSrc = src.trim();
          if (cleanSrc.startsWith('http')) {
            pages.push(cleanSrc);
          } else if (cleanSrc.startsWith('//')) {
            pages.push(`https:${cleanSrc}`);
          }
        }
      });
      
      return pages;
    } catch (err) {
      console.error('Kakalot Pages Error:', err);
      return [];
    }
  }
}
