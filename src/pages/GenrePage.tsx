import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getByGenre, MangaItem } from '../services/api';
import MangaCard from '../components/MangaCard';

export default function GenrePage() {
  const { tagId } = useParams<{ tagId: string }>();
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name') || tagId;
  const [items, setItems] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        if(tagId) {
          const res = await getByGenre(tagId, page);
          setItems(Array.isArray(res?.list) ? res.list : []);
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tagId, page]);

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: '0 0 24px', letterSpacing: '-0.5px' }}>
          Genre: <span style={{ color: '#a855f7' }}>{name?.toUpperCase()}</span>
        </h1>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', flexDirection: 'column', gap: '16px' }}>
            <div className="w-12 h-12 border-4 border-[#a855f7]/20 border-t-[#a855f7] rounded-full animate-spin" />
            <div style={{ color: '#a855f7', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px' }}>LOADING</div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: '#ffb86c', background: '#161616', borderRadius: '16px', border: '1px solid #2a2a2a' }}>
             <p style={{ fontWeight: 800, fontSize: '18px', margin: 0 }}>No manhwa found for this genre.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
            {items.map((manga, i) => (
              <div key={`${manga.slug || manga.id}-${i}`} style={{ display: 'flex', justifyContent: 'center' }}>
                <MangaCard manga={manga} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && items.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
             <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
               style={{ background: page === 1 ? '#1f1f1f' : '#2a2a2a', color: page === 1 ? '#666' : 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 800, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
               PREV
             </button>
             <button onClick={() => setPage(page + 1)} disabled={items.length < 50}
               style={{ background: items.length < 50 ? '#1f1f1f' : '#2a2a2a', color: items.length < 50 ? '#666' : 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 800, cursor: items.length < 50 ? 'not-allowed' : 'pointer' }}>
               NEXT
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
