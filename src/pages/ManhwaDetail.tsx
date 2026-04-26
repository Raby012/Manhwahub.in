import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMangaDetail, getChapters, formatDate, timeAgo, BASE } from '../services/api';
import { storageService } from '../services/storage';
import type { ReadingHistory } from '../services/storage';
import { BookmarkPlus, BookmarkCheck, ArrowDownUp } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ManhwaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<any>(null);
  const [chapterData, setChapterData] = useState<{ ch_list: any[], total_chapters: number, first_chapter?: string, last_chapter?: string }>({ ch_list: [], total_chapters: 0 });
  const [loading, setLoading] = useState(true);
  const [isSlowLoad, setIsSlowLoad] = useState(false);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [chSearch, setChSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [lastReadProgress, setLastReadProgress] = useState<ReadingHistory | undefined>();

  useEffect(() => {
    if (id) {
      setIsBookmarked(storageService.isBookmarked(id));
      setLastReadProgress(storageService.getMangaProgress(id));
    }
  }, [id]);

  const toggleBookmark = () => {
    if (!detail) return;
    if (isBookmarked && id) {
      storageService.removeBookmark(id);
      setIsBookmarked(false);
    } else if (id) {
      let cover = detail.poster || detail.thumb || detail.image || '';
      if (cover.includes('e7e5e267-502f-4b77-9f19-b7ea1344f68f')) {
        cover = 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx31706-LBBp2zE7iMps.jpg';
      }
      storageService.addBookmark({
        id: id,
        title: detail.page || detail.title || id,
        cover: cover,
        type: detail.type || 'manhwa',
        addedAt: Date.now()
      });
      setIsBookmarked(true);
    }
  };

  useEffect(() => {
    let slowLoadTimer: any;
    const fetchDetail = async () => {
      setLoading(true);
      setIsSlowLoad(false);
      slowLoadTimer = setTimeout(() => setIsSlowLoad(true), 3000);
      try {
        if (id) {
          // Load metadata first
          const info = await getMangaDetail(id);
          setDetail(info);

          // Then load ALL chapters via API
          setChaptersLoading(true);
          setLoading(false); // Stop main loading once detail is fetched
          clearTimeout(slowLoadTimer);
          
          try {
            const chapData = await getChapters(info);
            if (chapData && chapData.ch_list?.length > 0) {
              setChapterData(chapData);
            } else {
               setChapterData({ ch_list: info.ch_list || [], total_chapters: info.total_chapters || 0 });
            }
          } catch (e) {
            console.error('Failed to load merged chapters:', e);
            setChapterData({ ch_list: info.ch_list || [], total_chapters: info.total_chapters || 0 });
          }
          
          setChaptersLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
        setChaptersLoading(false);
        clearTimeout(slowLoadTimer);
      }
    };
    fetchDetail();
    return () => clearTimeout(slowLoadTimer);
  }, [id]);

  if (loading && !detail) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: '16px' }}>
       <div className="w-12 h-12 border-4 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin" />
       <div style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', textAlign: 'center' }}>
         LOADING MANHWA<br /><br />
         {isSlowLoad && <span style={{ color: 'var(--muted)', fontSize: '10px' }}>Waking up server... This might take up to 40 seconds on the first load.</span>}
       </div>
    </div>
  );

  if (!detail) return <div style={{ paddingTop: '100px', textAlign: 'center', color: 'var(--text)' }}>Failed to load.</div>;

  const typeColor: Record<string, string> = {
    MANHWA: 'var(--color-manhwa)',
    MANGA: 'var(--color-manga)',
    MANHUA: 'var(--color-manhua)'
  };
  const color = typeColor[detail.type?.toUpperCase() || 'MANHWA'] || 'var(--accent)';
  
  const statusStr = (detail.status || '').toLowerCase();
  const statusColor = statusStr === 'ongoing' ? 'var(--green)' : statusStr === 'hiatus' ? 'var(--gold)' : 'gray';

  const filteredChapters = (chapterData.ch_list || []).filter((c: any) => 
    (c.chapter_number && String(c.chapter_number).includes(chSearch)) ||
    (c.ch_title && c.ch_title.toLowerCase().includes(chSearch.toLowerCase()))
  ).sort((a: any, b: any) => {
    // Parse chapter numbers safely
    const parseChapNum = (num: any) => {
      if (num == null) return -1;
      const parsed = parseFloat(String(num));
      return isNaN(parsed) ? -1 : parsed;
    };
    
    // Default descending by chapter number (highest first)
    const chapA = parseChapNum(a.chapter_number);
    const chapB = parseChapNum(b.chapter_number);
    
    // Use time if chapter numbers are identical or missing
    if (chapA === chapB) {
      return sortOrder === 'desc' ? b.time - a.time : a.time - b.time;
    }
    
    return sortOrder === 'desc' ? chapB - chapA : chapA - chapB;
  });
  
  const displayChapters = filteredChapters; // Assume they are already descending or handle inside mapping

  function getImage(m: any): string {
    return m?.poster || m?.cover ||
      m?.coverImage?.large ||
      m?.coverImage?.extraLarge ||
      m?.coverImage?.medium ||
      m?.image || m?.cover_small ||
      m?.thumbnail || '';
  }

  let posterImage = getImage(detail);
  if (posterImage?.includes('e7e5e267-502f-4b77-9f19-b7ea1344f68f')) {
      posterImage = `/api/proxy/image?url=` + encodeURIComponent('https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx31706-LBBp2zE7iMps.jpg');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '100px' }}>
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '400px' }}>
        {/* Blurred bg */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url(${posterImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(30px) brightness(0.3)',
          transform: 'scale(1.1)'
        }} />
        {/* Content */}
        <div 
          className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 px-6 pt-32 pb-8 max-w-5xl mx-auto items-center md:items-start text-center md:text-left"
        >
          <img src={posterImage || undefined}
            alt="Poster"
            className="w-40 md:w-48 lg:w-56 shrink-0 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_0_2px_rgba(255,255,255,0.1)] object-cover transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(108,92,231,0.5)]"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if(!target.src.includes('weserv')) {
                target.src = `https://images.weserv.nl/?url=${encodeURIComponent(target.src)}&w=400&output=jpg`;
              }
            }}
          />
          <div className="flex flex-col items-center md:items-start w-full">
            <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
              <div className="bg-[var(--accent)] text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider">
                {detail.type?.toUpperCase() || 'MANHWA'}
              </div>
              <div 
                className="text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider"
                style={{ backgroundColor: statusColor }}
              >
                {detail.status?.toUpperCase() || 'UNKNOWN'}
              </div>
            </div>
            <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-black mb-3 leading-[1.15] tracking-tight line-clamp-3">
              {detail.page || detail.title}
            </h1>
            <p className="text-muted text-sm md:text-base mb-1 font-bold">
              {detail.authors || detail.author || 'Unknown Author'}
            </p>
            {detail.year && (
               <p className="text-muted/70 text-xs md:text-sm mb-4 font-semibold">
                 {detail.year}
               </p>
            )}
            
            {/* Genre tags */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
              {Array.isArray(detail?.genres) ? detail.genres.map((g: string) => (
                <span key={g} className="bg-brand/10 text-brand text-[10px] sm:text-xs px-3 py-1.5 rounded-full border border-brand/30 font-bold uppercase tracking-wider">
                  {g}
                </span>
              )) : null}
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start w-full sm:w-auto">
              {lastReadProgress ? (
                <button 
                  onClick={() => navigate(`/read/${id}/${lastReadProgress.chapterId}`)}
                  className="bg-brand text-white border-none py-3 px-6 rounded-xl text-sm font-black cursor-pointer tracking-widest flex items-center justify-center gap-2 w-full sm:w-auto transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-brand/20"
                >
                  ▶ CONTINUE CH. {lastReadProgress.chapterNumber}
                </button>
              ) : displayChapters.length > 0 ? (
                <button 
                  onClick={() => navigate(`/read/${id}/${displayChapters[0].slug}`)}
                  className="bg-brand text-white border-none py-3 px-6 rounded-xl text-sm font-black cursor-pointer tracking-widest flex items-center justify-center gap-2 w-full sm:w-auto transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-brand/20"
                >
                  ▶ START READING
                </button>
              ) : null}

              <button 
                onClick={toggleBookmark}
                className={cn(
                  "py-3 px-6 rounded-xl text-sm font-black cursor-pointer tracking-widest flex items-center justify-center gap-2 w-full sm:w-auto transition-all active:scale-95",
                  isBookmarked 
                    ? "bg-white/10 text-brand border border-brand/50 hover:bg-white/20" 
                    : "bg-surface text-content border border-border-line hover:border-brand hover:text-brand"
                )}
              >
                {isBookmarked ? <BookmarkCheck size={18} /> : <BookmarkPlus size={18} />}
                {isBookmarked ? 'IN LIBRARY' : 'ADD TO LIBRARY'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }} className="flex flex-col gap-6">
        {/* Description */}
        <div style={{ padding: '24px 20px', background: 'var(--card)', borderRadius: '16px', margin: '16px', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: '1.8', margin: 0, whiteSpace: 'pre-wrap' }}>
            {showFullDesc 
              ? (detail.description || '').replace(/https?:\/\/[^\s]+/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
              : (detail.description || '').replace(/https?:\/\/[^\s]+/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').slice(0, 300) + ((detail.description?.length || 0) > 300 ? '...' : '')}
          </p>
          {detail.description && detail.description.length > 300 && (
            <button onClick={() => setShowFullDesc(!showFullDesc)}
              style={{ color: 'var(--accent)', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', padding: '12px 0 0', marginTop: '8px', fontWeight: '700', display: 'block', width: '100%', textAlign: 'center' }}>
              {showFullDesc ? 'Show Less ↑' : 'Read More ↓'}
            </button>
          )}
        </div>

        {/* Chapter list */}
        <div style={{ padding: '20px 16px' }}>
          {chaptersLoading ? (
            <div style={{textAlign:'center', padding:'24px', color:'#888'}}>
              <div className="animate-spin mb-3 mx-auto" style={{width:32,height:32,border:'3px solid #6c5ce7',borderTopColor:'transparent',borderRadius:'50%'}}></div>
              Fetching all chapters...
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ fontWeight: 700, color: 'white', fontSize: '18px' }}>
                  {chapterData.total_chapters} Chapters
                  {chapterData.first_chapter && ` · Ch.${chapterData.first_chapter} to Ch.${chapterData.last_chapter}`}
                </div>
                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface/80 text-content rounded-lg border border-border-line text-sm font-bold transition-colors"
                >
                  <ArrowDownUp size={16} className={sortOrder === 'asc' ? 'rotate-180' : ''} style={{ transition: 'transform 0.2s' }} />
                  {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                </button>
              </div>
              
              <input
                placeholder="Search chapters..."
                value={chSearch}
                onChange={e => setChSearch(e.target.value)}
                style={{width:'100%',padding:'10px 14px',background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,color:'#fff',marginBottom:12}}
              />
              
              {chapterData.ch_list?.length === 0 && (
                <div style={{padding:24,background:'rgba(255,200,0,0.1)',border:'1px solid rgba(255,200,0,0.3)',borderRadius:12,textAlign:'center'}}>
                  ⚠️ No chapters available. May be licensed or not yet translated.
                </div>
              )}
              
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 custom-scrollbar"
                style={{
                  maxHeight: '600px', 
                  overflowY: 'auto', 
                  paddingRight: '8px'
                }}>
                {filteredChapters.map((ch: any) => {
                  let chDisplay = ch.chapter_number;
                  if (chDisplay === "0" || chDisplay === 0) {
                    chDisplay = "Prologue";
                  } else {
                    chDisplay = `Ch. ${chDisplay}`;
                  }
                  
                  return (
                    <div 
                      key={ch.slug}
                      onClick={() => navigate(`/read/${id}/${ch.slug}`)}
                      className="group flex items-center justify-between p-3 rounded-xl border border-border-line bg-surface hover:bg-card hover:border-brand/50 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
                    >
                      <div className="flex flex-col min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-brand font-black text-sm whitespace-nowrap">{chDisplay}</span>
                          {ch.pages > 0 && (
                            <span className="bg-white/5 text-muted text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest whitespace-nowrap">
                              {ch.pages} p
                            </span>
                          )}
                        </div>
                        <span className="text-content text-xs font-semibold truncate" title={ch.ch_title || `Chapter ${ch.chapter_number}`}>
                          {ch.ch_title || `Chapter ${ch.chapter_number}`}
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-muted/60 text-[10px] font-bold uppercase tracking-wider">{timeAgo(ch.time)}</span>
                        <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-brand/10 flex items-center justify-center mt-1 transition-colors">
                          <ArrowDownUp size={12} className="text-muted group-hover:text-brand -rotate-90 hidden group-hover:block" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
