import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

export interface Bookmark {
  id: string;
  title: string;
  cover: string;
  type: string;
  addedAt: number;
  totalChapters?: number;
  hasNewChapters?: boolean;
  userId?: string;
}

export interface ReadingHistory {
  mangaId: string;
  chapterId: string;
  source: string;
  provider?: string;
  chapterNumber: string;
  page: number;
  timestamp: number;
  title: string;
  cover: string;
  userId?: string;
}

const BOOKMARKS_KEY = 'manhwahub_bookmarks';
const HISTORY_KEY = 'manhwahub_history';
const SETTINGS_KEY = 'manhwahub_settings';

export const storageService = {
  // Settings
  getSettings() {
    const data = localStorage.getItem(SETTINGS_KEY);
    let settings = { language: 'en', theme: 'dark', notifications: true };
    if (data) {
      try {
        settings = { ...settings, ...JSON.parse(data) };
      } catch {}
    }
    return settings;
  },

  updateSettings(updates: any) {
    const settings = this.getSettings();
    const newSettings = { ...settings, ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    if (updates.language && updates.language !== settings.language) {
      // It's up to the caller to reload if needed
    }
  },

  getLanguage(): string {
    return this.getSettings().language;
  },

  setLanguage(lang: string) {
    this.updateSettings({ language: lang });
  },

  // Bookmarks
  getBookmarks(): Bookmark[] {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  },

  addBookmark(manga: Bookmark) {
    const user = auth.currentUser;
    if (user) manga.userId = user.uid;

    const bookmarks = this.getBookmarks();
    if (!bookmarks.find((b) => b.id === manga.id)) {
      bookmarks.push(manga);
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      window.dispatchEvent(new Event('bookmarksUpdated'));
      
      if (user) {
        setDoc(doc(db, `users/${user.uid}/bookmarks/${manga.id}`), manga).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/bookmarks/${manga.id}`));
      }
    } else {
      // If it exists, update it
      this.updateBookmark(manga.id, manga);
    }
  },

  updateBookmark(id: string, updates: Partial<Bookmark>) {
    const user = auth.currentUser;
    if (user) updates.userId = user.uid;

    const bookmarks = this.getBookmarks();
    const index = bookmarks.findIndex((b) => b.id === id);
    if (index !== -1) {
      bookmarks[index] = { ...bookmarks[index], ...updates };
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      window.dispatchEvent(new Event('bookmarksUpdated'));

      if (user) {
        setDoc(doc(db, `users/${user.uid}/bookmarks/${id}`), bookmarks[index]).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/bookmarks/${id}`));
      }
    }
  },

  removeBookmark(id: string) {
    const user = auth.currentUser;
    const bookmarks = this.getBookmarks().filter((b) => b.id !== id);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(new Event('bookmarksUpdated'));

    if (user) {
      deleteDoc(doc(db, `users/${user.uid}/bookmarks/${id}`)).catch(err => handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/bookmarks/${id}`));
    }
  },

  isBookmarked(id: string): boolean {
    return this.getBookmarks().some((b) => b.id === id);
  },

  // User ID
  getUserId(): string {
    let uid = localStorage.getItem('manhwahub_user_id');
    if (!uid) {
      uid = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('manhwahub_user_id', uid);
    }
    return uid;
  },

  // History (Local cache)
  getHistory(): ReadingHistory[] {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Async get history
  async fetchHistory(): Promise<ReadingHistory[]> {
    const user = auth.currentUser;
    if (user) {
      try {
        const snap = await getDocs(collection(db, `users/${user.uid}/history`));
        const data = snap.docs.map(doc => doc.data() as ReadingHistory).sort((a,b) => b.timestamp - a.timestamp);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
        return data;
      } catch (e) {
        console.warn('Failed to fetch remote history', e);
      }
    } else {
      try {
        const res = await fetch(`https://manhwa-api-production.up.railway.app/api/user/history/${this.getUserId()}`);
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.warn('Failed to fetch remote history', e);
      }
    }
    return this.getHistory();
  },

  async clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    const user = auth.currentUser;
    if (user) {
       const snap = await getDocs(collection(db, `users/${user.uid}/history`));
       snap.forEach(docSnap => {
         deleteDoc(doc(db, `users/${user.uid}/history/${docSnap.id}`)).catch(console.warn);
       });
    } else {
      try {
         await fetch(`https://manhwa-api-production.up.railway.app/api/user/history/${this.getUserId()}`, {
           method: 'DELETE'
         });
      } catch {}
    }
  },

  async saveProgress(history: ReadingHistory) {
    const user = auth.currentUser;
    if (user) history.userId = user.uid;

    let list = this.getHistory();
    list = list.filter((h) => h.mangaId !== history.mangaId);
    list.unshift(history);
    if (list.length > 50) list = list.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));

    if (user) {
      setDoc(doc(db, `users/${user.uid}/history/${history.mangaId}`), history).catch(console.warn);
    } else {
      // Sync to Railway API
      try {
        fetch('https://manhwa-api-production.up.railway.app/api/user/history', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: this.getUserId(),
            mangaId: history.mangaId,
            title: history.title,
            cover: history.cover,
            chapterId: history.chapterId,
            chapterNumber: history.chapterNumber,
            page: history.page,
            timestamp: history.timestamp,
            source: history.source,
            provider: history.provider
          })
        }).catch(console.warn);
      } catch (err) {}
    }
  },

  getMangaProgress(mangaId: string): ReadingHistory | undefined {
    return this.getHistory().find((h) => h.mangaId === mangaId);
  },

  getDownloadedChapters(): Record<string, string[]> {
    const data = localStorage.getItem('manhwahub_downloads');
    return data ? JSON.parse(data) : {};
  },

  markChapterDownloaded(mangaId: string, chapterSlug: string) {
    const downloads = this.getDownloadedChapters();
    if (!downloads[mangaId]) downloads[mangaId] = [];
    if (!downloads[mangaId].includes(chapterSlug)) {
      downloads[mangaId].push(chapterSlug);
      localStorage.setItem('manhwahub_downloads', JSON.stringify(downloads));
    }
  },

  isChapterDownloaded(mangaId: string, chapterSlug: string): boolean {
    const downloads = this.getDownloadedChapters();
    return downloads[mangaId]?.includes(chapterSlug) || false;
  }
};
