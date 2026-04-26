import { gotScraping } from 'got-scraping';

async function run() {
  const url = 'http://localhost:3000/api/proxy/image?url=' + encodeURIComponent('https://uploads.mangadex.org/data/23605e5d16dbbb80fb1a15baef206c4b/1-11884ea23555ba150defef6ebfeeb7d65f5a2b0e6e7d690a232f05a109be35f4.png');
  try {
    const stream = gotScraping.stream({ url });
    stream.on('response', (res) => console.log('Proxy Status:', res.statusCode, res.headers['content-type'], res.headers['content-length']));
    stream.on('error', (err) => console.error('stream error', err));
    stream.on('data', d => console.log('data', d.length));
  } catch(e) {
    console.error('outer error', e);
  }
}
run();
