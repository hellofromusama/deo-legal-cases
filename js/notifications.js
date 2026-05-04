/**
 * Notification System for Legal Case Management PWA
 * Uses Web Notifications API + Service Worker
 */
(function () {
  'use strict';

  const STORAGE_KEY_SETTINGS = 'notification_settings';
  const STORAGE_KEY_SCHEDULED = 'scheduled_notifications';

  // Default settings
  const DEFAULT_SETTINGS = {
    hearingReminders: true,
    replyReminders: true,
    complianceReminders: true,
    advanceDays: 3
  };

  // Active timeout IDs for scheduled notifications
  let activeTimeouts = [];

  /**
   * Get notification settings from localStorage
   */
  function getSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Notifications: failed to read settings', e);
    }
    return Object.assign({}, DEFAULT_SETTINGS);
  }

  /**
   * Save notification preferences to localStorage
   */
  function updateSettings(settings) {
    const merged = Object.assign({}, DEFAULT_SETTINGS, settings);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged));
    // Re-schedule with new settings
    scheduleAllNotifications();
    return merged;
  }

  /**
   * Request notification permission with a friendly explanation
   */
  async function requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications: not supported in this browser');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      console.warn('Notifications: permission previously denied by user');
      return 'denied';
    }

    // Show explanation before requesting
    const explanation = document.createElement('div');
    explanation.id = 'notification-permission-dialog';
    explanation.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;">
        <div style="background:#fff;border-radius:12px;padding:24px;max-width:400px;margin:16px;box-shadow:0 4px 24px rgba(0,0,0,0.2);">
          <h3 style="margin:0 0 12px;">\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u06CC \u0627\u062C\u0627\u0632\u062A | Notification Permission</h3>
          <p style="margin:0 0 16px;color:#555;line-height:1.6;">
            We need your permission to send reminders for court hearings, reply deadlines, and compliance dates.
            <br><br>
            \u06C1\u0645\u06CC\u06BA \u0633\u0645\u0627\u0639\u062A\u060C \u062C\u0648\u0627\u0628 \u06A9\u06CC \u0622\u062E\u0631\u06CC \u062A\u0627\u0631\u06CC\u062E \u0627\u0648\u0631 \u062A\u0639\u0645\u06CC\u0644 \u06A9\u06CC \u06CC\u0627\u062F\u062F\u06C1\u0627\u0646\u06CC \u0628\u06BE\u06CC\u062C\u0646\u06D2 \u06A9\u06D2 \u0644\u06CC\u06D2 \u0622\u067E \u06A9\u06CC \u0627\u062C\u0627\u0632\u062A \u062F\u0631\u06A9\u0627\u0631 \u06C1\u06D2\u06D4
          </p>
          <button id="notification-permission-allow" style="background:#1a73e8;color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:14px;margin-right:8px;">
            Allow | \u0627\u062C\u0627\u0632\u062A \u062F\u06CC\u06BA
          </button>
          <button id="notification-permission-deny" style="background:#eee;color:#333;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:14px;">
            Not Now | \u0627\u0628\u06BE\u06CC \u0646\u06C1\u06CC\u06BA
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(explanation);

    return new Promise(function (resolve) {
      document.getElementById('notification-permission-allow').addEventListener('click', async function () {
        explanation.remove();
        const result = await Notification.requestPermission();
        resolve(result);
      });
      document.getElementById('notification-permission-deny').addEventListener('click', function () {
        explanation.remove();
        resolve('default');
      });
    });
  }

  /**
   * Cancel all currently scheduled notifications
   */
  function cancelAllNotifications() {
    // Clear all active timeouts
    activeTimeouts.forEach(function (id) {
      clearTimeout(id);
    });
    activeTimeouts = [];

    // Clear stored schedule
    localStorage.removeItem(STORAGE_KEY_SCHEDULED);
  }

  /**
   * Schedule a single notification
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Date|number} scheduledTime - When to show the notification
   * @param {string} tag - Unique tag to prevent duplicates (caseId + type)
   */
  function scheduleNotification(title, body, scheduledTime, tag) {
    const now = Date.now();
    const targetTime = scheduledTime instanceof Date ? scheduledTime.getTime() : scheduledTime;
    const delay = targetTime - now;

    // Don't schedule if the time has already passed
    if (delay <= 0) {
      return null;
    }

    var timeoutId = setTimeout(async function () {
      try {
        // Prefer service worker notification (works better for PWA)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body: body,
            tag: tag,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            vibrate: [200, 100, 200],
            requireInteraction: true
          });
        } else if (Notification.permission === 'granted') {
          // Fallback to basic notification
          new Notification(title, {
            body: body,
            tag: tag,
            icon: '/icons/icon-192.png'
          });
        }
      } catch (e) {
        console.error('Notifications: failed to show notification', e);
      }

      // Remove from active timeouts
      var idx = activeTimeouts.indexOf(timeoutId);
      if (idx > -1) activeTimeouts.splice(idx, 1);
    }, delay);

    activeTimeouts.push(timeoutId);

    // Track scheduled notification
    var scheduled = JSON.parse(localStorage.getItem(STORAGE_KEY_SCHEDULED) || '[]');
    scheduled.push({ tag: tag, time: targetTime, title: title });
    localStorage.setItem(STORAGE_KEY_SCHEDULED, JSON.stringify(scheduled));

    return timeoutId;
  }

  /**
   * Schedule all notifications based on active cases from IndexedDB
   */
  async function scheduleAllNotifications() {
    if (Notification.permission !== 'granted') {
      return;
    }

    // Clear previous schedules
    cancelAllNotifications();

    var settings = getSettings();

    // Fetch cases from IndexedDB via window.DB
    var cases = [];
    try {
      if (window.DB && typeof window.DB.getAllCases === 'function') {
        cases = await window.DB.getAllCases();
      } else if (window.DB && typeof window.DB.getAll === 'function') {
        cases = await window.DB.getAll('cases');
      } else {
        console.warn('Notifications: window.DB not available or missing methods');
        return;
      }
    } catch (e) {
      console.error('Notifications: failed to fetch cases', e);
      return;
    }

    var now = Date.now();

    cases.forEach(function (caseItem) {
      // Skip inactive/closed cases
      if (caseItem.status === 'closed' || caseItem.status === 'archived') {
        return;
      }

      var caseId = caseItem.id || caseItem._id || '';
      var caseTitle = caseItem.title || caseItem.caseTitle || 'Case';
      var courtName = caseItem.courtName || caseItem.court || '';

      // 1. Hearing Date Reminders
      if (settings.hearingReminders && caseItem.hearingDate) {
        var hearingDate = new Date(caseItem.hearingDate);
        var hearingTime = hearingDate.getTime();

        // 1 day before
        var oneDayBefore = hearingTime - (1 * 24 * 60 * 60 * 1000);
        if (oneDayBefore > now) {
          scheduleNotification(
            'Court Hearing Tomorrow | \u06A9\u0644 \u0633\u0645\u0627\u0639\u062A \u06C1\u06D2',
            caseTitle + ' \u2014 ' + courtName,
            oneDayBefore,
            caseId + '_hearing_1d'
          );
        }

        // 3 days before (or configurable advanceDays)
        var advanceDays = settings.advanceDays || 3;
        var advanceBefore = hearingTime - (advanceDays * 24 * 60 * 60 * 1000);
        if (advanceBefore > now) {
          scheduleNotification(
            'Court Hearing Tomorrow | \u06A9\u0644 \u0633\u0645\u0627\u0639\u062A \u06C1\u06D2',
            caseTitle + ' \u2014 ' + courtName,
            advanceBefore,
            caseId + '_hearing_' + advanceDays + 'd'
          );
        }
      }

      // 2. Reply Deadline Reminders
      if (settings.replyReminders && caseItem.replyDeadline) {
        var replyDate = new Date(caseItem.replyDeadline);
        var replyTime = replyDate.getTime();

        // On the day (morning, 8 AM)
        var onTheDay = new Date(replyDate);
        onTheDay.setHours(8, 0, 0, 0);
        if (onTheDay.getTime() > now) {
          scheduleNotification(
            'Reply Deadline Today | \u0622\u062C \u062C\u0648\u0627\u0628 \u06A9\u06CC \u0622\u062E\u0631\u06CC \u062A\u0627\u0631\u06CC\u062E \u06C1\u06D2',
            caseTitle,
            onTheDay.getTime(),
            caseId + '_reply_0d'
          );
        }

        // 1 day before
        var replyOneDayBefore = replyTime - (1 * 24 * 60 * 60 * 1000);
        if (replyOneDayBefore > now) {
          scheduleNotification(
            'Reply Deadline Today | \u0622\u062C \u062C\u0648\u0627\u0628 \u06A9\u06CC \u0622\u062E\u0631\u06CC \u062A\u0627\u0631\u06CC\u062E \u06C1\u06D2',
            caseTitle,
            replyOneDayBefore,
            caseId + '_reply_1d'
          );
        }
      }

      // 3. Compliance Deadline Reminders
      if (settings.complianceReminders && caseItem.complianceDeadline) {
        var complianceDate = new Date(caseItem.complianceDeadline);
        var complianceTime = complianceDate.getTime();
        var complianceDesc = caseItem.complianceDescription || caseItem.complianceNote || '';

        // 3 days before
        var compThreeDaysBefore = complianceTime - (3 * 24 * 60 * 60 * 1000);
        if (compThreeDaysBefore > now) {
          scheduleNotification(
            'Compliance Due | \u062A\u0639\u0645\u06CC\u0644 \u06A9\u06CC \u062A\u0627\u0631\u06CC\u062E \u0642\u0631\u06CC\u0628 \u06C1\u06D2',
            caseTitle + (complianceDesc ? ' \u2014 ' + complianceDesc : ''),
            compThreeDaysBefore,
            caseId + '_compliance_3d'
          );
        }
      }
    });
  }

  /**
   * Initialize the notification system
   */
  async function init() {
    var permission = await requestPermission();
    if (permission === 'granted') {
      await scheduleAllNotifications();
    }
  }

  // Expose on window
  window.Notifications = {
    init: init,
    requestPermission: requestPermission,
    scheduleAllNotifications: scheduleAllNotifications,
    scheduleNotification: scheduleNotification,
    cancelAllNotifications: cancelAllNotifications,
    getSettings: getSettings,
    updateSettings: updateSettings
  };
})();
