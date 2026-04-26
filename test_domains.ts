import axios from 'axios';

async function testBackend() {
  const domains = [
    'https://juju-manhwa-2.vercel.app',
    'https://jujumanhwa.vercel.app',
    'https://juju-manhwa.vercel.app',
    'https://juju-api.vercel.app',
  ];

  for (const dom of domains) {
    try {
      const { status } = await axios.get(`${dom}/api/latest/1`);
      console.log(`[SUCCESS] ${dom} - ${status}`);
    } catch (e: any) {
      console.log(`[ERROR] ${dom} - ${e.response?.status} : ${e.message}`);
    }
  }
}
testBackend();
