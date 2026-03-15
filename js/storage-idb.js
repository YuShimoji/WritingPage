/**
 * storage-idb.js — SP-077 IndexedDB ストレージラッパー
 *
 * 大容量データ (ドキュメント, アセット, スナップショット, Wiki) を
 * IndexedDB に保存する。ZenWriterStorage と連携してメモリキャッシュ経由の
 * 同期API互換を提供する。
 */
(function () {
  'use strict';

  var DB_NAME = 'ZenWriterDB';
  var DB_VERSION = 1;
  var db = null;
  var isAvailable = typeof indexedDB !== 'undefined';

  // ---- Database open / upgrade ----

  function open() {
    return new Promise(function (resolve) {
      if (!isAvailable) {
        resolve(false);
        return;
      }
      if (db) {
        resolve(true);
        return;
      }

      var request;
      try {
        request = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        isAvailable = false;
        resolve(false);
        return;
      }

      request.onupgradeneeded = function (event) {
        var d = event.target.result;

        if (!d.objectStoreNames.contains('documents')) {
          var docStore = d.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('parentId', 'parentId', { unique: false });
          docStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!d.objectStoreNames.contains('assets')) {
          d.createObjectStore('assets', { keyPath: 'id' });
        }

        if (!d.objectStoreNames.contains('snapshots')) {
          var snapStore = d.createObjectStore('snapshots', { keyPath: 'id' });
          snapStore.createIndex('ts', 'ts', { unique: false });
        }

        if (!d.objectStoreNames.contains('wiki')) {
          var wikiStore = d.createObjectStore('wiki', { keyPath: 'id' });
          wikiStore.createIndex('title', 'title', { unique: false });
          wikiStore.createIndex('category', 'category', { unique: false });
        }

        if (!d.objectStoreNames.contains('nodegraph')) {
          d.createObjectStore('nodegraph', { keyPath: 'docId' });
        }
      };

      request.onsuccess = function (event) {
        db = event.target.result;
        db.onerror = function (e) {
          console.warn('[IDB] Database error:', e.target.error);
        };
        resolve(true);
      };

      request.onerror = function () {
        console.warn('[IDB] Failed to open database');
        isAvailable = false;
        resolve(false);
      };
    });
  }

  // ---- Generic helpers ----

  function getAll(storeName) {
    return new Promise(function (resolve, reject) {
      if (!db) { resolve([]); return; }
      var tx = db.transaction(storeName, 'readonly');
      var store = tx.objectStore(storeName);
      var request = store.getAll();
      request.onsuccess = function () { resolve(request.result || []); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function getById(storeName, id) {
    return new Promise(function (resolve, reject) {
      if (!db) { resolve(null); return; }
      var tx = db.transaction(storeName, 'readonly');
      var store = tx.objectStore(storeName);
      var request = store.get(id);
      request.onsuccess = function () { resolve(request.result || null); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function put(storeName, item) {
    return new Promise(function (resolve, reject) {
      if (!db) { reject(new Error('DB not open')); return; }
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      var request = store.put(item);
      request.onsuccess = function () { resolve(); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function putAll(storeName, items) {
    return new Promise(function (resolve, reject) {
      if (!db || !items || items.length === 0) { resolve(); return; }
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      for (var i = 0; i < items.length; i++) {
        store.put(items[i]);
      }
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  }

  function deleteById(storeName, id) {
    return new Promise(function (resolve, reject) {
      if (!db) { resolve(); return; }
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      var request = store.delete(id);
      request.onsuccess = function () { resolve(); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function clearStore(storeName) {
    return new Promise(function (resolve, reject) {
      if (!db) { resolve(); return; }
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      var request = store.clear();
      request.onsuccess = function () { resolve(); };
      request.onerror = function () { reject(request.error); };
    });
  }

  // ---- Document API ----

  function getDoc(id) { return getById('documents', id); }
  function putDoc(doc) { return put('documents', doc); }
  function deleteDoc(id) { return deleteById('documents', id); }
  function getAllDocs() { return getAll('documents'); }

  // ---- Asset API ----

  function getAsset(id) { return getById('assets', id); }
  function putAsset(asset) { return put('assets', asset); }
  function deleteAsset(id) { return deleteById('assets', id); }
  function getAllAssets() { return getAll('assets'); }

  // ---- Snapshot API ----

  function getSnapshots() { return getAll('snapshots'); }
  function addSnapshot(snap) { return put('snapshots', snap); }
  function clearSnapshots() { return clearStore('snapshots'); }

  // ---- Wiki API ----

  function getWikiPages() { return getAll('wiki'); }
  function putWikiPage(page) { return put('wiki', page); }
  function deleteWikiPage(id) { return deleteById('wiki', id); }

  // ---- Nodegraph API ----

  function getNodegraph(docId) { return getById('nodegraph', docId); }
  function putNodegraph(data) { return put('nodegraph', data); }

  // ---- Migration from localStorage ----

  function migrateFromLocalStorage() {
    var counts = { documents: 0, assets: 0, snapshots: 0, wiki: 0 };
    var migrated = false;

    return Promise.resolve()
      .then(function () {
        // Documents
        var raw = localStorage.getItem('zenWriter_docs');
        if (raw) {
          try {
            var docs = JSON.parse(raw);
            if (Array.isArray(docs) && docs.length > 0) {
              counts.documents = docs.length;
              migrated = true;
              return putAll('documents', docs).then(function () {
                localStorage.removeItem('zenWriter_docs');
              });
            }
          } catch (e) {
            console.warn('[IDB] Failed to parse zenWriter_docs:', e);
          }
        }
      })
      .then(function () {
        // Assets
        var raw = localStorage.getItem('zenWriter_assets');
        if (raw) {
          try {
            var assetsObj = JSON.parse(raw);
            var assetList = [];
            if (assetsObj && typeof assetsObj === 'object') {
              var keys = Object.keys(assetsObj);
              for (var i = 0; i < keys.length; i++) {
                var a = assetsObj[keys[i]];
                a.id = a.id || keys[i];
                assetList.push(a);
              }
            }
            if (assetList.length > 0) {
              counts.assets = assetList.length;
              migrated = true;
              return putAll('assets', assetList).then(function () {
                localStorage.removeItem('zenWriter_assets');
              });
            }
          } catch (e) {
            console.warn('[IDB] Failed to parse zenWriter_assets:', e);
          }
        }
      })
      .then(function () {
        // Snapshots
        var raw = localStorage.getItem('zenWriter_snapshots');
        if (raw) {
          try {
            var snaps = JSON.parse(raw);
            if (Array.isArray(snaps) && snaps.length > 0) {
              counts.snapshots = snaps.length;
              migrated = true;
              return putAll('snapshots', snaps).then(function () {
                localStorage.removeItem('zenWriter_snapshots');
              });
            }
          } catch (e) {
            console.warn('[IDB] Failed to parse zenWriter_snapshots:', e);
          }
        }
      })
      .then(function () {
        // Wiki (story_wiki)
        var raw = localStorage.getItem('zenWriter_story_wiki');
        if (raw) {
          try {
            var pages = JSON.parse(raw);
            if (Array.isArray(pages) && pages.length > 0) {
              counts.wiki = pages.length;
              migrated = true;
              return putAll('wiki', pages).then(function () {
                localStorage.removeItem('zenWriter_story_wiki');
              });
            }
          } catch (e) {
            console.warn('[IDB] Failed to parse zenWriter_story_wiki:', e);
          }
        }
      })
      .then(function () {
        if (migrated) {
          console.log('[IDB] Migration complete:', counts);
        }
        return { migrated: migrated, counts: counts };
      });
  }

  // ---- Public API ----

  window.ZenWriterIDB = {
    open: open,
    isAvailable: function () { return isAvailable && db !== null; },

    // Documents
    getDoc: getDoc,
    putDoc: putDoc,
    deleteDoc: deleteDoc,
    getAllDocs: getAllDocs,

    // Assets
    getAsset: getAsset,
    putAsset: putAsset,
    deleteAsset: deleteAsset,
    getAllAssets: getAllAssets,

    // Snapshots
    getSnapshots: getSnapshots,
    addSnapshot: addSnapshot,
    clearSnapshots: clearSnapshots,

    // Wiki
    getWikiPages: getWikiPages,
    putWikiPage: putWikiPage,
    deleteWikiPage: deleteWikiPage,

    // Nodegraph
    getNodegraph: getNodegraph,
    putNodegraph: putNodegraph,

    // Migration
    migrateFromLocalStorage: migrateFromLocalStorage
  };
})();
