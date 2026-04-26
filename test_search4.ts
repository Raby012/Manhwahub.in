import axios from 'axios';

async function testSearch4() {
  const SANKA_BASE = 'https://www.sankavollerei.com/comic';
  try {
    const { data } = await axios.get(`${SANKA_BASE}/search?q=trash%20of`);
    console.log("Data array length: ", data.data?.length);
    console.log("First item:", data.data ? data.data[0] : null);
  } catch(e: any) {
    console.log(e.message);
  }
}
testSearch4();
