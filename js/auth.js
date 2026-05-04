/**
 * auth.js - PIN Authentication Module
 * Legal Case Management PWA
 *
 * Uses Firebase Anonymous Auth + PIN role system.
 * Roles: "admin" (Clerk - full CRUD), "viewer" (DEO - read-only)
 * PIN: 6 digits, stored as SHA-256 hash
 * Session: persists 7 days in localStorage
 * Offline: falls back to IndexedDB for PIN verification
 *
 * Dependencies: window.DB (IndexedDB wrapper), window.FirebaseApp (Firebase wrapper)
 */

(function () {
  'use strict';

  const SESSION_KEY = 'deo_session';
  const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Hash a PIN string using SHA-256 via Web Crypto API.
   * @param {string} pin - The 6-digit PIN
   * @returns {Promise<string>} Hex-encoded SHA-256 hash
   */
  async function hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if the current session is valid (within 7 days).
   * @returns {string|null} Role ('admin'|'viewer') or null if session expired/missing
   */
  function initAuth() {
    const session = getSessionInfo();
    if (!session) return null;

    const now = new Date().getTime();
    const expiresAt = new Date(session.expiresAt).getTime();

    if (now >= expiresAt) {
      logout();
      return null;
    }

    return session.role;
  }

  /**
   * Store hashed PINs in Firestore /settings/app AND local IndexedDB settings store.
   * @param {string} adminPin - 6-digit admin PIN (plaintext, will be hashed)
   * @param {string} viewerPin - 6-digit viewer PIN (plaintext, will be hashed)
   */
  async function setupPin(adminPin, viewerPin) {
    const adminHash = await hashPin(adminPin);
    const viewerHash = await hashPin(viewerPin);

    const pinData = {
      adminPinHash: adminHash,
      viewerPinHash: viewerHash,
      updatedAt: new Date().toISOString()
    };

    // Store in Firestore
    try {
      const db = window.FirebaseApp.firestore();
      await db.collection('settings').doc('app').set(pinData, { merge: true });
    } catch (err) {
      console.warn('Auth: Failed to store PINs in Firestore (offline?)', err);
    }

    // Store in IndexedDB for offline access
    try {
      await window.DB.put('settings', { id: 'pinConfig', ...pinData });
    } catch (err) {
      console.warn('Auth: Failed to store PINs in IndexedDB', err);
    }
  }

  /**
   * Verify a PIN against stored hash. Creates Firebase anonymous auth session
   * and stores session in localStorage with timestamp.
   * @param {string} pin - The PIN to verify
   * @param {string} role - 'admin' or 'viewer'
   * @returns {Promise<boolean>} True if PIN is valid for the given role
   */
  async function verifyPin(pin, role) {
    const inputHash = await hashPin(pin);
    const hashField = role === 'admin' ? 'adminPinHash' : 'viewerPinHash';

    let storedHash = null;

    // Try Firestore first
    try {
      const db = window.FirebaseApp.firestore();
      const doc = await db.collection('settings').doc('app').get();
      if (doc.exists) {
        storedHash = doc.data()[hashField];
      }
    } catch (err) {
      console.warn('Auth: Firestore unavailable, falling back to IndexedDB', err);
    }

    // Fallback to IndexedDB if Firestore failed
    if (!storedHash) {
      try {
        const localConfig = await window.DB.get('settings', 'pinConfig');
        if (localConfig) {
          storedHash = localConfig[hashField];
        }
      } catch (err) {
        console.error('Auth: Failed to read PIN from IndexedDB', err);
        return false;
      }
    }

    if (!storedHash || inputHash !== storedHash) {
      return false;
    }

    // Create Firebase anonymous auth session
    try {
      await window.FirebaseApp.auth().signInAnonymously();
    } catch (err) {
      console.warn('Auth: Firebase anonymous sign-in failed (offline?)', err);
    }

    // Store session in localStorage
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
    const session = {
      role: role,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return true;
  }

  /**
   * Get the current role from localStorage session.
   * @returns {string|null} 'admin', 'viewer', or null
   */
  function getCurrentRole() {
    const session = getSessionInfo();
    if (!session) return null;

    const now = new Date().getTime();
    const expiresAt = new Date(session.expiresAt).getTime();
    if (now >= expiresAt) {
      logout();
      return null;
    }

    return session.role;
  }

  /**
   * @returns {boolean} True if current role is admin
   */
  function isAdmin() {
    return getCurrentRole() === 'admin';
  }

  /**
   * @returns {boolean} True if current role is viewer
   */
  function isViewer() {
    return getCurrentRole() === 'viewer';
  }

  /**
   * Clear session from localStorage.
   */
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    try {
      window.FirebaseApp.auth().signOut();
    } catch (err) {
      // Ignore sign-out errors (e.g., offline)
    }
  }

  /**
   * Check if PINs have been set up. Checks local IndexedDB first, then Firestore.
   * @returns {Promise<boolean>} True if setup is required (no PINs found)
   */
  async function isSetupRequired() {
    // Check IndexedDB first (faster, works offline)
    try {
      const localConfig = await window.DB.get('settings', 'pinConfig');
      if (localConfig && localConfig.adminPinHash && localConfig.viewerPinHash) {
        return false;
      }
    } catch (err) {
      console.warn('Auth: IndexedDB check failed', err);
    }

    // Check Firestore
    try {
      const db = window.FirebaseApp.firestore();
      const doc = await db.collection('settings').doc('app').get();
      if (doc.exists) {
        const data = doc.data();
        if (data.adminPinHash && data.viewerPinHash) {
          // Cache in IndexedDB for offline use
          try {
            await window.DB.put('settings', {
              id: 'pinConfig',
              adminPinHash: data.adminPinHash,
              viewerPinHash: data.viewerPinHash,
              updatedAt: data.updatedAt || new Date().toISOString()
            });
          } catch (cacheErr) {
            console.warn('Auth: Failed to cache PINs in IndexedDB', cacheErr);
          }
          return false;
        }
      }
    } catch (err) {
      console.warn('Auth: Firestore check failed (offline?)', err);
    }

    return true;
  }

  /**
   * Get current session info.
   * @returns {{role: string, expiresAt: string}|null}
   */
  function getSessionInfo() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;

      const session = JSON.parse(raw);
      if (!session.role || !session.expiresAt) return null;

      return { role: session.role, expiresAt: session.expiresAt };
    } catch (err) {
      return null;
    }
  }

  // Attach to window.Auth
  window.Auth = {
    initAuth: initAuth,
    hashPin: hashPin,
    setupPin: setupPin,
    verifyPin: verifyPin,
    getCurrentRole: getCurrentRole,
    isAdmin: isAdmin,
    isViewer: isViewer,
    logout: logout,
    isSetupRequired: isSetupRequired,
    getSessionInfo: getSessionInfo
  };

})();
