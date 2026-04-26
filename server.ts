import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { MANGA } from '@consumet/extensions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

const getRandomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const weebCentral = new MANGA.WeebCentral();
const comick = new MANGA.ComicK();

async function startServer() {
  const app = express();
  app.use(express.json());
  
  // ComicK Fallback API
  app.get('/api/comick/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.json([]);
      const data = await comick.search(query);
      res.json(data.results || []);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/comick/chapters', async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.json([]);

      let page = 1;
      try {
        let allChapters: any[] = [];
        let hasMore = true;

        // Fetch up to 20 pages max
        while (hasMore && page <= 20) {
          const chunk = await (comick as any).fetchAllChapters(id, page);
          if (chunk && chunk.length > 0) {
            const enChapters = chunk.filter((c:any) => c.lang === 'en' || !c.lang).map((c:any) => ({
              id: `${id}/${c.hid}-chapter-${c.chap}-${c.lang ? c.lang : 'en'}`,
              chap: c.chap,
              title: c.title || `Chapter ${c.chap}`,
              releaseDate: c.created_at || c.updated_at
            }));
            allChapters = allChapters.concat(enChapters);
            if (chunk.length < 30) {
              hasMore = false; // Last page
            } else {
              page++;
            }
            await new Promise(r => setTimeout(r, 100));
          } else {
            hasMore = false;
          }
        }
        res.json(allChapters);
      } catch (err: any) {
        console.error('comick fetchAllChapters failed for ', id, ' on page ', page, ':', err.message);
        // Fallback to fetchMangaInfo if fetchAllChapters fails
        const data = await comick.fetchMangaInfo(id);
        res.json(data.chapters || []);
      }
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/comick/pages', async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.json([]);
      const data = await comick.fetchChapterPages(id);
      res.json(data || []);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // WeebCentral Fallback API
  app.get('/api/weebcentral/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.json([]);
      const data = await weebCentral.search(query);
      res.json(data.results || []);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/weebcentral/chapters', async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.json([]);
      const data = await weebCentral.fetchMangaInfo(id);
      res.json(data.chapters || []);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/weebcentral/pages', async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.json([]);
      const data = await weebCentral.fetchChapterPages(id);
      res.json(data || []);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/mangadex/pages', async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.json([]);
      const data = await axios.get(`https://api.mangadex.org/at-home/server/${id}`);
      if (data.data?.chapter?.data) {
        const pages = data.data.chapter.data.map((f: string) => `${data.data.baseUrl}/data/${data.data.chapter.hash}/${f}`);
        res.json(pages);
      } else {
        res.json([]);
      }
    } catch(e: any) {
      console.error('Mangadex pages proxy failed:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Reading Page Proxy (Referer & Cloudflare Bypass)
  app.get('/api/proxy/image', async (req, res) => {
    const url = req.query.url as string;
    
    if (!url) return res.status(400).end();

    let referer = 'https://mangadex.org';
    
    if (url.includes('comick')) referer = 'https://comick.art';
    if (url.includes('mangakakalot')) referer = 'https://mangakakalot.com';
    if (url.includes('manganato')) referer = 'https://manganato.com';
    if (url.includes('chapmanganato')) referer = 'https://chapmanganato.to';
    if (url.includes('mangaread')) referer = 'https://www.mangaread.org';
    if (url.includes('komiku')) referer = 'https://komiku.org';
    if (url.includes('sankavollerei')) referer = 'https://www.sankavollerei.com';
    if (url.includes('weebcentral') || url.includes('planeptune')) referer = 'https://weebcentral.com';

    try {
      const { gotScraping } = await import('got-scraping');
      
      const response = await gotScraping({
        url,
        headers: {
          'Referer': referer,
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        },
        responseType: 'buffer'
      });
      
      if (response.headers['content-type']) {
        res.setHeader('Content-Type', response.headers['content-type']);
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(response.body);
    } catch (err: any) {
      console.error('Proxy proxy hit catch:', err.message);
      if (!res.headersSent) {
        // Try fallback to standard axios
        try {
          const fb = await axios.get(url, {
             responseType: 'arraybuffer',
             headers: { referer }
          });
          if (fb.headers['content-type']) res.setHeader('Content-Type', fb.headers['content-type']);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          res.send(fb.data);
        } catch(e) {
          res.status(500).end();
        }
      }
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
