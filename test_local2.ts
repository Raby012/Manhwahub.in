import axios from 'axios';
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/mangadex/manga/omniscient-readers-viewpoint/feed');
    console.log("Success:", res.status);
  } catch (err: any) {
    console.error("Error text slug:", err.response?.data || err.message);
  }
}
test();
