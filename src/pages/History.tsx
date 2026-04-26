import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Play, Trash2 } from 'lucide-react';
import { storageService, ReadingHistory } from '../services/storage';
import { motion } from 'motion/react';

export default function History() {
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial paint with cache
    setHistory(storageService.getHistory());
    
    // Check MongoDB backend
    storageService.fetchHistory().then(remoteHistory => {
      setHistory(remoteHistory);
      setLoading(false);
    });
  }, []);

  const clearHistory = () => {
    storageService.clearHistory();
    setHistory([]);
  };

  return (
    <div className="pt-24 pb-20 px-6 md:px-12 max-w-[1000px] mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Reading History</h1>
          <p className="text-muted font-medium">Pick up where you left off</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[2px] text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} /> Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-40 bg-surface/30 rounded-3xl border border-dashed border-border-line">
           <HistoryIcon size={48} className="mx-auto text-muted/30 mb-6" />
           <h2 className="text-2xl font-bold mb-2">No history recorded</h2>
           <p className="text-muted mb-8">Start reading to track your progress.</p>
           <Link to="/" className="bg-brand text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-[2px] inline-block">
             Start Reading
           </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, i) => (
            <motion.div
              key={`${item.mangaId}-${item.chapterId}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group p-4 bg-card/40 border border-white/5 rounded-2xl hover:bg-card hover:border-brand/30 transition-all flex flex-col sm:flex-row items-center gap-6"
            >
              <Link to={`/manhwa/${item.mangaId}`} className="w-20 h-28 flex-shrink-0 bg-surface rounded-xl overflow-hidden border border-white/5">
                 <img src={item.cover || undefined} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              </Link>

              <div className="flex-grow space-y-2 text-center sm:text-left">
                 <div className="text-[10px] font-black text-brand uppercase tracking-widest">
                   CH. {item.chapterNumber} • {new Date(item.timestamp).toLocaleDateString()}
                 </div>
                 <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-brand transition-colors truncate max-w-md">
                   {item.title}
                 </h3>
                 <p className="text-xs text-muted font-bold uppercase tracking-wider">
                   Last read {new Date(item.timestamp).toLocaleTimeString()}
                 </p>
              </div>

              <Link
                to={`/read/${item.mangaId}/${item.chapterId}`}
                className="bg-brand/10 text-brand px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-[2px] hover:bg-brand hover:text-white transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Play size={14} fill="currentColor" />
                CONTINUE
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
