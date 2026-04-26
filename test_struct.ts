import axios from 'axios';

async function mapBackend() {
  const SANKA = 'https://www.sankavollerei.com/comic';
  try {
    const v = await axios.get(`${SANKA}/terbaru`);
    console.log("Terbaru:", JSON.stringify(v.data, null, 2).slice(0, 500));
    const s = await axios.get(`${SANKA}/search?q=solo`);
    console.log("Search solo:", JSON.stringify(s.data, null, 2).slice(0, 500));
    const info = await axios.get(`${SANKA}/comic/martial-peak`);
    console.log("Info martial peak:", JSON.stringify(info.data, null, 2).slice(0, 500));
  } catch (e: any) {
    console.log("err", e.message);
  }
}
mapBackend();
