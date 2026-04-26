import axios from 'axios';

async function testAPIs() {
  const SANKA = 'https://www.sankavollerei.com/comic';
  const JUJU = 'https://juju-manhwa-app.vercel.app/api'; // user mentioned juju-manhwa-2-0.vercel.app but let's test a few
  const CLAN = 'https://manhwa-clan.vercel.app/api';
  const HOOK = 'https://mangahook-api.vercel.app/api';
  const DEX = 'https://api.mangadex.org';
  const CONS = 'https://api.consumet.org/manga/mangakakalot';
  const COMICK = 'https://api.comick.app/v1.0'; // using app as fun is usually dead

  const slug = 'solo-leveling';
  
  const results: any = {};

  const fetchSafe = async (name: string, url: string) => {
    try {
      const res = await axios.get(url, { timeout: 5000 });
      results[name] = res.status;
    } catch(e: any) {
      results[name] = e.response ? e.response.status : e.message;
    }
  };

  await Promise.all([
    fetchSafe('Sanka', `${SANKA}/info/${slug}`),
    fetchSafe('Clan', `${CLAN}/${slug}/details`),
    fetchSafe('Hook', `${HOOK}/manga?id=${slug}`),
    fetchSafe('Dex', `${DEX}/manga?title=${slug}&limit=1`),
    fetchSafe('Consumet', `${CONS}/${slug}`),
    fetchSafe('Comick', `${COMICK}/search?q=${slug}&limit=1`)
  ]);

  console.log(results);
}
testAPIs();
