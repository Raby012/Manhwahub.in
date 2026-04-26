import axios from 'axios';

async function test() {
  try {
    const list = await axios.get('https://juju-manhwa-2-0.vercel.app/api/latest/1');
    console.log("JUJU Latest Keys:", Object.keys(list.data));
    if (Array.isArray(list.data)) {
      console.log("It's an array. First item:", list.data[0]);
    } else if (list.data.data) {
      console.log("First item in .data:", list.data.data[0]);
    }
  } catch(e) {
    console.log("JUJU Latest Failed:", e.message);
  }

  try {
    const s = await axios.get('https://manhwa-clan.vercel.app/api/search?q=solo');
    console.log("CLAN Search Keys:", Object.keys(s.data));
    console.log("CLAN first item:", Array.isArray(s.data) ? s.data[0] : s.data.data?.[0] || s.data.results?.[0]);
  } catch(e) {
    console.log("CLAN Search Failed:", e.message);
  }
}
test();
