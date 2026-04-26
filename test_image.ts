import axios from 'axios';

async function testImageProxy() {
  const CLAN = 'https://manhwa-clan.vercel.app';
  const url = `${CLAN}/api/image?url=https://via.placeholder.com/150`;
  try {
    const { status } = await axios.get(url);
    console.log(`[SUCCESS] ${url} - ${status}`);
  } catch (e: any) {
    console.log(`[ERROR] ${url} - ${e.response?.status} : ${e.message}`);
  }
}
testImageProxy();
