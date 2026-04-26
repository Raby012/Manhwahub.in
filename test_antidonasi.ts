import axios from 'axios';

async function testBackend() {
  const JUJU = 'https://backend-comic.antidonasi.web.id';
  const endpoints = [
    `${JUJU}/api/latest/1`,
    `${JUJU}/api/all/1`,
    `${JUJU}/api/info/some-slug`,
    `${JUJU}/api/chapter/some-slug`,
    `${JUJU}/latest/1`,
    `${JUJU}/api/manga/latest/1`,
    `${JUJU}/api/comic/latest/1`,
    `${JUJU}/comic/latest/1`,
    `${JUJU}/api/comic/terbaru`,
    `${JUJU}/api/comic/trending`,
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
