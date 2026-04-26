import { gotScraping } from 'got-scraping';

async function run() {
  const url = 'https://uploads.mangadex.org/data/23605e5d16dbbb80fb1a15baef206c4b/x1.jpg';
  try {
    const stream = gotScraping.stream({ url });
    stream.on('response', (res) => console.log(res.statusCode, res.headers['content-type']));
    stream.on('error', (err) => console.error('stream error', err));
    stream.on('data', d => console.log('data', d.length));
  } catch(e) {
    console.error('outer error', e);
  }
}
run();
