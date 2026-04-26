import axios from 'axios';

async function mapBackend() {
  const SANKA = 'https://www.sankavollerei.com/comic';
  const endpoints = [
    `${SANKA}/terbaru`,         // analogous to latest/1 ?
    `${SANKA}/unlimited`,       // analogous to all/1 ?
    `${SANKA}/search/solo`,     // search
    `${SANKA}/search?q=solo`,     // search alternative
    `${SANKA}/comic/martial-peak`, // info
    `${SANKA}/chapter/martial-peak-chapter-1`, // chapter
  ];

  for (const ep of endpoints) {
    try {
      const { status, data } = await axios.get(ep);
      console.log(`[SUCCESS] ${ep} - ${status} - Data Type: ${Array.isArray(data) ? 'Array' : typeof data}`);
    } catch (e: any) {
      console.log(`[ERROR] ${ep} - ${e.response?.status} : ${e.message}`);
    }
  }
}
mapBackend();
