import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AnimatePresence, motion } from 'motion/react';
import { WifiOff } from 'lucide-react';
import { AuthProvider } from './services/AuthContext';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const Browse = lazy(() => import('./pages/Browse'));
const SearchPage = lazy(() => import('./pages/Search'));
const ManhwaDetail = lazy(() => import('./pages/ManhwaDetail'));
const Reader = lazy(() => import('./pages/Reader'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const History = lazy(() => import('./pages/History'));
const Categories = lazy(() => import('./pages/Categories'));
const GenrePage = lazy(() => import('./pages/GenrePage'));

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 bg-red-500/90 text-white rounded-full shadow-lg shadow-red-500/20 backdrop-blur-sm border border-red-400 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
      <WifiOff size={18} />
      <span className="text-sm font-bold tracking-tight">You are offline. Viewing cached content.</span>
    </div>
  );
}

import { checkBookmarksForUpdates } from './services/api';

export default function App() {
  const location = useLocation();
  const isReader = location.pathname.startsWith('/read/');

  useEffect(() => {
    // Check for bookmark updates in background occasionally
    checkBookmarksForUpdates();
    const interval = setInterval(checkBookmarksForUpdates, 1000 * 60 * 60); // every 1 hour
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background selection:bg-brand/30 relative">
      <OfflineIndicator />
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          {!isReader && <Navbar />}
          
          <main className={isReader ? "" : "min-h-screen pb-28 lg:pb-0"}>
          <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-background">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-brand/20 rounded-xl" />
                <div className="absolute inset-0 border-4 border-brand border-t-transparent rounded-xl animate-spin" />
              </div>
            </div>
          }>
            <PageTransition>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/genre/:tagId" element={<GenrePage />} />
                <Route path="/manhwa/:id" element={<ManhwaDetail />} />
                <Route path="/read/:mangaId/*" element={<Reader />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/history" element={<History />} />
                <Route path="*" element={<div className="pt-32 text-center h-[70vh] flex flex-col items-center justify-center font-black uppercase tracking-tighter text-4xl">404 - Not Found</div>} />
              </Routes>
            </PageTransition>
          </Suspense>
        </main>

        {!isReader && (
          <footer className="border-t border-border-line px-6 md:px-12 py-12 bg-surface mt-auto">
            <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="col-span-2 space-y-6">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-gradient">ManhwaHub</h2>
                <p className="text-muted text-sm font-medium leading-relaxed max-w-sm">
                  The ultimate reading experience for Manhwa, Manhua, and Manga. 
                  Fast, responsive, and free forever. Data powered by MangaDex.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[2px] text-content">Navigation</h3>
                <ul className="space-y-2 text-sm text-muted font-bold font-medium tracking-tight">
                  <li><a href="/" className="hover:text-brand transition-colors">Home</a></li>
                  <li><a href="/browse" className="hover:text-brand transition-colors">Browse</a></li>
                  <li><a href="/bookmarks" className="hover:text-brand transition-colors">Bookmarks</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[2px] text-content">Content</h3>
                <ul className="space-y-2 text-sm text-muted font-bold tracking-tight">
                  <li><a href="/browse?type=manhwa" className="hover:text-brand transition-colors">Manhwa</a></li>
                  <li><a href="/browse?type=manhua" className="hover:text-brand transition-colors">Manhua</a></li>
                  <li><a href="/browse?type=manga" className="hover:text-brand transition-colors">Manga</a></li>
                </ul>
              </div>
            </div>
            <div className="max-w-[1440px] mx-auto mt-12 pt-8 border-t border-border-line flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-muted font-black uppercase tracking-[2px]">
              <div>© 2026 MANHWAHUB. ALL RIGHTS RESERVED.</div>
              <div className="flex gap-8">
                <button className="hover:text-brand transition-colors">Privacy Policy</button>
                <button className="hover:text-brand transition-colors">Terms of Service</button>
              </div>
            </div>
          </footer>
        )}
      </div>
    </AuthProvider>
    </div>
  );
}
