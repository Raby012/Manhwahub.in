import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/mangadex/manga/1044287a-73df-48d0-b0b2-5327f32dd651/feed?limit=1');
    console.log("Success:", res.status);
    console.log("Data keys:", Object.keys(res.data));
  } catch (err: any) {
    console.error("Error/api/mangadex local:", err.response?.data || err.message);
  }
}
test();
