async function check(headers) {
  const url = 'https://img.komiku.org/upload5/the-legendary-hero-is-an-academy-ho/1/2025-05-21/1.jpg';
  try {
    const res = await fetch(url, { headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      ...headers
    } });
    console.log(`Status: ${res.status} | Referer: ${headers.Referer || 'none'}`);
  } catch(e) {
    console.log(`Error: ${e.message} | Referer: ${headers.Referer || 'none'}`);
  }
}

async function run() {
  await check({});
  await check({ 'Referer': 'https://komiku.id/' });
  await check({ 'Referer': 'https://www.sankavollerei.com/' });
}
run();
