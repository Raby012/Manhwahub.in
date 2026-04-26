import axios from 'axios';

async function testQueryParam() {
  const JUJU = 'https://juju-manhwa-2-0.vercel.app';
  const endpoints = [
    `${JUJU}/api/latest?page=1`,
    `${JUJU}/api/all?page=1`,
    `${JUJU}/api/info?slug=martial-peak`,
    `${JUJU}/api/chapter?slug=martial-peak-chapter-1`,
  ];

  for (const ep of endpoints) {
    try {
      const { status } = await axios.get(ep);
      console.log(`[SUCCESS] ${ep} - ${status}`);
    } catch (e: any) {
      console.log(`[ERROR] ${ep} - ${e.response?.status} : ${e.message}`);
    }
  }
}
testQueryParam();
