import axios from 'axios';
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/proxy?url=' + encodeURIComponent('https://manhwa-api-production.up.railway.app/api/chapters/12345'), { validateStatus: () => true });
    console.log("Success status:", res.status);
    console.log("Data:", res.data);
  } catch (err: any) {
    console.error("Error local proxy:", err.message);
  }
}
test();
