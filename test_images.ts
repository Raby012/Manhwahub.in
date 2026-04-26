import axios from 'axios';

async function testImages() {
  const SANKA_BASE = 'https://www.sankavollerei.com/comic';
  try {
    const { data } = await axios.get(`${SANKA_BASE}/chapter/the-legendary-hero-is-an-academy-honors-student-chapter-1`);
    console.log("Images:");
    console.log(data.images);
  } catch(e: any) {
    console.log(e.message);
  }
}
testImages();
