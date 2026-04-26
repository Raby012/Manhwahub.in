import axios from 'axios';
async function test() {
  try {
    const res = await axios.get('https://manhwa-api-production.up.railway.app/api/info/omniscient-reader');
    console.log("data id:", res.data.id);
    console.log("data slug:", res.data.slug);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
test();
