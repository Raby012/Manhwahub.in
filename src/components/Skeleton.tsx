import React from 'react';
import { cn } from '../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-muted/20 rounded-md", className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[2/3] rounded-xl w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
