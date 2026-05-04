/**
 * Firebase Abstraction Layer for Legal Case Management PWA
 *
 * Assumes Firebase is initialized in index.html module script and the following
 * are available on window:
 *   - window.firebaseApp, window.firebaseDb, window.firebaseAuth
 *   - window.firestoreDoc, window.firestoreCollection, window.firestoreGetDoc
 *   - window.firestoreSetDoc, window.firestoreGetDocs, window.firestoreQuery
 *   - window.firestoreWhere, window.firestoreOrderBy
 */

(function () {
  'use strict';

  // --- Rate Limiter (max 5 writes per second) ---
  const rateLimiter = {
    timestamps: [],
    maxWrites: 5,
    windowMs: 1000,

    async waitForSlot() {
      const now = Date.now();
      // Remove timestamps older than the window
      this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);

      if (this.timestamps.length >= this.maxWrites) {
        const oldestInWindow = this.timestamps[0];
        const waitTime = this.windowMs - (now - oldestInWindow) + 10;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitForSlot();
      }

      this.timestamps.push(Date.now());
    }
  };

  // --- Helper: get Firestore db reference ---
  function getDb() {
    return window.firebaseDb;
  }

  function getAuth() {
    return window.firebaseAuth;
  }

  // --- FirebaseApp namespace ---
  window.FirebaseApp = {

    /**
     * Verify Firebase connection is ready.
     * Returns true if Firebase app and db are available.
     */
    init() {
      try {
        const app = window.firebaseApp;
        const db = getDb();
        const auth = getAuth();
        if (!app || !db || !auth) {
          console.error('[FirebaseApp] Firebase not initialized. Ensure index.html module script has run.');
          return false;
        }
        console.log('[FirebaseApp] Firebase connection verified.');
        return true;
      } catch (err) {
        console.error('[FirebaseApp] init error:', err.message);
        return false;
      }
    },

    /**
     * Check if Firebase is reachable (uses navigator.onLine as proxy).
     */
    isOnline() {
      return navigator.onLine;
    },

    /**
     * Save a case document to /cases/{caseId}
     * @param {Object} caseData - Must include an `id` field used as document ID.
     * @returns {boolean} success
     */
    async saveCaseToFirestore(caseData) {
      try {
        if (!caseData || !caseData.id) {
          console.error('[FirebaseApp] saveCaseToFirestore: caseData must have an id.');
          return false;
        }
        await rateLimiter.waitForSlot();
        const db = getDb();
        const docRef = window.firestoreDoc(db, 'cases', caseData.id);
        await window.firestoreSetDoc(docRef, caseData, { merge: true });
        return true;
      } catch (err) {
        console.error('[FirebaseApp] saveCaseToFirestore error:', err.message);
        return false;
      }
    },

    /**
     * Get a single case document from /cases/{caseId}
     * @param {string} caseId
     * @returns {Object|null}
     */
    async getCaseFromFirestore(caseId) {
      try {
        if (!caseId) {
          console.error('[FirebaseApp] getCaseFromFirestore: caseId is required.');
          return null;
        }
        const db = getDb();
        const docRef = window.firestoreDoc(db, 'cases', caseId);
        const snapshot = await window.firestoreGetDoc(docRef);
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
      } catch (err) {
        console.error('[FirebaseApp] getCaseFromFirestore error:', err.message);
        return null;
      }
    },

    /**
     * Get all cases where updatedAt > since timestamp (for pull sync).
     * @param {number|string|Date} since - Timestamp to filter by.
     * @returns {Array}
     */
    async getAllCasesFromFirestore(since) {
      try {
        const db = getDb();
        const casesRef = window.firestoreCollection(db, 'cases');
        let q;

        if (since) {
          const sinceTimestamp = since instanceof Date ? since.getTime() : Number(since);
          q = window.firestoreQuery(
            casesRef,
            window.firestoreWhere('updatedAt', '>', sinceTimestamp),
            window.firestoreOrderBy('updatedAt', 'asc')
          );
        } else {
          q = window.firestoreQuery(casesRef, window.firestoreOrderBy('updatedAt', 'desc'));
        }

        const snapshot = await window.firestoreGetDocs(q);
        const cases = [];
        snapshot.forEach(doc => {
          cases.push({ id: doc.id, ...doc.data() });
        });
        return cases;
      } catch (err) {
        console.error('[FirebaseApp] getAllCasesFromFirestore error:', err.message);
        return [];
      }
    },

    /**
     * Soft delete a case in Firestore (sets deleted flag and updatedAt).
     * @param {string} caseId
     * @returns {boolean} success
     */
    async deleteCaseFromFirestore(caseId) {
      try {
        if (!caseId) {
          console.error('[FirebaseApp] deleteCaseFromFirestore: caseId is required.');
          return false;
        }
        await rateLimiter.waitForSlot();
        const db = getDb();
        const docRef = window.firestoreDoc(db, 'cases', caseId);
        await window.firestoreSetDoc(docRef, {
          deleted: true,
          updatedAt: Date.now()
        }, { merge: true });
        return true;
      } catch (err) {
        console.error('[FirebaseApp] deleteCaseFromFirestore error:', err.message);
        return false;
      }
    },

    /**
     * Save a proceeding to /cases/{caseId}/proceedings/{id}
     * @param {string} caseId
     * @param {Object} data - Must include an `id` field.
     * @returns {boolean} success
     */
    async saveProceedingToFirestore(caseId, data) {
      try {
        if (!caseId || !data || !data.id) {
          console.error('[FirebaseApp] saveProceedingToFirestore: caseId and data.id are required.');
          return false;
        }
        await rateLimiter.waitForSlot();
        const db = getDb();
        const docRef = window.firestoreDoc(db, 'cases', caseId, 'proceedings', data.id);
        await window.firestoreSetDoc(docRef, data, { merge: true });
        return true;
      } catch (err) {
        console.error('[FirebaseApp] saveProceedingToFirestore error:', err.message);
        return false;
      }
    },

    /**
     * Get all proceedings for a case from /cases/{caseId}/proceedings
     * @param {string} caseId
     * @returns {Array}
     */
    async getProceedingsFromFirestore(caseId) {
      try {
        if (!caseId) {
          console.error('[FirebaseApp] getProceedingsFromFirestore: caseId is required.');
          return [];
        }
        const db = getDb();
        const collRef = window.firestoreCollection(db, 'cases', caseId, 'proceedings');
        const snapshot = await window.firestoreGetDocs(collRef);
        const results = [];
        snapshot.forEach(doc => {
          results.push({ id: doc.id, ...doc.data() });
        });
        return results;
      } catch (err) {
        console.error('[FirebaseApp] getProceedingsFromFirestore error:', err.message);
        return [];
      }
    },

    /**
     * Save a compliance record to /cases/{caseId}/compliance/{id}
     * @param {string} caseId
     * @param {Object} data - Must include an `id` field.
     * @returns {boolean} success
     */
    async saveComplianceToFirestore(caseId, data) {
      try {
        if (!caseId || !data || !data.id) {
          console.error('[FirebaseApp] saveComplianceToFirestore: caseId and data.id are required.');
          return false;
        }
        await rateLimiter.waitForSlot();
        const db = getDb();
        const docRef = window.firestoreDoc(db, 'cases', caseId, 'compliance', data.id);
        await window.firestoreSetDoc(docRef, data, { merge: true });
        return true;
      } catch (err) {
        console.error('[FirebaseApp] saveComplianceToFirestore error:', err.message);
        return false;
      }
    },

    /**
     * Get all compliance records for a case from /cases/{caseId}/compliance
     * @param {string} caseId
     * @returns {Array}
     */
    async getComplianceFromFirestore(caseId) {
      try {
        if (!caseId) {
          console.error('[FirebaseApp] getComplianceFromFirestore: caseId is required.');
          return [];
        }
        const db = getDb();
        const collRef = window.firestoreCollection(db, 'cases', caseId, 'compliance');
        const snapshot = await window.firestoreGetDocs(collRef);
        const results = [];
        snapshot.forEach(doc => {
          results.push({ id: doc.id, ...doc.data() });
        });
        return results;
      } catch (err) {
        console.error('[FirebaseApp] getComplianceFromFirestore error:', err.message);
        return [];
      }
    },

    /**
     * Read app settings from /settings/app
     * @returns {Object|null}
     */
    async getSettings() {
      try {
        const db = getDb();
        const docRef = window.firestoreDoc(db, 'settings', 'app');
        const snapshot = await window.firestoreGetDoc(docRef);
        if (snapshot.exists()) {
          return snapshot.data();
        }
        return null;
      } catch (err) {
        console.error('[FirebaseApp] getSettings error:', err.message);
        return null;
      }
    },

    /**
     * Save app settings to /settings/app
     * @param {Object} data
     * @returns {boolean} success
     */
    async saveSettings(data) {
      try {
        if (!data) {
          console.error('[FirebaseApp] saveSettings: data is required.');
          return false;
        }
        await rateLimiter.waitForSlot();
        const db = getDb();
        const docRef = window.firestoreDoc(db, 'settings', 'app');
        await window.firestoreSetDoc(docRef, data, { merge: true });
        return true;
      } catch (err) {
        console.error('[FirebaseApp] saveSettings error:', err.message);
        return false;
      }
    },

    /**
     * Sign in anonymously with Firebase Auth.
     * @returns {Object|null} user object or null on failure
     */
    async signInAnonymously() {
      try {
        const auth = getAuth();
        const result = await auth.signInAnonymously(auth);
        console.log('[FirebaseApp] Signed in anonymously:', result.user.uid);
        return result.user;
      } catch (err) {
        console.error('[FirebaseApp] signInAnonymously error:', err.message);
        return null;
      }
    },

    /**
     * Sign out the current Firebase user.
     * @returns {boolean} success
     */
    async signOut() {
      try {
        const auth = getAuth();
        await auth.signOut();
        console.log('[FirebaseApp] Signed out successfully.');
        return true;
      } catch (err) {
        console.error('[FirebaseApp] signOut error:', err.message);
        return false;
      }
    },

    /**
     * Get the currently signed-in Firebase Auth user.
     * @returns {Object|null}
     */
    getCurrentUser() {
      try {
        const auth = getAuth();
        return auth.currentUser || null;
      } catch (err) {
        console.error('[FirebaseApp] getCurrentUser error:', err.message);
        return null;
      }
    }
  };

  console.log('[FirebaseApp] Firebase abstraction layer loaded.');
})();
