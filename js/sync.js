/**
 * sync.js - Offline-First Sync Engine for Legal Case Management PWA
 * Handles bidirectional sync between local IndexedDB and Firestore.
 * Conflict resolution: last-write-wins by updatedAt timestamp.
 */
(function () {
  'use strict';

  const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
  const MAX_RETRIES = 5;
  const RATE_LIMIT_MS = 200; // 5 writes per second
  const LAST_SYNC_KEY = 'lastSyncTimestamp';

  let syncInProgress = false;
  let intervalId = null;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function dispatchSyncEvent(detail) {
    window.dispatchEvent(new CustomEvent('sync-status-changed', { detail: detail }));
  }

  function getLastSyncTimestamp() {
    return localStorage.getItem(LAST_SYNC_KEY) || '1970-01-01T00:00:00.000Z';
  }

  function setLastSyncTimestamp(ts) {
    localStorage.setItem(LAST_SYNC_KEY, ts);
  }

  // ─── Queue Management ─────────────────────────────────────────────────────

  async function addToQueue(operation, collection, documentId, data, parentId) {
    var entry = {
      id: generateUUID(),
      operation: operation,
      collection: collection,
      documentId: documentId,
      parentId: parentId || null,
      data: data || {},
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    };

    await window.DB.put('syncQueue', entry);
    dispatchSyncEvent({ action: 'queued', entry: entry });
    attemptSync();
    return entry;
  }

  async function getPendingItems() {
    var all = await window.DB.getAll('syncQueue');
    return all.filter(function (item) { return item.status === 'pending'; });
  }

  async function getFailedItems() {
    var all = await window.DB.getAll('syncQueue');
    return all.filter(function (item) { return item.status === 'failed'; });
  }

  async function removeFromQueue(id) {
    await window.DB.delete('syncQueue', id);
  }

  async function updateQueueItem(item) {
    await window.DB.put('syncQueue', item);
  }

  // ─── PUSH: Local → Firestore ──────────────────────────────────────────────

  async function pushChanges() {
    var pending = await getPendingItems();
    if (pending.length === 0) return;

    dispatchSyncEvent({ action: 'push-start', count: pending.length });

    for (var i = 0; i < pending.length; i++) {
      var item = pending[i];
      try {
        await executFirestoreWrite(item);
        await removeFromQueue(item.id);
        await updateLocalRecordSyncStatus(item, 'synced');
        dispatchSyncEvent({ action: 'push-item-success', item: item });
      } catch (err) {
        item.retryCount = (item.retryCount || 0) + 1;
        if (item.retryCount >= MAX_RETRIES) {
          item.status = 'failed';
        }
        await updateQueueItem(item);
        dispatchSyncEvent({ action: 'push-item-failed', item: item, error: err.message });
      }

      // Rate limiting: max 5 writes per second
      if (i < pending.length - 1) {
        await sleep(RATE_LIMIT_MS);
      }
    }

    dispatchSyncEvent({ action: 'push-complete' });
  }

  async function executFirestoreWrite(item) {
    var fb = window.FirebaseApp;
    if (!fb) throw new Error('FirebaseApp not available');

    switch (item.operation) {
      case 'create':
        if (item.parentId) {
          await fb.createSubDocument(item.collection, item.parentId, item.documentId, item.data);
        } else {
          await fb.createDocument(item.collection, item.documentId, item.data);
        }
        break;

      case 'update':
        if (item.parentId) {
          await fb.updateSubDocument(item.collection, item.parentId, item.documentId, item.data);
        } else {
          await fb.updateDocument(item.collection, item.documentId, item.data);
        }
        break;

      case 'delete':
        if (item.parentId) {
          await fb.deleteSubDocument(item.collection, item.parentId, item.documentId);
        } else {
          await fb.deleteDocument(item.collection, item.documentId);
        }
        break;

      default:
        throw new Error('Unknown operation: ' + item.operation);
    }
  }

  async function updateLocalRecordSyncStatus(item, status) {
    try {
      var store = item.collection;
      var record = await window.DB.get(store, item.documentId);
      if (record) {
        record.syncStatus = status;
        await window.DB.put(store, record);
      }
    } catch (e) {
      // Non-critical: local record may already be gone for deletes
    }
  }

  // ─── PULL: Firestore → Local ──────────────────────────────────────────────

  async function pullChanges() {
    var fb = window.FirebaseApp;
    if (!fb) return;

    var lastSync = getLastSyncTimestamp();
    dispatchSyncEvent({ action: 'pull-start', since: lastSync });

    try {
      var collections = ['cases', 'proceedings', 'compliance'];
      var latestTimestamp = lastSync;

      for (var c = 0; c < collections.length; c++) {
        var collection = collections[c];
        var remoteRecords = await fb.fetchUpdatedSince(collection, lastSync);

        if (!remoteRecords || !Array.isArray(remoteRecords)) continue;

        for (var r = 0; r < remoteRecords.length; r++) {
          var remote = remoteRecords[r];
          var localRecord = await window.DB.get(collection, remote.id);

          // Conflict resolution: local pending wins (offline edits preserved)
          if (localRecord && localRecord.syncStatus === 'pending') {
            continue;
          }

          // Last-write-wins: only apply if remote is newer
          if (localRecord && localRecord.updatedAt && remote.updatedAt) {
            if (new Date(localRecord.updatedAt) >= new Date(remote.updatedAt)) {
              continue;
            }
          }

          // Apply remote update
          remote.syncStatus = 'synced';
          await window.DB.put(collection, remote);

          // Track the latest timestamp we've seen
          if (remote.updatedAt && remote.updatedAt > latestTimestamp) {
            latestTimestamp = remote.updatedAt;
          }
        }
      }

      setLastSyncTimestamp(latestTimestamp);
      dispatchSyncEvent({ action: 'pull-complete', lastSync: latestTimestamp });
    } catch (err) {
      dispatchSyncEvent({ action: 'pull-failed', error: err.message });
    }
  }

  // ─── Full Sync Cycle ──────────────────────────────────────────────────────

  async function attemptSync() {
    if (syncInProgress) return;
    if (!navigator.onLine) {
      dispatchSyncEvent({ action: 'offline' });
      return;
    }

    syncInProgress = true;
    dispatchSyncEvent({ action: 'sync-start' });

    try {
      await pushChanges();
      await pullChanges();
      dispatchSyncEvent({ action: 'sync-complete' });
    } catch (err) {
      dispatchSyncEvent({ action: 'sync-error', error: err.message });
    } finally {
      syncInProgress = false;
    }
  }

  // ─── Status ───────────────────────────────────────────────────────────────

  async function getSyncStatus() {
    var all = await window.DB.getAll('syncQueue');
    var pending = 0;
    var failed = 0;

    for (var i = 0; i < all.length; i++) {
      if (all[i].status === 'pending') pending++;
      if (all[i].status === 'failed') failed++;
    }

    return {
      pending: pending,
      failed: failed,
      lastSync: getLastSyncTimestamp()
    };
  }

  // ─── Retry Failed ─────────────────────────────────────────────────────────

  async function retryFailed() {
    var failed = await getFailedItems();
    for (var i = 0; i < failed.length; i++) {
      failed[i].status = 'pending';
      failed[i].retryCount = 0;
      await updateQueueItem(failed[i]);
    }
    dispatchSyncEvent({ action: 'retry-failed', count: failed.length });
    if (failed.length > 0) {
      attemptSync();
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    // 1. Sync on app load
    attemptSync();

    // 2. Sync when app returns to foreground
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        attemptSync();
      }
    });

    // 3. Sync when coming back online
    window.addEventListener('online', function () {
      attemptSync();
    });

    // 4. After every local write - handled via addToQueue calling attemptSync

    // 5. Periodic sync every 10 minutes
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(attemptSync, SYNC_INTERVAL_MS);

    dispatchSyncEvent({ action: 'initialized' });
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  window.Sync = {
    init: init,
    attemptSync: attemptSync,
    pushChanges: pushChanges,
    pullChanges: pullChanges,
    getSyncStatus: getSyncStatus,
    addToQueue: addToQueue,
    retryFailed: retryFailed
  };

})();
