import axios from 'axios';

async function testW() {
  const url = encodeURIComponent('https://img.komiku.org/upload5/the-legendary-hero-is-an-academy-ho/1/2025-05-21/1.jpg');
  try {
    const res = await axios.get(`https://wsrv.nl/?url=${url}`, {
      responseType: 'arraybuffer'
    });
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers['content-type']);
  } catch(e: any) {
    console.log("Error:", e.message);
  }
}
testW();
