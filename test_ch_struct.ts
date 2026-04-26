import axios from 'axios';

async function t() {
  const SANKA = 'https://www.sankavollerei.com/comic';
  const info = await axios.get(`${SANKA}/comic/martial-peak`);
  console.log("Chapters:", info.data.chapters[0]);
}
t();
