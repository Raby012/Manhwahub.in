import axios from 'axios';

async function testSearch() {
  const SANKA_BASE = 'https://www.sankavollerei.com/comic';
  try {
    const { data } = await axios.get(`${SANKA_BASE}/search?q=lout%20of`);
    console.log("Search Results keys:", Object.keys(data));
    console.log("Data array:", data.data ? data.data.slice(0, 2) : "No data.data");
    console.log("Comics array:", data.comics ? data.comics.slice(0, 2) : "No data.comics");
    console.log("Results array:", data.results ? data.results.slice(0, 2) : "No data.results");
  } catch(e: any) {
    console.log(e.message);
  }
}
testSearch();
