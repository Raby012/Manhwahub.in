import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('https://uploads.mangadex.org/covers/1044287a-73df-48d0-b0b2-5327f32dd651/e1fab59e-aeaa-4f53-927b-fb82a8995393.jpg.512.jpg', { responseType: 'arraybuffer' });
    console.log("Image works", res.status);
  } catch (err: any) {
    console.log("Image failed", err.message);
  }
}
test();
