import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Bookmark, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Manga } from '../types/mangadex';
import { mangadexApi } from '../services/mangadex';
import { cn } from '../lib/utils';

interface HeroProps {
  manga: Manga;
}

export default function Hero({ manga }: HeroProps) {
  if (!manga) return null;

  const { title, description, originalLanguage } = manga.attributes;
  const coverRel = manga.relationships.find(r => r.type === 'cover_art');
  const coverFileName = coverRel?.attributes?.fileName;
  const coverUrl = coverFileName ? mangadexApi.getCoverUrl(manga.id, coverFileName) : '';

  const displayTitle = title.en || Object.values(title)[0] || 'Unknown Title';
  const displayDesc = description.en || Object.values(description)[0] || 'No description available.';

  return (
    <div className="relative h-[80vh] w-full flex items-center px-6 md:px-12 overflow-hidden bg-background">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={coverUrl || undefined}
          alt=""
          className="w-full h-full object-cover object-center opacity-30 blur-[2px] scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-background to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl w-full">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="space-y-6"
        >
          <div className="flex items-center gap-3">
             <span className="bg-brand text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-[3px]">
               Featured
             </span>
             <span className="text-muted text-[10px] font-bold uppercase tracking-[3px] border-l border-border-line pl-3">
               {originalLanguage === 'ko' ? 'Manhwa' : originalLanguage === 'ja' ? 'Manga' : 'Manhua'}
             </span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-gradient">
            {displayTitle}
          </h1>

          <p className="text-muted text-base md:text-lg max-w-2xl line-clamp-3 font-medium leading-relaxed">
            {displayDesc}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              to={`/manhwa/${manga.id}`}
              className="bg-brand text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-[2px] flex items-center gap-2 hover:bg-brand/80 transition-all hover:scale-105 shadow-xl shadow-brand/20"
            >
              <Play size={18} fill="currentColor" />
              READ NOW
            </Link>
            <button className="bg-surface/50 backdrop-blur-md border border-border-line text-content px-8 py-4 rounded-xl font-black uppercase text-xs tracking-[2px] flex items-center gap-2 hover:bg-surface transition-all">
              <Bookmark size={18} />
              BOOKMARK
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Right side floating card */}
      <div className="hidden xl:flex absolute right-12 top-1/2 -translate-y-1/2 z-10">
        <motion.div
           initial={{ opacity: 0, scale: 0.9, x: 50 }}
           animate={{ opacity: 1, scale: 1, x: 0 }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="w-[320px] aspect-[2/3] rounded-3xl overflow-hidden glass-card shadow-2xl relative group"
        >
          <img
            src={coverUrl || undefined}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </motion.div>
      </div>
    </div>
  );
}
