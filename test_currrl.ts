import { execSync } from 'child_process';
const url = 'https://img.komiku.org/uploads2/2800699-1.png';
console.log('empty', execSync(`curl -s -I "${url}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"`).toString().split('\n')[0]);
