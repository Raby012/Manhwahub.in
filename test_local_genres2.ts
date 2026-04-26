import axios from 'axios';

async function t() {
  const SANKA = 'http://localhost:3000/api/manga/info/martial-peak';
  try {
    const res = await axios.get(SANKA);
    console.log("Response Type:", typeof res.data);
    console.log("Keys:", Object.keys(res.data));
    console.log("Genres:", res.data.genres);
  } catch (e: any) {
    console.log("err", e.message);
  }
}
t();
