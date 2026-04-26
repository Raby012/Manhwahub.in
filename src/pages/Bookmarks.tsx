import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Trash2, ArrowRight } from 'lucide-react';
import { storageService, Bookmark as BookmarkType } from '../services/storage';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);

  useEffect(() => {
    const updateBookmarks = () => setBookmarks(storageService.getBookmarks());
    updateBookmarks();
    window.addEventListener('bookmarksUpdated', updateBookmarks);
    return () => window.removeEventListener('bookmarksUpdated', updateBookmarks);
  }, []);

  const removeBookmark = (id: string) => {
    storageService.removeBookmark(id);
    setBookmarks(storageService.getBookmarks());
  };

  return (
    <div className="pt-24 pb-20 px-6 md:px-12 max-w-[1440px] mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">My Library</h1>
          <p className="text-muted font-medium">Continue your reading adventure</p>
        </div>
        <div className="text-xs font-black uppercase tracking-widest text-brand px-4 py-2 bg-brand/10 border border-brand/20 rounded-lg">
          {bookmarks.length} Saved
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-40 bg-surface/50 rounded-3xl border border-dashed border-border-line">
           <Bookmark size={48} className="mx-auto text-muted/30 mb-6" />
           <h2 className="text-2xl font-bold mb-2">Your library is empty</h2>
           <p className="text-muted mb-8">Start exploring and save your favorite series here.</p>
           <Link to="/browse" className="bg-brand text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-[2px] inline-block">
             Explore Now
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {bookmarks.map((manga, i) => (
            <motion.div
              key={manga.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative"
            >
              <Link to={`/manhwa/${manga.id}`} className="block" onClick={() => storageService.updateBookmark(manga.id, { hasNewChapters: false })}>
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-surface border border-border-line mb-3 group-hover:-translate-y-2 transition-transform duration-500">
                  <img src={manga.cover || undefined} alt={manga.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  {manga.hasNewChapters && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-lg animate-pulse z-10">
                      New
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeBookmark(manga.id);
                      }}
                      className="w-full bg-red-500/80 backdrop-blur-md text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 transition-colors"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-brand transition-colors uppercase tracking-tight">
                  {manga.title}
                </h3>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
