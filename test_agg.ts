async function fetchAtsumaru() {
    const url = 'https://raw.githubusercontent.com/TheUndo/Atsumaru/new-layout/api/src/routes/manga.ts';
    try {
      const res = await fetch(url);
      console.log(url, res.status);
      if (res.ok) {
          const t = await res.text();
          console.log(t);
      } else {
        console.log(await res.text())
      }
    } catch (e) {
        console.error(e);
    }
}
fetchAtsumaru();






















