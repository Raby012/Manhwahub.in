import axios from 'axios';

async function t() {
  const SANKA = 'https://www.sankavollerei.com/comic';
  const ch = await axios.get(`${SANKA}/chapter/martial-peak-chapter-1`);
  console.log("Keys:", Object.keys(ch.data));
  console.log("Images:", ch.data.images ? ch.data.images.slice(0, 2) : 'No images key');
}
t();
