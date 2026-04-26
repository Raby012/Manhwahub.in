import axios from 'axios';

async function testMap() {
  const SANKA = 'https://www.sankavollerei.com/comic';
  const info = await axios.get(`${SANKA}/comic/martial-peak`);
  console.log("Genres:", info.data.genres)
}
testMap();
