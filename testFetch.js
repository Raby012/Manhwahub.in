const https = require('https');
https.get('https://api.comick.fun/v1.0/feed?lang=en&type=comic&page=1&limit=30&order=new', (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);
}).on('error', (e) => {
  console.error(e);
});
