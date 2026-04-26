import { getMangaDetail, searchManga } from './src/services/api.ts';

function similarity(s1: string, s2: string) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  let longerLength = longer.length;
  if (longerLength == 0) return 1.0;
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength as any);
}

function editDistance(s1: string, s2: string) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  let costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

async function searchRobust(query: string, page = 1) {
  const promises = [];
  promises.push(searchManga(query, page));
  
  if (page === 1) { // Only do alt titles on page 1
    const mdRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=3`).then(r=>r.json()).catch(()=>null);
    if (mdRes?.data?.length) {
      const altTitles = new Set<string>();
      for (const m of mdRes.data) {
         if (m.attributes.title.en) altTitles.add(m.attributes.title.en);
         if (m.attributes.title['ja-ro']) altTitles.add(m.attributes.title['ja-ro']);
         if (m.attributes.title['ko-ro']) altTitles.add(m.attributes.title['ko-ro']);
         m.attributes.altTitles.forEach((a: any) => {
            if (a.en) altTitles.add(a.en);
         });
      }
      
      const qLower = query.toLowerCase();
      // Remove query itself from altTitles
      const uniqueAlts = Array.from(altTitles).filter(t => t.toLowerCase() !== qLower);
      
      for (const alt of uniqueAlts.slice(0, 3)) {
         promises.push(searchManga(alt, 1).catch(() => ({list: []})));
      }
    }
  }

  const results = await Promise.all(promises);
  let allItems = [];
  for (const r of results) {
     if (r?.list) allItems.push(...r.list);
  }

  // dedup
  const seenMap = new Map();
  for (const item of allItems) {
     const id = item.slug || item.id;
     if (!seenMap.has(id)) {
        seenMap.set(id, item);
     }
  }

  const uniqueItems = Array.from(seenMap.values());
  
  // Sort by similarity to query
  uniqueItems.sort((a, b) => {
     // match query in titles
     const aTitle = a.title.toLowerCase();
     const bTitle = b.title.toLowerCase();
     const qLower = query.toLowerCase();
     
     // Exact match
     if (aTitle === qLower) return -1;
     if (bTitle === qLower) return 1;
     
     // Contains match
     if (aTitle.includes(qLower) && !bTitle.includes(qLower)) return -1;
     if (bTitle.includes(qLower) && !aTitle.includes(qLower)) return 1;

     return similarity(bTitle, qLower) - similarity(aTitle, qLower);
  });
  
  return { list: uniqueItems, total: uniqueItems.length };
}

async function main() {
  const t = await searchRobust("martial peak");
  console.log(t.list.map(x=>x.title));
}
main();
