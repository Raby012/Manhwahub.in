async function checkDomains() {
  const domains = [
    'https://api.comick.fun',
    'https://api.comick.io',
    'https://api.comick.app',
    'https://api.comick.cc',
    'https://comick.io'
  ];
  for (const d of domains) {
    try {
      const res = await globalThis.fetch(d + '/v1.0/feed?lang=en&type=comic&page=1&limit=1', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      console.log(d, res.status);
    } catch(e) {
      console.log(d, e.message);
    }
  }
}
checkDomains();
