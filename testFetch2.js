const https = require('https');
https.get('https://api.comick.io/v1.0/feed?lang=en&type=comic&page=1&limit=30&order=new', {headers: {'User-Agent': 'Mozilla/5.0'}}, (res) => {
  console.log('statusCode:', res.statusCode);
  if (res.statusCode >= 300 && res.statusCode < 400) console.log('redirect:', res.headers.location);
}).on('error', (e) => {
  console.error(e);
});
