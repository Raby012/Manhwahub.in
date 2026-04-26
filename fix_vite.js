import fs from 'fs';
let content = fs.readFileSync('vite.config.ts', 'utf8');
content = content.replace(/hmr: process.env.DISABLE_HMR !== 'true',/, "hmr: process.env.DISABLE_HMR === 'true' ? false : { protocol: 'wss', clientPort: 443 },");
fs.writeFileSync('vite.config.ts', content);
