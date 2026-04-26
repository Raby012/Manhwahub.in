import React from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHome?: boolean;
}

export default function ErrorState({ 
  title = "Something went wrong", 
  message = "We couldn't load the data. This might be due to a temporary network issue or server maintenance.",
  onRetry,
  showHome = true
}: ErrorStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={40} className="text-destructive" />
      </div>
      
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">{title}</h2>
      <p className="text-muted max-w-md mb-8 font-medium leading-relaxed">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-brand/20"
          >
            <RefreshCcw size={16} />
            Try Again
          </button>
        )}
        
        {showHome && (
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-card border border-border-line rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:border-brand active:scale-95"
          >
            <Home size={16} />
            Back Home
          </Link>
        )}
      </div>
    </motion.div>
  );
}
