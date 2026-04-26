import { getChapters, getChapterPages } from './src/services/api.ts';

async function run() {
  const mangaId = 'a9dd451c-3c45-4d66-a818-4e1b78855838';
  const chapters = await getChapters({ id: mangaId, title: 'Uma Musume: Cinderella Gray' });
  console.log(`Found ${chapters.ch_list.length} chapters.`);
  if (chapters.ch_list.length === 0) return;
  
  const firstChapter = chapters.ch_list[0];
  console.log('First chapter obj:', firstChapter);
  
  const pages = await getChapterPages(mangaId, firstChapter);
  console.log('Pages length:', pages?.length);
  if (pages?.length) {
    console.log('First page URL:', pages[0]);
  } else {
    // try to find out why it failed
    console.log('first chapter struct:', JSON.stringify(firstChapter, null, 2));
  }
}

run();
