import axios from 'axios';

async function testClan() {
  const url = encodeURIComponent('https://img.komiku.org/upload5/the-legendary-hero-is-an-academy-ho/1/2025-05-21/1.jpg');
  try {
    const res = await axios.get(`https://manhwa-clan.vercel.app/api/image?url=${url}`, {
      responseType: 'arraybuffer'
    });
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers['content-type']);
  } catch(e: any) {
    console.log("Error:", e.message);
    if (e.response) {
      console.log(e.response.status);
    }
  }
}
testClan();
