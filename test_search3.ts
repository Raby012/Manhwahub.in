import axios from 'axios';

async function testSearch3() {
  const SANKA_BASE = 'https://www.sankavollerei.com/comic';
  try {
    const { data } = await axios.get(`${SANKA_BASE}/search?q=solo`);
    console.log("Data array length: ", data.data?.length);
    console.log("First item:", data.data ? data.data[0] : null);
  } catch(e: any) {
    console.log(e.message);
  }
}
testSearch3();
