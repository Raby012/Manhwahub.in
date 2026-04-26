import axios from 'axios';

async function testSearch2() {
  const SANKA_BASE = 'https://www.sankavollerei.com/comic';
  try {
    const { data } = await axios.get(`${SANKA_BASE}/search?q=lout%20of%20count`);
    console.log("Data array:", data.data);
  } catch(e: any) {
    console.log(e.message);
  }
}
testSearch2();
