import React from 'react';
import { useNavigate } from 'react-router-dom';

const MangaCard: React.FC<{ manga: any }> = ({ manga }) => {
  const navigate = useNavigate();
  
  const typeStr = (manga?.type || '').toUpperCase();
  const typeColor: Record<string, string> = {
    MANHWA: 'var(--color-manhwa)',
    MANGA: 'var(--color-manga)',
    MANHUA: 'var(--color-manhua)'
  };
  const color = typeColor[typeStr] || 'var(--accent)';
  
  const statusStr = (manga?.status || '').toLowerCase();
  const statusColor = statusStr === 'ongoing' ? 'var(--green)' : statusStr === 'hiatus' ? 'var(--gold)' : 'gray';

  let imgUrl = manga?.image || manga?.poster || manga?.cover || manga?.thumbnail;
  if (imgUrl?.includes('e7e5e267-502f-4b77-9f19-b7ea1344f68f')) {
      imgUrl = 'https://uploads.mangadex.org/covers/1044287a-73df-48d0-b0b2-5327f32dd651/e1fab59e-aeaa-4f53-927b-fb82a8995393.jpg.512.jpg';
  }

  return (
    <div 
      onClick={() => navigate(`/manhwa/${manga?.slug || manga?.id}`)}
      className="relative w-full rounded-xl overflow-hidden cursor-pointer bg-card border border-border-line transition-all duration-300 shrink-0 group hover:-translate-y-1.5 hover:border-brand hover:shadow-lg hover:shadow-brand/20 flex flex-col h-full"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] w-full bg-surface shrink-0">
        <img
          src={imgUrl || undefined}
          alt={manga?.title || "Cover"}
          className="w-full h-full object-cover block"
          referrerPolicy="no-referrer"
          onError={e => {
            const target = e.target as HTMLImageElement;
            target.src = `https://placehold.co/160x240/161616/666?text=${encodeURIComponent((manga?.title || '').slice(0,10))}`;
          }}
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 top-[40%] bg-gradient-to-b from-transparent to-card" />
        
        {/* Type badge */}
        <div 
          className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide z-10 shadow-sm"
          style={{ backgroundColor: color }}
        >
          {typeStr || 'UNKNOWN'}
        </div>
        
        {/* Status badge */}
        <div 
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded z-10 shadow-sm"
          style={{ backgroundColor: statusColor }}
        >
          {statusStr.toUpperCase() || 'UNKNOWN'}
        </div>
      </div>
      
      {/* Info */}
      <div className="p-2 sm:p-3 pb-3 flex flex-col grow justify-start bg-card relative z-10 -mt-1 sm:-mt-2">
        <h3 className="text-content text-[11px] sm:text-xs md:text-[13px] font-bold m-0 line-clamp-2 leading-[1.3] break-words">
          {manga?.title || "Unknown Title"}
        </h3>
        <p className="text-muted text-[9px] sm:text-[10px] mt-1 truncate">
          {manga?.author || 'Unknown Author'}
        </p>
      </div>
    </div>
  );
}

export default MangaCard;
