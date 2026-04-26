import React, { useEffect, useState, useRef } from 'react';
import { getHome, MangaItem } from '../services/api';
import MangaCard from '../components/MangaCard';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<MangaItem[]>([]);
  const [latest, setLatest] = useState<MangaItem[]>([]);
  const [newArrivals, setNewArrivals] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSlowLoad, setIsSlowLoad] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    let slowLoadTimer: any;
    async function loadData() {
      setLoading(true);
      setIsSlowLoad(false);
      slowLoadTimer = setTimeout(() => setIsSlowLoad(true), 3000);
      try {
        const data = await fetch('https://manhwa-api-production.up.railway.app/api/home').then(r => r.json());
        console.log('HOME DATA:', JSON.stringify(data).slice(0, 500));

        // Handle ALL possible response shapes from AniList/Railway
        const extract = (d: any): any[] => {
          if (Array.isArray(d)) return d;
          if (Array.isArray(d?.data)) return d.data;
          if (Array.isArray(d?.media)) return d.media;
          if (Array.isArray(d?.results)) return d.results;
          if (Array.isArray(d?.list)) return d.list;
          if (Array.isArray(d?.Page?.media)) return d.Page.media;
          return [];
        };

        // Try every possible key for trending/latest
        const trendingData = extract(data?.trending) ||
          extract(data?.popular) ||
          extract(data?.topManga) ||
          extract(data?.data?.trending) ||
          extract(data) || [];

        const latestData = extract(data?.latest) ||
          extract(data?.recentlyUpdated) ||
          extract(data?.data?.latest) ||
          extract(data?.newReleases) || [];

        const newArrivalsData = extract(data?.newArrivals) ||
          extract(data?.new_arrivals) ||
          extract(data?.data?.newArrivals) || [];

        // If home API returns nothing, fallback to Railway
        if (!trendingData.length && !latestData.length) {
          throw new Error('Empty home data');
        }

        setTrending(trendingData);
        setLatest(latestData);
        setNewArrivals(newArrivalsData);

      } catch (e: any) {
        console.log('Railway home failed, trying fallback', e);
        // Use Railway which we know works
        try {
          const [tr, la, na] = await Promise.allSettled([
            fetch('https://manhwa-api-production.up.railway.app/api/trending/1').then(r => r.json()),
            fetch('https://manhwa-api-production.up.railway.app/api/latest/1').then(r => r.json()),
            fetch('https://manhwa-api-production.up.railway.app/api/all/1').then(r => r.json()),
          ]);
          setTrending((tr as any).value?.list || []);
          setLatest((la as any).value?.list || []);
          setNewArrivals((na as any).value?.list || []);
        } catch (err) {
           console.error("Railway also failed", err);
        }
      } finally {
        clearTimeout(slowLoadTimer);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (trending.length > 0) {
      const interval = setInterval(() => {
        setHeroIndex(prev => (prev + 1) % Math.min(8, trending.length));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [trending]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="flex flex-col justify-center items-center h-[50vh] gap-4">
           <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
           <div className="text-brand text-xs font-bold tracking-widest text-center mt-4">
             LOADING MAIN DATA<br /><br />
             {isSlowLoad && <span className="text-muted text-[10px]">Waking up server... This might take up to 40 seconds on the first load.</span>}
           </div>
        </div>
      </div>
    );
  }

  const heroManga = trending[heroIndex];
  const heroList = trending.slice(0, 8);
  
  let heroImage = heroManga?.cover || heroManga?.image || heroManga?.poster;
  if (heroImage?.includes('e7e5e267-502f-4b77-9f19-b7ea1344f68f')) {
    heroImage = 'https://uploads.mangadex.org/covers/1044287a-73df-48d0-b0b2-5327f32dd651/e1fab59e-aeaa-4f53-927b-fb82a8995393.jpg.512.jpg';
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {heroManga && (
        <div className="relative overflow-hidden flex flex-col justify-end min-h-[500px] md:min-h-[600px] px-5 sm:px-6 md:px-12 py-10 md:py-16 pt-24 cursor-default w-full">
          <div 
            className="absolute inset-0 bg-cover bg-[center_20%] brightness-50"
            style={{ backgroundImage: `url(${heroImage})` }} 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent w-[90%] md:w-[80%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent h-[70%] top-auto" />
          
          <div className="relative z-10 flex flex-col sm:flex-row gap-6 md:gap-8 items-center sm:items-end w-full max-w-[1440px] mx-auto mt-auto flex-1">
             <img 
               src={heroImage || undefined} 
               alt="" 
               className="w-32 h-44 sm:w-40 sm:h-56 md:w-56 md:h-80 object-cover rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)] block shrink-0" 
             />
             <div className="pb-2 md:pb-4 max-w-full md:max-w-2xl w-full text-center sm:text-left flex flex-col items-center sm:items-start grow">
               <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-3 leading-[1.1] drop-shadow-2xl line-clamp-2 md:line-clamp-3 tracking-tight">
                 {heroManga.title}
               </h1>
               <div className="flex justify-center sm:justify-start gap-3 md:gap-4 text-[10px] md:text-xs font-bold mb-6 flex-wrap uppercase tracking-wider">
                 <span className="text-green-400 drop-shadow-md bg-green-400/10 px-2 py-1 rounded">MATCH</span>
                 <span className="text-brand drop-shadow-md bg-brand/10 px-2 py-1 rounded border border-brand/20">{heroManga.type || 'MANHWA'}</span>
                 {heroManga.status && <span className="text-blue-400 drop-shadow-md bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20">{heroManga.status}</span>}
               </div>
               <div className="flex flex-col sm:flex-row justify-center sm:justify-start gap-3 inline-flex w-full sm:w-auto">
                  <button 
                    onClick={() => navigate(`/read/${heroManga.slug || heroManga.id}/1`)}
                    className="bg-brand text-white px-8 py-3.5 md:py-4 rounded-xl text-xs md:text-sm tracking-[2px] uppercase font-black flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20 w-full sm:w-auto"
                  >
                    ▶ PLAY
                  </button>
                  <button 
                    onClick={() => navigate(`/manhwa/${heroManga.slug || heroManga.id}`)}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-3.5 md:py-4 rounded-xl text-xs md:text-sm tracking-[2px] uppercase font-black flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all w-full sm:w-auto"
                  >
                    ⓘ MORE INFO
                  </button>
               </div>
             </div>
          </div>

          <div className="absolute bottom-4 md:bottom-8 right-6 md:right-10 flex gap-2 z-10 w-full justify-center md:justify-end md:w-auto">
            {heroList.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setHeroIndex(idx)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full border-none transition-colors duration-300 cursor-pointer ${idx === heroIndex ? 'bg-white' : 'bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-5 md:px-10 pb-10 max-w-[1440px] mx-auto flex flex-col gap-8 md:gap-12 mt-6 md:mt-0">
        {(!trending || trending.length === 0) && (!latest || latest.length === 0) && (!newArrivals || newArrivals.length === 0) ? (
          <div className="text-center py-24 px-5 text-muted">
            <div className="text-5xl md:text-6xl mb-6">📚</div>
            <h2 className="text-2xl md:text-3xl font-black text-content mb-3">Library is Empty</h2>
            <p className="text-sm md:text-base leading-relaxed">
              We couldn't fetch manhwa data from the server at the moment.<br/>
              Please try refreshing the page later.
            </p>
          </div>
        ) : (
          <>
            <SliderSection title="🔥 Trending Now" items={trending} />
            <SliderSection title="🆕 Latest Updates" items={latest} />
            <SliderSection title="✨ New Arrivals" items={newArrivals} />
          </>
        )}
      </div>
    </div>
  );
}

function SliderSection({ title, items }: { title: string, items: MangaItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  
  const scroll = (dir: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col mb-4 md:mb-8">
      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-xl md:text-2xl font-black text-content">{title}</h2>
        <div className="hidden md:flex gap-2">
          <button 
            onClick={() => scroll(-1)}
            className="w-10 h-10 rounded-full bg-card border border-border-line text-content flex items-center justify-center hover:bg-surface hover:scale-105 active:scale-95 transition-all"
          >
            ←
          </button>
          <button 
            onClick={() => scroll(1)}
            className="w-10 h-10 rounded-full bg-card border border-border-line text-content flex items-center justify-center hover:bg-surface hover:scale-105 active:scale-95 transition-all"
          >
            →
          </button>
        </div>
      </div>
      <div className="relative -mx-5 px-5 md:mx-0 md:px-0">
        <div 
          ref={ref} 
          className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4"
        >
          {items.map((manga: any, i: number) => (
            <div key={manga?.slug || manga?.id || i} className="snap-start shrink-0 w-[140px] sm:w-[160px] md:w-[180px]">
              <MangaCard manga={manga} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
