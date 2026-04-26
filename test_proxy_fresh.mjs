import { gotScraping } from 'got-scraping';

async function run() {
  const mdInfo = await gotScraping({ url: 'https://api.mangadex.org/at-home/server/0aaf8b27-0013-4ae0-8935-91a089466874' }).json();
  const pageUrl = `${mdInfo.baseUrl}/data/${mdInfo.chapter.hash}/${mdInfo.chapter.data[0]}`;
  console.log('Fetching', pageUrl);
  
  const fetched = await fetch('http://localhost:3000/api/proxy/image?url=' + encodeURIComponent(pageUrl));
  const text = await fetched.text();
  console.log('Status:', fetched.status);
  console.log('Byte len:', text.length);
  console.log('Content-Type:', fetched.headers.get('content-type'));
}
run();
