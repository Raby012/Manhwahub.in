import { getTags } from './src/services/api.ts';
getTags()
  .then(res => console.log('success', res.list.filter(x => x.group === 'genre').slice(0, 5)))
  .catch(err => console.error('fail', err));
