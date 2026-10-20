import { get, set, del, keys, UseStore } from 'idb-keyval';
import { DocumentItem } from '../types';

const DB_NAME = 'holpdf-storage-v2';
const DOC_STORE_NAME = 'documents';
const IMG_STORE_NAME = 'page-images';

let dbPromise: Promise<IDBDatabase> | null = null;

// Cleanup legacy / broken databases from earlier iterations if they exist
if (typeof window !== 'undefined' && window.indexedDB) {
  try {
    indexedDB.deleteDatabase('holpdf-db');
    indexedDB.deleteDatabase('holpdf-docs-v1');
    indexedDB.deleteDatabase('holpdf-images-v1');
  } catch {
    // Ignore cleanup error
  }
}

/**
 * Returns a reliable connection to the IndexedDB database, ensuring all object stores exist.
 */
function getDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const openReq = indexedDB.open(DB_NAME, 1);

    openReq.onupgradeneeded = () => {
      const db = openReq.result;
      if (!db.objectStoreNames.contains(DOC_STORE_NAME)) {
        db.createObjectStore(DOC_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(IMG_STORE_NAME)) {
        db.createObjectStore(IMG_STORE_NAME);
      }
    };

    openReq.onsuccess = () => {
      const db = openReq.result;
      db.onclose = () => {
        dbPromise = null;
      };
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      // Safeguard: verify that both stores actually exist in this database
      if (!db.objectStoreNames.contains(DOC_STORE_NAME) || !db.objectStoreNames.contains(IMG_STORE_NAME)) {
        db.close();
        // Re-create cleanly
        const delReq = indexedDB.deleteDatabase(DB_NAME);
        delReq.onsuccess = () => {
          const freshReq = indexedDB.open(DB_NAME, 1);
          freshReq.onupgradeneeded = () => {
            const freshDb = freshReq.result;
            freshDb.createObjectStore(DOC_STORE_NAME);
            freshDb.createObjectStore(IMG_STORE_NAME);
          };
          freshReq.onsuccess = () => resolve(freshReq.result);
          freshReq.onerror = () => reject(freshReq.error);
        };
        delReq.onerror = () => reject(delReq.error);
        return;
      }

      resolve(db);
    };

    openReq.onerror = () => {
      dbPromise = null;
      reject(openReq.error);
    };
  }).catch((err) => {
    dbPromise = null;
    throw err;
  });

  return dbPromise;
}

/**
 * Custom store wrapper compatible with idb-keyval UseStore
 */
function createSafeStore(storeName: string): UseStore {
  return (txMode, callback) => {
    return getDatabase().then((db) => {
      const tx = db.transaction(storeName, txMode);
      return callback(tx.objectStore(storeName));
    });
  };
}

const docStore = createSafeStore(DOC_STORE_NAME);
const imageStore = createSafeStore(IMG_STORE_NAME);

/**
 * Remove pageImageUrl base64 from memory objects to keep state lightweight
 */
export const stripPageImages = (doc: DocumentItem): DocumentItem => {
  const cleanDoc = { ...doc };
  if (cleanDoc.content && cleanDoc.content.pageImageUrl) {
    const { pageImageUrl, ...restContent } = cleanDoc.content;
    cleanDoc.content = restContent as any;
  }
  if (Array.isArray(cleanDoc.pages)) {
    cleanDoc.pages = cleanDoc.pages.map((p) => {
      if (p.pageImageUrl) {
        const { pageImageUrl, ...rest } = p;
        return rest as any;
      }
      return p;
    });
  }
  return cleanDoc;
};

/**
 * Save a document into IndexedDB (metadata + text only, no pageImageUrl)
 */
export const saveDocument = async (doc: DocumentItem): Promise<void> => {
  try {
    const cleanDoc = stripPageImages(doc);
    await set(doc.id, cleanDoc, docStore);
  } catch (err) {
    console.warn('Could not save document to IndexedDB:', err);
    throw err;
  }
};

/**
 * Load all documents stored in IndexedDB
 */
export const loadAllDocuments = async (): Promise<DocumentItem[]> => {
  try {
    const docKeys = await keys(docStore);
    const docs: DocumentItem[] = [];
    for (const key of docKeys) {
      try {
        const doc = await get<DocumentItem>(key, docStore);
        if (doc) docs.push(doc);
      } catch (err) {
        console.warn(`Could not load document ${key}:`, err);
      }
    }
    return docs;
  } catch (err) {
    console.warn('Error loading documents from IndexedDB:', err);
    return [];
  }
};

/**
 * Delete a document from IndexedDB and all associated page images
 */
export const deleteDocument = async (id: string): Promise<void> => {
  try {
    await del(id, docStore);
  } catch (e) {
    console.warn('Error deleting document from docStore:', e);
  }
  try {
    const imgKeys = await keys(imageStore);
    for (const key of imgKeys) {
      if (typeof key === 'string' && key.startsWith(`${id}:`)) {
        await del(key, imageStore);
      }
    }
  } catch (e) {
    console.warn('Error cleaning up page images from IndexedDB:', e);
  }
};

/**
 * Save a page image as a raw Blob in IndexedDB
 */
export const savePageImage = async (docId: string, page: number, blob: Blob): Promise<void> => {
  try {
    const key = `${docId}:${page}`;
    await set(key, blob, imageStore);
  } catch (err) {
    console.warn('Error saving page image to IndexedDB:', err);
  }
};

/**
 * Retrieve a page image as an Object URL (to be revoked by caller when no longer needed)
 */
export const getPageImage = async (docId: string, page: number): Promise<string | null> => {
  try {
    const key = `${docId}:${page}`;
    const blob = await get<Blob>(key, imageStore);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Error retrieving page image from IndexedDB:', err);
    return null;
  }
};

/**
 * Estimate storage quota and usage
 */
export const estimateStorage = async (): Promise<{ usage: number; quota: number; percent: number }> => {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const percent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
      return { usage, quota, percent };
    } catch (e) {
      console.warn('Could not estimate storage:', e);
    }
  }
  return { usage: 0, quota: 0, percent: 0 };
};

/**
 * Request persistent storage
 */
export const requestStoragePersistence = async (): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
};

/**
 * Migrate legacy localStorage holpdf_documents_cache to IndexedDB once, then remove key
 */
export const migrateFromLocalStorage = async (): Promise<DocumentItem[] | null> => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const legacyData = localStorage.getItem('holpdf_documents_cache');
  if (!legacyData) return null;

  try {
    const parsed = JSON.parse(legacyData);
    if (Array.isArray(parsed) && parsed.length > 0) {
      for (const item of parsed) {
        if (item.id && Array.isArray(item.pages)) {
          for (const p of item.pages) {
            if (p.pageImageUrl && p.pageImageUrl.startsWith('data:')) {
              try {
                const res = await fetch(p.pageImageUrl);
                const blob = await res.blob();
                await savePageImage(item.id, p.page, blob);
              } catch {
                // Ignore single page conversion error
              }
            }
          }
        }
        try {
          await saveDocument(item);
        } catch {
          // Ignore individual doc save error during migration
        }
      }
      localStorage.removeItem('holpdf_documents_cache');
      return await loadAllDocuments();
    }
    localStorage.removeItem('holpdf_documents_cache');
  } catch (err) {
    console.warn('Erreur lors de la migration du localStorage vers IndexedDB:', err);
  }
  return null;
};
