import axios from 'axios';

async function testComick() {
  try {
    const res = await axios.get('https://api.comick.fun/v1.0/search?q=solo&limit=1', { timeout: 8000 });
    console.log("Comick Fun:", res.status);
  } catch(e: any) { console.log("Comick Fun error:", e.message); }

  try {
    const res2 = await axios.get('https://api.mangadex.org/manga?title=solo&limit=1', { timeout: 8000 });
    console.log("Dex:", res2.status);
  } catch(e: any) { console.log("Dex error:", e.message); }
  
  try {
    const res3 = await axios.get('https://consumet-api-production-7cf4.up.railway.app/manga/mangakakalot/solo-leveling', { timeout: 8000 });
    console.log("Consumet Alt:", res3.status);
  } catch(e: any) { console.log("Consumet Alt error:", e.message); }
}
testComick();
