import axios from 'axios';

async function testClanSearch() {
  try {
    const { data } = await axios.get(`https://manhwa-clan.vercel.app/api/search?q=lout%20of`);
    console.log(data);
  } catch(e: any) {
    console.log(e.message);
  }
}
testClanSearch();
