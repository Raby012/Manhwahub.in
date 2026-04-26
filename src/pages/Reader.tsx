import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMangaDetail, getChapterPages, BASE } from '../services/api';
import { storageService } from '../services/storage';
import type { ReadingHistory } from '../services/storage';

export default function Reader() {
  const { mangaId } = useParams<{ mangaId: string }>();
  const params = useParams();
  const chapterId = params['*'] || '';
  const navigate = useNavigate();
  const [pages, setPages] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [chapterNum, setChapterNum] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [prevChapterSlug, setPrevChapterSlug] = useState<string | null>(null);
  const [nextChapterSlug, setNextChapterSlug] = useState<string | null>(null);
  
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const fetchPages = async () => {
      setLoading(true);
      setCurrentPage(1); // Reset page on chapter change
      setPrevChapterSlug(null);
      setNextChapterSlug(null);
      try {
        if (mangaId && chapterId) {
          // 1. Fetch detail first to find the chapter object (with its slugs for different scrapers)
          const detail = await getMangaDetail(mangaId);
          // Fetch the merged chapters list to find our exact chapter slugs!
          const { ch_list: mergedList } = await import('../services/api').then(m => m.getChapters({ id: mangaId, title: detail.title || detail.page }));
          let chapterObj: any = chapterId; // fallback string

          // Search for this chapterId in the merged chapter list
          let foundIndex = -1;
          let found = mergedList.find((c: any, index: number) => {
            const isMatch = c.slug === chapterId || 
              c.comick_slug === chapterId || 
              c.weebcentral_slug === chapterId || 
              c.mangadex_slug === chapterId || 
              c.railway_slug === chapterId;
            if (isMatch) foundIndex = index;
            return isMatch;
          });
          
          if (!found) {
            // Check history for this stale chapter slug
            try {
              const histList = await import('../services/storage').then(s => s.storageService.getHistory());
              const staleItem = histList.find((h: any) => h.chapterId === chapterId && h.mangaId === mangaId);
              if (staleItem && staleItem.chapterNumber) {
                // Find chapter with same number
                const newMatchingChapter = mergedList.find((c: any) => c.chapter_number?.toString() === staleItem.chapterNumber.toString() || parseFloat(c.chapter_number) === parseFloat(staleItem.chapterNumber));
                if (newMatchingChapter && newMatchingChapter.slug) {
                  found = newMatchingChapter;
                  foundIndex = mergedList.indexOf(newMatchingChapter);
                  chapterObj = newMatchingChapter;
                  window.history.replaceState(null, '', `/read/${mangaId}/${newMatchingChapter.slug}`);
                }
              }
            } catch(hc) {
              console.error('History cross-reference failed', hc);
            }
          } else {
            chapterObj = found;
          }
          
          if (foundIndex !== -1) {
             setPrevChapterSlug(mergedList[foundIndex - 1]?.slug || null);
             setNextChapterSlug(mergedList[foundIndex + 1]?.slug || null);
          }

          console.log('Raw chapter object from getChapters (chapterObj):', chapterObj);

          // 2. Fetch pages using the rich chapter object
          const data = await getChapterPages(mangaId, chapterObj);
          
          console.log('Raw pages array before mapping:', data);

          
          // If fallback returns array directly
          const isArray = Array.isArray(data);
          const chaptersList = isArray ? data : (data.chapters || []);
          console.log('Chapters list to display:', chaptersList);
          setPages(chaptersList);
          setTotalPages(isArray ? data.length : (data.total_pages || chaptersList.length || 0));
          setChapterNum(isArray ? '' : (data.chapter_number || ''));

          try {
            const title = detail.page || detail.title || mangaId;
            let cover = detail.poster || detail.thumb || detail.image || '';
            if (cover.includes('e7e5e267-502f-4b77-9f19-b7ea1344f68f')) {
              cover = 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx31706-LBBp2zE7iMps.jpg';
            }

            storageService.saveProgress({
              mangaId,
              chapterId,
              source: 'guest',
              chapterNumber: data.chapter_number || '0',
              page: currentPage,
              timestamp: Date.now(),
              title,
              cover
            });
          } catch(e) {
            console.error("Failed to save history: ", e);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPages();
  }, [mangaId, chapterId]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = entry.target.getAttribute('data-index');
          if (index) {
            setCurrentPage(parseInt(index, 10));
          }
        }
      });
    }, {
      threshold: 0.5
    });

    const elements = document.querySelectorAll('.page-img');
    elements.forEach(el => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [pages]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: '16px' }}>
         <div className="w-12 h-12 border-4 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin" />
         <div style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px' }}>LOADING</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-background/90 backdrop-blur-md border-b border-border-line px-4 md:px-6 py-3 md:py-4 z-50 flex justify-between items-center text-white">
        <button 
          onClick={() => navigate(`/manhwa/${mangaId}`)}
          className="flex items-center gap-2 font-bold hover:text-brand transition-colors w-[30%] sm:w-1/3"
        >
          <span className="text-xl">←</span> <span className="hidden sm:inline">Back</span>
        </button>
        <div className="text-center w-[40%] sm:w-1/3 font-bold text-sm truncate px-2 text-content flex justify-center items-center">
           <h2 className="text-sm font-bold m-0 truncate">
             {chapterNum && chapterNum !== '0' ? `Chapter ${chapterNum}` : `${(chapterId || '').replace(/-/g, ' ')}`}
             <span className="text-muted ml-2 hidden sm:inline">· {totalPages} pages</span>
           </h2>
        </div>
        <div className="flex justify-end gap-2 sm:gap-3 w-[30%] sm:w-1/3">
          {prevChapterSlug && (
             <button 
               onClick={() => navigate(`/read/${mangaId}/${prevChapterSlug}`)} 
               className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-surface hover:bg-card border border-border-line transition-all active:scale-95 flex-shrink-0" title="Previous Chapter"
             >
               <span className="text-lg leading-none">←</span>
             </button>
          )}
          {nextChapterSlug && (
             <button 
               onClick={() => navigate(`/read/${mangaId}/${nextChapterSlug}`)} 
               className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-surface hover:bg-card border border-border-line transition-all active:scale-95 flex-shrink-0" title="Next Chapter"
             >
               <span className="text-lg leading-none">→</span>
             </button>
          )}
        </div>
      </div>

      {/* Pages Container */}
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '80px', display: 'flex', flexDirection: 'column' }}>
        {pages.length > 0 ? (
          pages.map((page, i) => {
            let rawUrl = typeof page === 'string' ? page : (page.ch || page.img || page.url || '');
            if (rawUrl.startsWith('//')) {
              rawUrl = 'https:' + rawUrl;
            } else if (rawUrl.startsWith('/')) {
              // Construct full url if it misses base
              if (rawUrl.includes('data')) {
                  rawUrl = 'https://uploads.mangadex.org' + rawUrl;
              } else if (rawUrl.includes('weebcentral') || rawUrl.includes('planeptune')) {
                  rawUrl = 'https://weebcentral.com' + rawUrl;
              } else {
                  rawUrl = 'https://comick.art' + rawUrl;
              }
            } else if (rawUrl && !rawUrl.startsWith('http')) {
              // Ensure we prepend https
              rawUrl = 'https://' + rawUrl;
            }

            // Always proxy using the exact pattern requested
            const proxyUrl = rawUrl.includes('/api/proxy') ? rawUrl : `/api/proxy/image?url=${encodeURIComponent(rawUrl)}`;
            
            return (
              <img 
                key={i}
                className="page-img bg-gray-200 dark:bg-gray-800"
                data-index={page.index || i + 1}
                src={proxyUrl}
                alt={`Page ${page.index || i + 1} of ${totalPages}`}
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.includes('/api/proxy')) {
                     target.src = rawUrl;
                  }
                }}
                style={{ width: '100%', maxWidth: '800px', display: 'block', margin: '0 auto', minHeight: '300px' }}
                referrerPolicy="no-referrer"
              />
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            No pages found
          </div>
        )}
      </div>

      {/* Floating Page Counter */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        background: 'var(--card)', color: 'var(--text)',
        padding: '8px 16px', borderRadius: '20px',
        fontWeight: 'bold', fontSize: '14px', zIndex: 100,
        border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}>
        Page {currentPage} / {totalPages}
      </div>

      {/* Bottom Actions */}
      <div className="max-w-[800px] mx-auto px-4 py-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
          {prevChapterSlug && (
             <button 
               onClick={() => navigate(`/read/${mangaId}/${prevChapterSlug}`)} 
               className="flex-1 bg-surface border border-border-line text-white py-4 px-6 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-card transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               ← PREV
             </button>
          )}

          <button 
            onClick={() => navigate(`/manhwa/${mangaId}`)} 
            className="flex-1 bg-brand text-white border-none py-4 px-6 rounded-xl text-sm font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            FINISH
          </button>

          {nextChapterSlug && (
             <button 
               onClick={() => navigate(`/read/${mangaId}/${nextChapterSlug}`)} 
               className="flex-1 bg-surface border border-border-line text-white py-4 px-6 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-card transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               NEXT →
             </button>
          )}
      </div>
    </div>
  );
}
