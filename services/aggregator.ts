import { MangaDexService } from './mangadex';
import { ComickService } from './comick';
import { KakalotService } from './kakalot';
import { ConsumetService } from './consumet';
import { ScraperService } from './scrapers';
import { RailwayService } from './railway';
import { JujuService } from './juju';
import { compareTitles } from '../utils/helpers';
import { UnifiedChapter, UnifiedManga } from '../utils/types';
import NodeCache from 'node-cache';

export const mappingCache = new NodeCache({ stdTTL: 86400 }); // 24 hours for ID mappings

export class AggregatorService {
  static clearMapping(mangaId: string) {
    mappingCache.del(`mapping-${mangaId}`);
  }

  static async searchAll(query: string): Promise<UnifiedManga[]> {
    const sources = [
      () => ConsumetService.search(query),
      () => MangaDexService.search(query),
      () => RailwayService.search(query),
      () => ComickService.search(query),
      () => KakalotService.search(query),
      () => JujuService.search(query),
      () => ScraperService.search(query)
    ];

    // Try all sources in parallel but with a timeout for each so one doesn't block all
    const resultsArray = await Promise.allSettled(sources.map(s => s()));
    
    const allResults: UnifiedManga[] = [];
    resultsArray.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value && r.value.length > 0) {
        allResults.push(...r.value);
      } else if (r.status === 'rejected') {
        console.warn(`AGGREGATOR_SEARCH: Source ${idx} failed:`, r.reason?.message || r.reason);
      }
    });

    if (allResults.length === 0) return [];

    // Prioritize and deduplicate
    const seen = new Set<string>();
    const unique: UnifiedManga[] = [];

    // Prioritize by source (Consumet then MangaDex then Railway etc)
    const sourcePriority: Record<string, number> = {
      'juju': 1,
      'consumet': 2,
      'mangadex': 3,
      'railway': 4,
      'comick': 5,
      'kakalot': 6,
      'scrapers': 7
    };

    allResults.sort((a, b) => (sourcePriority[a.source] || 10) - (sourcePriority[b.source] || 10));

    for (const m of allResults) {
      const key = `${m.source}-${m.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(m);
      }
    }

    return unique;
  }

  static async getCombinedChapters(mangaId: string, title?: string, altTitles: string[] = []): Promise<UnifiedChapter[]> {
    if (!title) {
      console.log('AGGREGATOR: No title provided, defaulting to MangaDex only');
      return await MangaDexService.getChapters(mangaId);
    }

    const mappingKey = `mapping-${mangaId}`;
    let mapping = mappingCache.get<{ 
      comickId?: string; 
      kakalotId?: string; 
      consumetId?: string; 
      consumetProvider?: string;
      scraperId?: string;
      scraperProvider?: string;
      railwayId?: string;
      jujuId?: string;
    }>(mappingKey);

    // Hardcoded mappings for top tier manhwa mentioned by user to ensure 100% chapter availability
    const specialMappings: Record<string, { scraperId: string, scraperProvider: string }> = {
      'Omniscient Reader\'s Viewpoint': { scraperId: 'orv', scraperProvider: 'asurascans' },
      'Jeonjijeok Dokja Sijeom': { scraperId: 'orv', scraperProvider: 'asurascans' },
      'Solo Leveling': { scraperId: 'solo-leveling', scraperProvider: 'asurascans' },
      'Na Honjaman Level-Up': { scraperId: 'solo-leveling', scraperProvider: 'asurascans' },
      'Lookism': { scraperId: 'lookism', scraperProvider: 'mangareader' },
      'The Beginning After the End': { scraperId: 'the-beginning-after-the-end', scraperProvider: 'asurascans' },
      'Trash of the Count\'s Family': { scraperId: 'trash-of-the-counts-family', scraperProvider: 'asurascans' },
      'Lout of the Count\'s Family': { scraperId: 'trash-of-the-counts-family', scraperProvider: 'asurascans' }
    };

    if (specialMappings[title]) {
        console.log(`AGGREGATOR: Found special mapping for ${title}, bypassing search.`);
        mapping = {
            scraperId: specialMappings[title].scraperId,
            scraperProvider: specialMappings[title].scraperProvider
        };
    }

    if (!mapping) {
      console.log(`AGGREGATOR: Mapping not found for ${title}, performing deep search...`);
      
      // Collect top 3 most likely titles to avoid overwhelming scrapers
      const allSearchTitles = [title, ...altTitles].slice(0, 3);
      
      console.log(`AGGREGATOR: Deep search for ${title} using top ${allSearchTitles.length} titles...`);
      
      const combinedResults = {
        comick: [] as UnifiedManga[],
        kakalot: [] as UnifiedManga[],
        consumet: [] as UnifiedManga[],
        scraper: [] as UnifiedManga[],
        railway: [] as UnifiedManga[],
        juju: [] as UnifiedManga[]
      };

      // Search each service, but we don't need to search all alts if first one hits for that specific service
      const searchService = async (service: any, titleList: string[]) => {
        for (const t of titleList) {
          try {
            const results = await service.search(t);
            if (results && results.length > 0) return results;
          } catch (e) {
            continue;
          }
        }
        return [];
      };

      // Search in two phases to avoid network saturation
      // Phase 1: High speed/priority sources
      const [comickRes, railwayRes, jujuRes] = await Promise.all([
        searchService(ComickService, [title]),
        searchService(RailwayService, [title, ...altTitles].slice(0, 2)),
        searchService(JujuService, [title, ...altTitles].slice(0, 3))
      ]);

      // Phase 2: Heavier scrapers (search sequentially to avoid bot detection/timeouts)
      let kakalotRes: UnifiedManga[] = [];
      let consumetRes: UnifiedManga[] = [];
      let scraperRes: UnifiedManga[] = [];

      // If we don't have enough results yet, or just to be thorough
      kakalotRes = await searchService(KakalotService, allSearchTitles);
      consumetRes = await searchService(ConsumetService, allSearchTitles);
      scraperRes = await searchService(ScraperService, allSearchTitles);
       
      combinedResults.comick = comickRes;
      combinedResults.kakalot = kakalotRes;
      combinedResults.consumet = consumetRes;
      combinedResults.scraper = scraperRes;
      combinedResults.railway = railwayRes;
      combinedResults.juju = jujuRes;

      const findBest = (results: UnifiedManga[]) => {
        return results.find(m => {
          return allSearchTitles.some(t => compareTitles(t, m.title) >= 0.7);
        });
      };

      const bestConsumet = findBest(combinedResults.consumet);
      const bestScraper = findBest(combinedResults.scraper);
      const bestRailway = findBest(combinedResults.railway);
      const bestJuju = findBest(combinedResults.juju);

      mapping = {
        comickId: findBest(combinedResults.comick)?.id,
        kakalotId: findBest(combinedResults.kakalot)?.id,
        consumetId: bestConsumet?.id,
        consumetProvider: (bestConsumet as any)?.provider,
        scraperId: bestScraper?.id,
        scraperProvider: (bestScraper as any)?.provider,
        railwayId: bestRailway?.id,
        jujuId: bestJuju?.id
      };

      // Apply special hardcoded fallback for scraper provider if known top manhwa
      if (!mapping.scraperId) {
        for (const [key, data] of Object.entries(specialMappings)) {
          if (compareTitles(title, key) > 0.9) {
            mapping.scraperId = data.scraperId;
            mapping.scraperProvider = data.scraperProvider;
            break;
          }
        }
      }

      mappingCache.set(mappingKey, mapping);
    }

    // Parallel fetch from all potential sources
    const chapterPromises = [
      MangaDexService.getChapters(mangaId).then(res => ({ source: 'mangadex', chapters: res })).catch(() => ({ source: 'mangadex', chapters: [] })),
      mapping.comickId ? ComickService.getChaptersByMangaId(mapping.comickId).then(res => ({ source: 'comick', chapters: res })).catch(() => ({ source: 'comick', chapters: [] })) : Promise.resolve({ source: 'comick', chapters: [] }),
      mapping.kakalotId ? KakalotService.getChapters(mapping.kakalotId).then(res => ({ source: 'kakalot', chapters: res })).catch(() => ({ source: 'kakalot', chapters: [] })) : Promise.resolve({ source: 'kakalot', chapters: [] }),
      mapping.consumetId ? ConsumetService.getChapters(mapping.consumetId, mapping.consumetProvider).then(res => ({ source: 'consumet', chapters: res })).catch(() => ({ source: 'consumet', chapters: [] })) : Promise.resolve({ source: 'consumet', chapters: [] }),
      mapping.scraperId ? ScraperService.getChapters(mapping.scraperId, mapping.scraperProvider!).then(res => ({ source: 'scrapers', chapters: res })).catch(() => ({ source: 'scrapers', chapters: [] })) : Promise.resolve({ source: 'scrapers', chapters: [] }),
      mapping.railwayId ? RailwayService.getChapters(mapping.railwayId).then(res => ({ source: 'railway', chapters: res })).catch(() => ({ source: 'railway', chapters: [] })) : Promise.resolve({ source: 'railway', chapters: [] }),
      mapping.jujuId ? JujuService.getChapters(mapping.jujuId).then(res => ({ source: 'juju', chapters: res })).catch(() => ({ source: 'juju', chapters: [] })) : Promise.resolve({ source: 'juju', chapters: [] })
    ];

    const results = await Promise.all(chapterPromises);
    
    // Logging results for debugging
    results.forEach(r => {
      console.log(`SOURCE: ${r.source} → chapters: ${r.chapters.length}`);
    });

    // Step 2: Merge logic
    const validSources = results.filter(r => r.chapters && r.chapters.length > 0);
    if (validSources.length === 0) {
      console.warn('AGGREGATOR: No chapters found from ANY source');
      return [];
    }

    const chapterMap = new Map<number, UnifiedChapter>();
    
    // Priority order: Consumet > MangaDex > Railway > Comick > Kakalot > Scrapers
    const priorityMap: Record<string, number> = {
      'juju': 10,
      'consumet': 6,
      'mangadex': 5,
      'railway': 4,
      'comick': 3,
      'kakalot': 2,
      'scrapers': 1
    };

    // Flatten all chapters and sort by priority so higher priority overwrites lower
    const allChapters = results.flatMap(r => r.chapters);
    allChapters.sort((a, b) => (priorityMap[a.source] || 0) - (priorityMap[b.source] || 0));

    allChapters.forEach(ch => {
      if (typeof ch.number === 'number' && ch.number >= 0) {
        chapterMap.set(ch.number, ch);
      }
    });

    // Step 3: Sort DESC (Latest first)
    const finalChapters = Array.from(chapterMap.values()).sort((a, b) => b.number - a.number);
    console.log(`AGGREGATOR_FINAL: Merged ${finalChapters.length} unique chapters`);
    
    return finalChapters;
  }

  static async getCombinedPages(chapterId: string, source: string, provider?: string): Promise<string[]> {
    console.log(`AGGREGATOR_PAGES: Loading pages from ${source} for chapter ${chapterId}`);
    let pages: string[] = [];
    let fetchError = false;

    const useProxy = (url: string) => {
      if (!url) return '';
      // Direct MangaDex URLs are generally hotlinkable natively or managed differently
      if (url.includes('mangadex.org/data')) return url;
      // Route all external images through our node proxy backend to inject referers seamlessly
      if (url.startsWith('http') && !url.includes('/api/proxy')) {
        return `/api/proxy?url=${encodeURIComponent(url)}`;
      }
      return url;
    };

    try {
      // 1. First try direct MangaDex fetching
      if (source === 'mangadex') {
        const data = await MangaDexService.getChapterPages(chapterId);
        if (data && data.chapter && data.baseUrl) {
          const baseUrl = data.baseUrl;
          const hash = data.chapter.hash;
          const quality = data.chapter.data?.length > 0 ? 'data' : 'data-saver';
          const files = data.chapter.data?.length > 0 ? data.chapter.data : (data.chapter.dataSaver || []);
          pages = files.map((file: string) => `${baseUrl}/${quality}/${hash}/${file}`);
        }
      } else if (source === 'comick') {
        pages = await ComickService.getPages(chapterId) || [];
      } else if (source === 'kakalot') {
        pages = await KakalotService.getPages(chapterId) || [];
      } else if (source === 'railway') {
        pages = await RailwayService.getPages(chapterId) || [];
      } else if (source === 'consumet') {
        pages = await ConsumetService.getPages(chapterId, provider || 'mangakakalot') || [];
      } else if (source === 'juju') {
        pages = await JujuService.getPages(chapterId) || [];
      } else if (source === 'scrapers') {
        pages = await ScraperService.getPages(chapterId, provider || 'manganato') || [];
      }
    } catch (err) {
      console.error(`AGGREGATOR_FETCH_ERROR [${source}]:`, err);
      fetchError = true;
    }

    // 2. Enhanced Fallback/Healing logic (Targeting MangaDex chapters which are often empty)
    if ((pages.length === 0 || fetchError) && source === 'mangadex') {
      console.log(`AGGREGATOR_HEAL: Primary MangaDex failed. Starting recursive fallback.`);

      // Fallback 1: Consumet MangaDex
      try {
        const consumetMdPages = await ConsumetService.getPages(chapterId, 'mangadex');
        if (consumetMdPages.length > 0) return consumetMdPages.map(useProxy);
      } catch (e) {}

      // Fallback 2: Consumet Kakalot (using the same chapterId as MangaDex might not work directly, but we try as requested)
      try {
        const consumetKkPages = await ConsumetService.getPages(chapterId, 'mangakakalot');
        if (consumetKkPages.length > 0) return consumetKkPages.map(useProxy);
      } catch (e) {}

      // Fallback 3: Cross-source healing (find mapped chapter number in other scrapers)
      try {
        const healedPages = await this.healPagesFromMangaDex(chapterId);
        if (healedPages.length > 0) return healedPages.map(useProxy);
      } catch (e) {}
    }

    // Apply proxy to all final URLs to bypass hotlink protection
    // MangaDex is handled via client-side fallback as requested
    if (source === 'mangadex') return pages;
    
    return pages.map(useProxy);
  }

  private static async healPagesFromMangaDex(chapterId: string): Promise<string[]> {
    try {
      const chapterInfo = await MangaDexService.getChapterInfo(chapterId);
      if (!chapterInfo) return [];

      const mangaInfo = chapterInfo.relationships.find((r: any) => r.type === 'manga');
      const mangaId = mangaInfo?.id;
      const mangaTitle = mangaInfo?.attributes?.title?.en || '';
      
      const chapterNumStr = chapterInfo.attributes.chapter;
      const chapterNum = chapterNumStr ? parseFloat(chapterNumStr) : NaN;
      
      if (!mangaId || isNaN(chapterNum)) return [];

      const mappingKey = `mapping-${mangaId}`;
      const mapping = mappingCache.get<any>(mappingKey);
      
      if (!mapping) return [];

      console.log(`AGGREGATOR_HEAL: Searching fallback for Manga: ${mangaId}, Ch: ${chapterNum}`);

      // Sequential fallback to avoid network congestion during healing
      const sourcesToTry = [
        { id: mapping.scraperId, service: ScraperService, provider: mapping.scraperProvider },
        { id: mapping.jujuId, service: JujuService, provider: undefined },
        { id: mapping.railwayId, service: RailwayService, provider: undefined },
        { id: mapping.kakalotId, service: KakalotService, provider: undefined },
        { id: mapping.comickId, service: ComickService, provider: undefined }
      ].filter(s => s.id);

      for (const { id, service, provider } of sourcesToTry) {
        try {
          const chapters = await (service as any).getChapters(id, provider);
          const target = chapters.find((c: any) => c.number === chapterNum);
          if (target) {
            console.log(`AGGREGATOR_HEAL: Found replacement on ${target.source}. Fetching...`);
            const pages = await this.getCombinedPages(target.id, target.source, (target as any).provider);
            if (pages.length > 0) return pages;
          }
        } catch (e) {
          continue;
        }
      }

      return [];
    } catch (err) {
      console.error('AGGREGATOR_HEAL_FAILED:', err);
      return [];
    }
  }
}
