import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTags } from '../services/api';

export default function Categories() {
  const [tags, setTags] = useState<{ id: string, name: string, group: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getTags();
        const dataList = Array.isArray(res?.list) ? res.list : [];
        // Filter for genres and themes
        const filtered = dataList.filter((t: any) => t.group === 'genre' || t.group === 'theme');
        setTags(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="pt-24 pb-20 px-6 md:px-12 max-w-[1440px] mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 text-white">Categories</h1>
          <p className="font-medium" style={{ color: '#a0a0a0' }}>Find your next favorite series by genre</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh', flexDirection: 'column', gap: '16px' }}>
          <div className="w-12 h-12 border-4 border-[#a855f7]/20 border-t-[#a855f7] rounded-full animate-spin" />
          <div style={{ color: '#a855f7', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px' }}>LOADING</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {tags.map((cat, i) => (
            <Link 
              key={cat.id}
              to={`/browse?genre=${encodeURIComponent(cat.id)}`}
              className="group flex flex-col items-center justify-center p-8 bg-[#161616] border border-[#2a2a2a] rounded-3xl hover:border-[#a855f7] hover:bg-[#1f1f1f] hover:-translate-y-2 transition-all duration-300 shadow-xl"
            >
              <h3 className="font-black uppercase tracking-widest text-sm group-hover:text-[#a855f7] transition-colors text-center text-white">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
