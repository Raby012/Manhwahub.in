import axios from 'axios';

async function testOPM() {
  const SANKA_BASE = 'https://www.sankavollerei.com/comic';
  try {
    const { data } = await axios.get(`${SANKA_BASE}/chapter/one-punch-man-chapter-1`);
    console.log("Images:");
    console.log(data.images);
  } catch(e: any) {
    console.log(e.message);
  }
}
testOPM();
