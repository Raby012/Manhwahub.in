import axios from 'axios';

async function testBackend() {
  const JUJU = 'https://www.sankavollerei.com';
  const endpoints = [
    `${JUJU}/api/latest/1`,
    `${JUJU}/api/all/1`,
    `${JUJU}/comic/terbaru`,
    `${JUJU}/comic/trending`,
    `${JUJU}/api/comic/terbaru`,
  ];

  for (const ep of endpoints) {
    try {
      const { status, data } = await axios.get(ep);
      console.log(`[SUCCESS] ${ep} - ${status} (${Object.keys(data).length} keys)`);
    } catch (e: any) {
      console.log(`[ERROR] ${ep} - ${e.response?.status} : ${e.message}`);
    }
  }
}
testBackend();
