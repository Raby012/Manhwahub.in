import axios from 'axios';

async function testHeaders() {
  try {
    const res = await axios.get('https://juju-manhwa-2-0.vercel.app/api/latest/1', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    console.log("[SUCCESS]", res.status);
  } catch (e: any) {
    console.log("[ERROR] latest", e.response?.status);
  }
}
testHeaders();
