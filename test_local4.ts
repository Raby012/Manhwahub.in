import axios from 'axios';
async function test() {
  try {
    const res = await axios.get('https://manhwa-api-production.up.railway.app/api/info/omniscient-readers-viewpoint');
    console.log("data keys:", Object.keys(res.data));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
test();
