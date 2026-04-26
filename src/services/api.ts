export const BASE = 'https://manhwa-api-production.up.railway.app';

export interface MangaItem {
  id: string;
  slug: string;
  title: string;
  image?: string;
  poster?: string;
  cover?: string;
  type?: string;
  status?: string;
  author?: string;
  chapter?: string;
}

async function cachedFetch(url: string) {
  const isOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
  
  if (!isOnline) {
    if (typeof caches !== 'undefined') {
      const cache = await caches.open('manhwahub-cache');
      const cachedRes = await cache.match(url);
      if (cachedRes) return cachedRes;
    }
    throw new Error('Offline and no cached data available.');
  }

  try {
    const res = await fetch(url);
    if (res.ok && typeof caches !== 'undefined') {
      const resClone = res.clone();
      caches.open('manhwahub-cache').then(cache => cache.put(url, resClone));
    }
    return res;
  } catch (err) {
    if (typeof caches !== 'undefined') {
      const cache = await caches.open('manhwahub-cache');
      const cachedRes = await cache.match(url);
      if (cachedRes) return cachedRes;
    }
    throw err;
  }
}

async function apiFetch(url: string) {
  const res = await cachedFetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export const getHome = () => apiFetch(`${BASE}/api/home`);
export const getLatest = (p=1) => apiFetch(`${BASE}/api/latest/${p}`);
export const getAll = (p=1) => apiFetch(`${BASE}/api/all/${p}`);
export const getTrending = (p=1) => apiFetch(`${BASE}/api/trending/${p}`);
export const getManhwa = (p=1) => apiFetch(`${BASE}/api/manhwa/${p}`);
export const getManhua = (p=1) => apiFetch(`${BASE}/api/manhua/${p}`);
export const getMangaOnly = (p=1) => apiFetch(`${BASE}/api/manga/${p}`);
export const getManga = getMangaOnly;
export const getTags = () => apiFetch(`${BASE}/api/tags`);
export const getByGenre = (tagId: string, p=1) => apiFetch(`${BASE}/api/genre/${tagId}/${p}`);

export async function getChapters(manga: any) {
  const id = manga?.id || manga?.slug || manga?.anilistId || '';
  const title = manga?.title || manga?.page || '';
  console.log('Loading chapters from Railway API, MangaDex, and WeebCentral for merging:', id, title);

  try {
    // 1. Fetch from Railway API (Primary source)
    const railwayPromise = cachedFetch(`${BASE}/api/chapters/${id}`).then(r => r.json()).catch(() => null);
    
    // 2. Fetch from MangaDex (Secondary source) to get alt titles if any
    const mdDataResult = await (async () => {
      try {
        let mdId = id;
        let altTitlesList: string[] = [];
        
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mdId)) {
           if (!title) return { ch: [], alt: [] };
           const mdSearch = await cachedFetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=1&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`).then(r => r.json());
           mdId = mdSearch?.data?.[0]?.id;
           if (mdSearch?.data?.[0]?.attributes?.altTitles) {
             mdSearch.data[0].attributes.altTitles.forEach((t:any) => { if (t.en) altTitlesList.push(t.en) });
           }
        } else {
           try {
             const mdInfo = await cachedFetch(`https://api.mangadex.org/manga/${mdId}`).then(r => r.json());
             if (mdInfo?.data?.attributes?.altTitles) {
               mdInfo.data.attributes.altTitles.forEach((t:any) => { if (t.en) altTitlesList.push(t.en) });
             }
           } catch(e) { }
        }

        if (!mdId) return { ch: [], alt: altTitlesList };
        
        let allCh: any[] = [];
        let offset = 0;
        while (offset < 2000) {
          const feed = await cachedFetch(`https://api.mangadex.org/manga/${mdId}/feed?limit=500&offset=${offset}&translatedLanguage[]=en&order[chapter]=desc`).then(r => r.json());
          const fetched = feed?.data || [];
          if (!fetched.length) break;
          allCh.push(...fetched);
          if (offset + 500 >= (feed?.total || 0)) break;
          offset += 500;
        }

        allCh = allCh.filter(
          (c) => c.attributes?.translatedLanguage === 'en' && c.attributes?.pages > 0 && !c.attributes?.externalUrl
        );

        return { ch: allCh, alt: altTitlesList };
      } catch (e) {
        return { ch: [], alt: [] };
      }
    })();

    const mdData = mdDataResult.ch;
    const extraAltTitles = mdDataResult.alt || [];
    
    // Merge provided manga alt titles with MangaDex's
    const allAltTitles = new Set<string>();
    if (manga?.alt_titles) {
      manga.alt_titles.forEach((t:any) => {
         if (t.en) allAltTitles.add(t.en);
         else if (typeof t === 'string') allAltTitles.add(t);
      });
    }
    extraAltTitles.forEach(t => allAltTitles.add(t));
    const altTitleArray = Array.from(allAltTitles);

    // 3. Fetch from WeebCentral (Ultimate fallback to fix missing chapters)
    const wcPromise = (async () => {
      try {
        if (!title) return [];
        let wcSearch = await cachedFetch(`/api/weebcentral/search?q=${encodeURIComponent(title)}`).then(r => r.json());
        let wcMatch = wcSearch[0];
        
        // --- 🟢 NEW: Fallback search if empty ---
        if (!wcMatch && altTitleArray.length > 0) {
          for (const altEn of altTitleArray) {
            wcSearch = await cachedFetch(`/api/weebcentral/search?q=${encodeURIComponent(altEn)}`).then(r => r.json());
            wcMatch = wcSearch[0];
            if (wcMatch) break;
          }
        }
        
        if (!wcMatch?.id) return [];
        const wcChapters = await cachedFetch(`/api/weebcentral/chapters?id=${encodeURIComponent(wcMatch.id)}`).then(r => r.json());
        return wcChapters;
      } catch (e) {
        return [];
      }
    })();

    // 4. Fetch from ComicK (Excellent library with almost all manhwas)
    const ckPromise = (async () => {
      try {
        if (!title) return [];
        let ckSearch = await cachedFetch(`/api/comick/search?q=${encodeURIComponent(title)}`).then(r => r.json());
        let ckMatch = ckSearch[0]; // Best match
        
        // --- 🟢 NEW: Fallback search if empty ---
        if (!ckMatch && altTitleArray.length > 0) {
           for (const altEn of altTitleArray) {
             ckSearch = await cachedFetch(`/api/comick/search?q=${encodeURIComponent(altEn)}`).then(r => r.json());
             ckMatch = ckSearch[0];
             if (ckMatch) break;
           }
        }

        if (!ckMatch?.id) return [];
        const ckChapters = await cachedFetch(`/api/comick/chapters?id=${encodeURIComponent(ckMatch.id)}`).then(r => r.json());
        return ckChapters;
      } catch (e) {
        return [];
      }
    })();

    const [railwayData, wcData, ckData] = await Promise.all([railwayPromise, wcPromise, ckPromise]);

    // MAP base chapters
    const combinedMap = new Map<number, any>();

    // Fill gaps from ComicK
    if (Array.isArray(ckData)) {
      ckData.forEach((ch: any) => {
        let num = parseFloat(ch.chap || ch.chapter);
        if (isNaN(num)) {
           const match = ch.title?.match(/Chapter\s+([\d.]+)/i);
           num = match ? parseFloat(match[1]) : NaN;
        }
        if (!isNaN(num)) {
          const entry = combinedMap.get(num) || {
            ch_title: ch.title && ch.title !== `Chapter ${num}` ? `Chapter ${num} - ${ch.title}` : `Chapter ${num}`,
            chapter_number: num.toString(),
            slug: ch.id,
            time: ch.releaseDate || '',
            provider: 'comick',
            isFallback: true
          };
          entry.comick_slug = ch.id;
          combinedMap.set(num, entry);
        }
      });
    }

    // Fill gaps from WeebCentral (Usually highest quality & completed)
    if (Array.isArray(wcData)) {
      wcData.forEach((ch: any) => {
        // Extract chapter number from title (e.g. "Chapter 200")
        const match = ch.title?.match(/Chapter\s+([\d.]+)/i);
        const num = match ? parseFloat(match[1]) : NaN;
        if (!isNaN(num)) {
          const entry = combinedMap.get(num) || {
            ch_title: ch.title || `Chapter ${num}`,
            chapter_number: num.toString(),
            slug: ch.id,
            time: ch.releaseDate || '',
            provider: 'weebcentral',
            isFallback: true
          };
          entry.weebcentral_slug = ch.id;
          combinedMap.set(num, entry);
        }
      });
    }

    // Process Railway Chapters (low priority since API is flaky)
    const railwayList = railwayData?.ch_list || railwayData?.chapters || [];
    railwayList.forEach((ch: any) => {
      const num = parseFloat(ch.chapter_number || ch.ch);
      if (!isNaN(num)) {
        const slugStr = ch.chapter_id || ch.id || ch.slug || ch.chapter_slug || '';
        const entry = combinedMap.get(num) || { ...ch, provider: 'railway' };
        entry.railway_slug = slugStr;
        combinedMap.set(num, entry);
      }
    });

    // Fill gaps from MangaDex
    if (Array.isArray(mdData)) {
      mdData.forEach((ch: any) => {
        const num = parseFloat(ch.attributes?.chapter);
        if (!isNaN(num)) {
          const entry = combinedMap.get(num) || {
            ch_title: `Chapter ${num}${ch.attributes?.title ? ' - ' + ch.attributes.title : ''}`,
            chapter_number: num.toString(),
            slug: ch.id,
            time: ch.attributes?.publishAt || '',
            provider: 'mangadex',
            isFallback: true
          };
          entry.mangadex_slug = ch.id;
          combinedMap.set(num, entry);
        }
      });
    }

    // Sort ascending (lowest chapter first)
    const mergedList = Array.from(combinedMap.values()).sort((a, b) => {
      const aNum = parseFloat(a.chapter_number) || 0;
      const bNum = parseFloat(b.chapter_number) || 0;
      return aNum - bNum;
    });

    console.log(`Merged totally: ${mergedList.length} chapters (Railway: ${railwayList.length}, MD: ${mdData?.length||0}, WC: ${wcData?.length||0}, CK: ${ckData?.length||0})`);
    
    return { 
      ch_list: mergedList, 
      total_chapters: mergedList.length, 
      first_chapter: mergedList[0]?.chapter_number, 
      last_chapter: mergedList[mergedList.length - 1]?.chapter_number 
    };

  } catch (e) {
    console.error('Chapter merging failed:', e);
    return { ch_list: [], total_chapters: 0 };
  }
}

export const getMangaDetail = async (slug: string) => {
  try {
    const data = await apiFetch(`${BASE}/api/info/${slug}`);
    return data;
  } catch (err) {
    console.warn("Railway info API network failure for", slug);
    throw err;
  }
};

export const getChapterPages = async (mangaSlug: string, chapterSlug: any) => {
  const fallbackOrder = ['comick', 'weebcentral', 'mangadex', 'railway'];
  
  const sources = typeof chapterSlug === 'object' ? {
    comick: chapterSlug.comick_slug,
    weebcentral: chapterSlug.weebcentral_slug,
    mangadex: chapterSlug.mangadex_slug,
    railway: chapterSlug.railway_slug || chapterSlug.slug || (chapterSlug.provider === 'railway' ? chapterSlug.slug : null),
  } : {
    [chapterSlug?.provider || 'railway']: typeof chapterSlug === 'string' ? chapterSlug : chapterSlug?.slug || ''
  };

  for (const provider of fallbackOrder) {
    const slug = sources[provider as keyof typeof sources];
    if (!slug) continue;
    
    console.log(`Trying ${provider} API for chapter pages, slug: ${slug}`);
    
    try {
      if (provider === 'comick') {
        const data = await cachedFetch(`/api/comick/pages?id=${encodeURIComponent(slug)}`).then(r => r.json());
        if (data?.length > 0) return data.map((p: any) => p.img);
      }
      
      if (provider === 'weebcentral') {
        const data = await cachedFetch(`/api/weebcentral/pages?id=${encodeURIComponent(slug)}`).then(r => r.json());
        if (data?.length > 0) return data.map((p: any) => p.img);
      }
      
      if (provider === 'mangadex') {
        const data = await cachedFetch(`https://api.mangadex.org/at-home/server/${slug}`).then(r => r.json());
        if (data?.chapter?.data?.length > 0) {
          return data.chapter.data.map((f: string) => `${data.baseUrl}/data/${data.chapter.hash}/${f}`);
        }
      }
      
      if (provider === 'railway') {
        const data = await cachedFetch(`${BASE}/api/chapter/${slug}`).then(r => r.json());
        const pages = data?.chapters || data?.pages || data?.images || [];
        if (pages.length > 0) return pages.map((p: any) => p.ch || p.img || p.url || p);
        
        // --- 🟢 NEW: Direct MangaDex fallback if Railway returns empty and the slug is a UUID ---
        if (slug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
          console.log(`[Railway Empty] Falling back to MangaDex directly for UUID: ${slug}`);
          try {
            const data = await cachedFetch(`https://api.mangadex.org/at-home/server/${slug}`).then(r => r.json());
            if (data?.chapter?.data?.length > 0) {
              return data.chapter.data.map((f: string) => `${data.baseUrl}/data/${data.chapter.hash}/${f}`);
            }
          } catch(err) {
            console.error("MangaDex direct fallback failed", err);
          }
        }
      }
    } catch (e: any) {
       console.error(`Failed loading from ${provider}:`, e.message);
    }
  }

  // Fallback for primitive string calls or unknowns
  if (typeof chapterSlug === 'string' || (chapterSlug?.slug && !sources.comick && !sources.weebcentral && !sources.mangadex && !sources.railway)) {
    const slug = typeof chapterSlug === 'string' ? chapterSlug : chapterSlug.slug;
    try {
      const data = await cachedFetch(`${BASE}/api/chapter/${slug}`).then(r => r.json());
      const pages = data?.chapters || data?.pages || data?.images || [];
      if (pages.length > 0) return pages.map((p: any) => p.ch || p.img || p.url || p);
    } catch (e) { }
  }

  return [];
};

export function browse(page=1, filters: {
  type?: string, status?: string, sort?: string, genre?: string
} = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.genre) params.set('genre', filters.genre);
  return apiFetch(`${BASE}/api/browse/${page}?${params.toString()}`);
}

function similarity(s1: string, s2: string) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  let longerLength = longer.length;
  if (longerLength == 0) return 1.0;
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength as any);
}

function editDistance(s1: string, s2: string) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  let costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export async function searchManga(query: string, page=1) {
  if (!query.trim()) return { list: [], total: 0 };
  
  const promises = [];
  const baseReq = apiFetch(`${BASE}/api/search/${encodeURIComponent(query.trim())}?page=${page}`).catch(() => ({list: []}));
  promises.push(baseReq);
  
  if (page === 1) { 
    // Enhance search with MangaDex alternative titles for accuracy
    const mdReq = fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(query.trim())}&limit=3`)
      .then(r => r.json())
      .catch(() => null);
      
    const mdRes = await mdReq;
    if (mdRes?.data?.length) {
      const altTitles = new Set<string>();
      for (const m of mdRes.data) {
         if (m.attributes.title.en) altTitles.add(m.attributes.title.en);
         if (m.attributes.title['ja-ro']) altTitles.add(m.attributes.title['ja-ro']);
         if (m.attributes.title['ko-ro']) altTitles.add(m.attributes.title['ko-ro']);
         m.attributes.altTitles?.forEach((a: any) => {
            if (a.en) altTitles.add(a.en);
         });
      }
      
      const qLower = query.trim().toLowerCase();
      const uniqueAlts = Array.from(altTitles)
        .filter(t => t.toLowerCase() !== qLower && t.length > 3)
        .slice(0, 3);
      
      for (const alt of uniqueAlts) {
         promises.push(apiFetch(`${BASE}/api/search/${encodeURIComponent(alt)}?page=1`).catch(() => ({list: []})));
      }
    }
  }

  const results = await Promise.all(promises);
  const allItems: MangaItem[] = [];
  for (const r of results) {
     if (r?.list) allItems.push(...r.list);
     else if (r?.results) allItems.push(...r.results);
  }

  // deduplicate
  const seenMap = new Map();
  for (const item of allItems) {
     const id = item.slug || item.id;
     if (id && !seenMap.has(id)) {
        seenMap.set(id, item);
     }
  }

  const uniqueItems = Array.from(seenMap.values());
  
  // Sort by similarity to query to improve relevance
  uniqueItems.sort((a, b) => {
     const aTitle = (a.title || '').toLowerCase();
     const bTitle = (b.title || '').toLowerCase();
     const qLower = query.toLowerCase();
     
     if (aTitle === qLower && bTitle !== qLower) return -1;
     if (bTitle === qLower && aTitle !== qLower) return 1;
     
     const aContains = aTitle.includes(qLower);
     const bContains = bTitle.includes(qLower);
     if (aContains && !bContains) return -1;
     if (bContains && !aContains) return 1;

     return similarity(bTitle, qLower) - similarity(aTitle, qLower);
  });
  
  return { list: uniqueItems, total: uniqueItems.length };
}

export async function downloadChapterPages(mangaSlug: string, chapterSlug: any): Promise<boolean> {
  try {
    const pages = await getChapterPages(mangaSlug, chapterSlug);
    if (!pages || pages.length === 0) return false;

    if (typeof caches !== 'undefined') {
      const cache = await caches.open('manhwahub-cache');
      
      const promises = pages.map(async (page: any) => {
        let rawUrl = typeof page === 'string' ? page : (page.ch || page.img || page.url || '');
        if (rawUrl.startsWith('//')) rawUrl = 'https:' + rawUrl;
        else if (rawUrl.startsWith('/')) {
           if (rawUrl.includes('data')) rawUrl = 'https://uploads.mangadex.org' + rawUrl;
           else if (rawUrl.includes('weebcentral') || rawUrl.includes('planeptune')) rawUrl = 'https://weebcentral.com' + rawUrl;
           else rawUrl = 'https://comick.art' + rawUrl;
        } else if (rawUrl && !rawUrl.startsWith('http')) {
           rawUrl = 'https://' + rawUrl;
        }

        const proxyUrl = rawUrl.includes('/api/proxy') ? rawUrl : `/api/proxy/image?url=${encodeURIComponent(rawUrl)}`;
        
        try {
          const res = await fetch(proxyUrl);
          if (res.ok) {
            await cache.put(proxyUrl, res.clone());
          }
        } catch (e) {
          console.warn("Failed to cache page", proxyUrl, e);
        }
      });

      await Promise.allSettled(promises);
      return true;
    }
    return false;
  } catch(e) {
    console.error("Failed to download chapter", e);
    return false;
  }
}

import { storageService } from './storage';

export const checkBookmarksForUpdates = async () => {
  const bookmarks = storageService.getBookmarks();
  if (bookmarks.length === 0) return;

  const promises = bookmarks.map(async (bm) => {
    try {
      const info = await getMangaDetail(bm.id);
      const chapters = await getChapters(info);
      const currentTotal = chapters.total_chapters || chapters.ch_list?.length || 0;
      
      if (bm.totalChapters !== undefined && currentTotal > bm.totalChapters) {
         storageService.updateBookmark(bm.id, { totalChapters: currentTotal, hasNewChapters: true });
      } else if (bm.totalChapters === undefined) {
         storageService.updateBookmark(bm.id, { totalChapters: currentTotal });
      }
    } catch (e) {
      console.warn("Failed to check updates for", bm.id);
    }
  });

  await Promise.allSettled(promises);
};

export function formatDate(d: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch { return ''; }
}

export function timeAgo(d: string) {
  if (!d) return '';
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days/7)}w ago`;
  if (days < 365) return `${Math.floor(days/30)}mo ago`;
  return `${Math.floor(days/365)}y ago`;
}
