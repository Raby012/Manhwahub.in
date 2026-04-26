import React, { useEffect, useState, useRef } from 'react';
import { getTags, MangaItem, browse, searchManga } from '../services/api';
import MangaCard from '../components/MangaCard';
import { useSearchParams } from 'react-router-dom';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || '';
  const initialGenre = searchParams.get('genre') || '';
  const initialStatus = searchParams.get('status') || '';
  const initialSort = searchParams.get('sort') || 'popular';
  
  const [filters, setFilters] = useState({
    type: initialType, status: initialStatus, sort: initialSort, genre: initialGenre
  });
  const [query, setQuery] = useState(initialQuery);
  const [inputVal, setInputVal] = useState(initialQuery);
  
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MangaItem[]>([]);
  const [tags, setTags] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Load tags for genre filter
  useEffect(() => {
    getTags().then((d: any) => {
      if (Array.isArray(d?.list)) {
        setTags(d.list.filter((t: any) => t.group === 'genre'));
      }
    }).catch(console.error);
  }, []);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.type) params.set('type', filters.type);
    if (filters.genre) params.set('genre', filters.genre);
    if (filters.status) params.set('status', filters.status);
    if (filters.sort !== 'popular') params.set('sort', filters.sort);
    setSearchParams(params, { replace: true });
  }, [query, filters, setSearchParams]);

  // Reset when filters change
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [filters, query]);

  useEffect(() => {
    const load = async () => {
      if (!hasMore) return;
      setLoading(true);
      try {
        let newItems: any[] = [];
        if (query.length >= 2) {
          const res = await searchManga(query, page);
          newItems = res?.list || res?.results || [];
        } else {
          const res = await browse(page, filters);
          newItems = res?.list || [];
        }
        
        if (!Array.isArray(newItems) || newItems.length === 0) {
          setHasMore(false);
        } else {
          setItems(prev => {
            const currentIds = new Set(prev.map((i: any) => i.slug || i.id));
            const uniqueNew = newItems.filter((i: any) => !currentIds.has(i.slug || i.id));
            return [...prev, ...uniqueNew];
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters, page, query, hasMore]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(prev => prev + 1);
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) observerRef.current.observe(loaderRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-28">
      <style>{`
        .filter-group { margin-bottom: 24px; }
        .filter-group label { display: block; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin-bottom: 8px; }
        .pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .pills button {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          text-transform: capitalize;
          transition: all 0.2s;
        }
        .pills button.active, .pills button:hover {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }
        .sort-select {
          background: var(--card); color: var(--text); border: 1px solid var(--border);
          padding: 8px 16px; border-radius: 8px; outline: none; cursor: pointer; font-weight: 600;
        }
      `}</style>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <h1 className="text-content text-2xl md:text-3xl lg:text-4xl font-black mb-6">Browse Library</h1>

        <div className="bg-card p-4 md:p-6 lg:p-8 rounded-2xl border border-border-line mb-8 shadow-lg shadow-black/20">
          
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6">
             <input 
               type="text" 
               placeholder="Search manga, characters, authors..."
               value={inputVal}
               onChange={e => setInputVal(e.target.value)}
               onKeyDown={e => { if(e.key === 'Enter') setQuery(inputVal) }}
               className="flex-1 px-5 py-3 md:py-4 rounded-xl border border-border-line bg-background text-content placeholder:text-muted focus:outline-none focus:border-brand/50 transition-colors"
             />
             <button 
               onClick={() => setQuery(inputVal)}
               className="bg-brand text-white px-8 py-3 md:py-4 rounded-xl font-black transition-all hover:bg-brand/90 hover:scale-[1.02] active:scale-[0.98]"
             >Search</button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-wrap mb-6">
            {/* TYPE FILTER */}
            <div className="filter-group">
              <label>Type</label>
              <div className="pills">
                {['', 'manhwa', 'manga', 'manhua'].map(t => (
                  <button 
                    key={t}
                    className={filters.type === t ? 'active' : ''}
                    onClick={() => setFilters({...filters, type: t})}
                  >
                    {t || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* STATUS FILTER */}
            <div className="filter-group">
              <label>Status</label>
              <div className="pills">
                {['', 'ongoing', 'completed', 'hiatus'].map(s => (
                  <button
                    key={s}
                    className={filters.status === s ? 'active' : ''}
                    onClick={() => setFilters({...filters, status: s})}
                  >
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* SORT FILTER */}
            <div className="filter-group">
              <label>Sort By</label>
              <select className="sort-select" value={filters.sort} onChange={e => setFilters({...filters, sort: e.target.value})}>
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated</option>
                <option value="latest">Latest Update</option>
                <option value="new">Newest</option>
                <option value="az">A-Z</option>
              </select>
            </div>
          </div>

          {/* GENRE FILTER */}
          <div className="filter-group" style={{ marginBottom: 0 }}>
            <label>Genre</label>
            <div className="pills genre-pills" style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '8px' }}>
              <button className={!filters.genre ? 'active' : ''} onClick={() => setFilters({...filters, genre: ''})}>All Genres</button>
              {tags.map(tag => (
                <button
                  key={tag.id}
                  className={filters.genre === tag.id ? 'active' : ''}
                  onClick={() => setFilters({...filters, genre: tag.id})}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ fontWeight: 700, color: 'var(--muted)' }}>
              Showing {items.length} results
            </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
          gap: '16px' 
        }}>
          {items.map((manga, i) => (
             <div key={`${manga.slug || manga.id}-${i}`} style={{ display: 'flex', justifyContent: 'center' }}>
               <MangaCard manga={manga} />
             </div>
          ))}
        </div>

        <div ref={loaderRef} style={{ padding: '40px 0', textAlign: 'center' }}>
          {loading && (
            <div style={{ display: 'inline-block' }}>
               <div className="w-8 h-8 mx-auto border-4 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin" />
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: 800 }}>All caught up! ✓</p>
          )}
        </div>
      </div>
    </div>
  );
}
