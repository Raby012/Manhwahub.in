import { execSync } from 'child_process';

function t(ref) {
  try {
    const cmd = `curl -s -I "https://img.komiku.org/uploads2/2800699-1.png" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -H "Referer: ${ref}"`;
    const out = execSync(cmd).toString();
    const status = out.split('\n')[0];
    console.log(`[${ref || 'empty'}] ${status}`);
  } catch(e) {
    console.log(`[${ref || 'empty'}] ERROR`);
  }
}

t('');
t('https://komiku.id/');
t('https://www.sankavollerei.com/');
t('https://ais-dev-xyz.run.app/');
