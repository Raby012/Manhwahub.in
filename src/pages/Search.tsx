import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchManga, MangaItem } from '../services/api';
import MangaCard from '../components/MangaCard';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if(query.trim()) {
      const timer = setTimeout(() => handleSearch(query), 500);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await searchManga(q, 1);
      setResults(Array.isArray(res?.list) ? res.list : []);
    } catch(e) {
      console.error(e);
      setResults([]);
    }
    setLoading(false);
  }

  return (
    <div className="bg-[#0d0d0d] min-h-screen pt-24 px-4 pb-28 max-w-[1440px] mx-auto">
      {/* Search input */}
      <h1 className="text-white text-2xl md:text-3xl font-black mb-6 tracking-tight">
        Search
      </h1>
      <div className="flex items-center bg-[#161616] rounded-xl border border-[#2a2a2a] p-3 mb-6 gap-3 transition-colors focus-within:border-brand/50">
        <span className="text-muted text-xl pl-2">🔍</span>
        <input
          autoFocus
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            navigate(`/search?q=${encodeURIComponent(e.target.value)}`, { replace: true });
          }}
          placeholder="Search manhwa, manga, manhua..."
          className="flex-1 bg-transparent border-none text-white text-base md:text-lg focus:outline-none"
        />
        {query && (
          <button onClick={() => {
              setQuery('');
              navigate(`/search?q=`, { replace: true });
              setResults([]);
            }}
            className="text-muted bg-transparent border-none text-xl md:text-2xl cursor-pointer hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-10">
          <div className="w-8 h-8 border-4 border-[#222] border-t-brand rounded-full animate-spin mx-auto" />
          <p className="text-muted text-sm mt-3">
            Searching...
          </p>
        </div>
      )}

      {/* No results */}
      {!loading && query.trim() && results.length === 0 && (
        <div className="text-center py-14 px-5">
          <p className="text-4xl md:text-5xl mb-3">🔍</p>
          <p className="text-white text-lg md:text-xl font-bold mb-2">
            No results found for "{query}"
          </p>
          <p className="text-muted text-sm md:text-base">
            Try a different spelling or search term
          </p>
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && !loading && (
        <>
          <p className="text-muted text-sm mb-4">
            {results.length} results for "{query}"
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 md:gap-4">
            {results.map((manga, i) => (
              <div key={`${manga.slug || manga.id}-${i}`} className="flex justify-center">
                <MangaCard manga={manga} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!query.trim() && (
        <div className="text-center py-14 px-5">
          <p className="text-5xl md:text-6xl mb-4">📚</p>
          <p className="text-white text-lg md:text-xl font-bold mb-0">
            Search for anything
          </p>
          <p className="text-muted text-sm md:text-base mt-2">
            Find your favorite manhwa, manga or manhua
          </p>
        </div>
      )}
    </div>
  );
}
