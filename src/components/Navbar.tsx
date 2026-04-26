import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, Bookmark, Flame, History, Compass, Grid, Settings, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { searchManga, MangaItem } from '../services/api';
import { storageService } from '../services/storage';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'id', label: 'Indonesian', flag: '🇮🇩' },
  { code: 'pt-br', label: 'Portuguese (BR)', flag: '🇧🇷' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' }
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MangaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasNewBookmarks, setHasNewBookmarks] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    const checkUpdates = () => setHasNewBookmarks(storageService.getBookmarks().some(b => b.hasNewChapters));
    checkUpdates();
    window.addEventListener('bookmarksUpdated', checkUpdates);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('bookmarksUpdated', checkUpdates);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const delaySearch = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await searchManga(searchQuery);
          const list = Array.isArray(res?.list) ? res.list : [];
          setSearchResults(list.slice(0, 5));
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      }, 500);
      return () => clearTimeout(delaySearch);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setSearchResults([]);
      setIsMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Flame },
    { name: 'Browse', path: '/browse', icon: Compass },
    { name: 'Categories', path: '/categories', icon: Grid },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { name: 'History', path: '/history', icon: History },
  ];

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 md:h-[70px] flex items-center px-4 md:px-8",
        isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border-line shadow-sm" : "bg-transparent"
      )}>
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 md:gap-3 group shrink-0">
            <div className="w-8 h-8 md:w-11 md:h-11 bg-brand rounded-lg md:rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-brand/20">
              <Grid className="text-white w-4 h-4 md:w-6 md:h-6" />
            </div>
            <span className="text-xl md:text-2xl font-black uppercase tracking-tighter text-gradient">
              ManhwaHub
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-grow max-w-xl mx-8 relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Search manhwa, manga, author..."
                className="w-full bg-surface border border-border-line rounded-xl px-12 py-2.5 text-sm focus:outline-none focus:border-brand/50 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </form>

            {/* Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-card border border-border-line rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                {searchResults.map((m) => {
                  return (
                    <Link
                      key={m.slug}
                      to={`/manhwa/${m.slug}`}
                      onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                      className="flex gap-4 p-3 hover:bg-surface transition-colors"
                    >
                      <div className="w-12 h-16 bg-surface rounded-md overflow-hidden flex-shrink-0">
                        { (m.image || m.poster) && <img src={(m.image || m.poster) || undefined} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="font-bold text-sm line-clamp-1">{m.title}</div>
                        <div className="text-xs text-muted uppercase tracking-wider mt-1">
                          {m.type} • {m.status}
                        </div>
                      </div>
                    </Link>
                  );
                })}
                <Link
                  to={`/search?q=${searchQuery}`}
                  className="block text-center p-3 text-xs font-bold text-brand hover:bg-surface transition-colors border-t border-border-line"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                >
                  View all results
                </Link>
              </div>
            )}
          </div>

          {/* Links & Settings */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 shrink-0">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "font-bold uppercase text-[11px] xl:text-[13px] tracking-widest transition-colors hover:text-brand relative flex items-center gap-2",
                  location.pathname === link.path ? "text-brand" : "text-content"
                )}
              >
                {link.name}
                {link.name === 'Bookmarks' && hasNewBookmarks && (
                  <span className="absolute -top-1 -right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" title="New chapters available!" />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-3 shrink-0">
              <button
                className="w-10 h-10 flex items-center justify-center text-content hover:bg-surface rounded-full transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Search size={24} />}
              </button>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-md z-40 p-4 animate-in slide-in-from-top-2 border-b border-border-line shadow-lg">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search manhwa..."
                className="w-full bg-surface border border-border-line rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand/50 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} />
            </form>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <div className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] pointer-events-auto max-w-sm mx-auto overflow-hidden">
          <div className="flex items-center justify-around h-[64px] px-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 group relative",
                    isActive ? "text-brand" : "text-muted hover:text-white"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand rounded-b-full shadow-[0_0_10px_var(--color-brand)]" />
                  )}
                  <div className={cn(
                    "p-1.5 transition-all duration-300 relative z-10 flex min-h-[32px] items-center", 
                    isActive ? "-translate-y-1" : "group-hover:-translate-y-0.5"
                  )}>
                    <link.icon size={20} className={cn("transition-transform", isActive ? "fill-brand/20 drop-shadow-[0_0_8px_rgba(108,92,231,0.5)]" : "")} />
                    {link.name === 'Bookmarks' && hasNewBookmarks && (
                      <span className="absolute 0 top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] tracking-wider transition-all absolute bottom-2 opacity-0 font-bold",
                    isActive ? "opacity-100 translate-y-0 text-brand font-black" : "translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
                  )}>
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
