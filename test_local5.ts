import axios from 'axios';
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/manga/info/omniscient-readers-viewpoint');
    console.log("Success:", res.status);
    console.log("Keys:", Object.keys(res.data));
    console.log("Chapters length:", res.data.chapters?.length);
  } catch (err: any) {
    console.error("Error:", err.response?.data || err.message);
  }
}
test();
