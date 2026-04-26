import { getChapters } from './src/services/api.ts';
async function test() {
  const chapters = await getChapters({ id: 'a9dd451c-3c45-4d66-a818-4e1b78855838', title: 'Uma Musume: Cinderella Gray' });
  const ch = chapters.ch_list.find((c: any) => c.slug === 'FSD2gA8Y' || c.comick_slug === 'FSD2gA8Y' || c.railway_slug === 'FSD2gA8Y');
  console.log(ch);
}
test();
