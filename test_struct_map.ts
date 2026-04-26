import axios from 'axios';

async function testMap() {
  const SANKA = 'https://www.sankavollerei.com/comic';
  
  // Latest
  const ts = await axios.get(`${SANKA}/terbaru`);
  const mappedLatest = (ts.data.comics || []).map((c: any) => ({
    slug: c.link.replace('/manga/', '').replace('/', '') || '',
    title: c.title,
    cover: c.image,
    latestChapter: c.chapter,
    status: 'Ongoing'
  }));
  console.log("Latest:", mappedLatest[0]);

  // Search
  const s = await axios.get(`${SANKA}/search?q=solo`);
  const mappedSearch = (s.data.data || []).map((c: any) => ({
    slug: c.slug,
    title: c.title,
    cover: c.thumbnail,
    type: c.type
  }));
  console.log("Search:", mappedSearch[0]);

  // Info
  const info = await axios.get(`${SANKA}/comic/martial-peak`);
  const cData = info.data;
  const mappedInfo = {
    slug: cData.slug,
    title: cData.title,
    altTitles: cData.title_indonesian ? [cData.title_indonesian] : [],
    cover: cData.image,
    description: cData.synopsis,
    status: cData.status,
    author: cData.author,
    genres: cData.genres || [],
    chapters: (cData.chapters || []).map((ch: any) => ({
      slug: ch.link.replace('/chapter/', '').replace('/', ''),
      number: ch.title.replace('Chapter ', ''),
      title: ch.title,
      date: ch.time
    }))
  };
  console.log("Info:", mappedInfo.title, "Ch:", mappedInfo.chapters[0]);
  
  // Chapter images
  const ch = await axios.get(`${SANKA}/chapter/martial-peak-chapter-1`);
  console.log("Chapter images:", ch.data.images ? ch.data.images.length : 0, ch.data.images?.[0]);
}
testMap();
