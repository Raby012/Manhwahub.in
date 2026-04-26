import axios from 'axios';

async function t() {
  try {
    const res = await axios.get('https://juju-manhwa-2-0.vercel.app/assets/index-Dd4NmhRb.js');
    console.log("JS file fetched. Length:", res.data.length);
    const urls = res.data.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9.\-_\/]+)?/g);
    const uniqueUrls = [...new Set(urls)];
    console.log("Unique URLs in JS:", uniqueUrls);
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}
t();
