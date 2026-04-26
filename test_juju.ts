import axios from 'axios';

const BASE = 'https://juju-manhwa-2-0.vercel.app';

async function testBackend() {
  const routes = [
    '/api',
    '/api/manga/search/solo',
    '/api/search/solo',
    '/search/solo',
    '/manga/search/solo',
  ];

  for (const route of routes) {
    try {
      console.log(`Trying ${BASE}${route}...`);
      const res = await axios.get(`${BASE}${route}`);
      console.log(`SUCCESS ON ${route}! Keys:`, Object.keys(res.data));
    } catch (e: any) {
      console.log(`Failed ${route}:`, e.message);
    }
  }
}

testBackend();
