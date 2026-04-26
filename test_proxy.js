import { gotScraping } from 'got-scraping';

async function run() {
  const url = 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx31706-LBBp2zE7iMps.jpg';
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
