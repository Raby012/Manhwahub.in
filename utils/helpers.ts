import { stringSimilarity } from 'string-similarity-js';

export function compareTitles(title1: string, title2: string, altTitles: string[] = []): number {
  const t1 = title1.toLowerCase().trim();
  const t2 = title2.toLowerCase().trim();
  
  if (t1 === t2) return 1;
  
  let maxScore = stringSimilarity(t1, t2);
  
  for (const alt of altTitles) {
    const score = stringSimilarity(alt.toLowerCase().trim(), t2);
    if (score > maxScore) maxScore = score;
  }
  
  return maxScore;
}

export function normalizeChapterNumber(chapter: any): number {
  if (typeof chapter === 'number') return chapter;
  if (!chapter) return 0;
  
  const str = String(chapter).trim();
  const match = str.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}
