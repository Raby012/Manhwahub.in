import axios from 'axios';
async function test() {
  try {
    const res = await axios.get('https://manhwa-api-production.up.railway.app/api/home');
    console.log("Success:", res.status);
  } catch (err: any) {
    console.error("Error/api/home:", err.response?.data || err.message);
  }
}
test();
