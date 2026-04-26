import axios from 'axios';
async function run() {
  try {
    const res = await axios.get('https://img.komiku.org/upload5/the-legendary-hero-is-an-academy-ho/1/2025-05-21/1.jpg', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://komiku.id/'
      }
    });
  } catch(e: any) {
    console.log(e.response?.headers);
    console.log(e.response?.data?.toString().substring(0, 500));
  }
}
run();
