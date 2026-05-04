/**
 * db.js - IndexedDB Wrapper for Legal Case Management PWA
 * Uses the `idb` library (loaded globally from CDN)
 */

(function () {
  'use strict';

  const DB_NAME = 'deoLegalDB';
  const DB_VERSION = 1;

  let dbInstance = null;

  async function initDB() {
    if (dbInstance) return dbInstance;

    dbInstance = await idb.openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Cases store
        if (!db.objectStoreNames.contains('cases')) {
          db.createObjectStore('cases', { keyPath: 'caseId' });
        }

        // Proceedings store
        if (!db.objectStoreNames.contains('proceedings')) {
          const procStore = db.createObjectStore('proceedings', { keyPath: 'id' });
          procStore.createIndex('byCaseId', 'caseId');
        }

        // Compliance store
        if (!db.objectStoreNames.contains('compliance')) {
          const compStore = db.createObjectStore('compliance', { keyPath: 'id' });
          compStore.createIndex('byCaseId', 'caseId');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      }
    });

    return dbInstance;
  }

  async function getDB() {
    if (!dbInstance) await initDB();
    return dbInstance;
  }

  // ─── Cases ───────────────────────────────────────────────────────────────────

  async function getAllCases() {
    const db = await getDB();
    const allCases = await db.getAll('cases');
    return allCases
      .filter(c => c.isDeleted !== true)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  async function getCaseById(caseId) {
    const db = await getDB();
    return db.get('cases', caseId);
  }

  async function saveCase(caseData) {
    const db = await getDB();
    caseData.updatedAt = new Date().toISOString();
    if (!caseData.createdAt) {
      caseData.createdAt = caseData.updatedAt;
    }
    return db.put('cases', caseData);
  }

  async function deleteCase(caseId) {
    const db = await getDB();
    const caseData = await db.get('cases', caseId);
    if (caseData) {
      caseData.isDeleted = true;
      caseData.updatedAt = new Date().toISOString();
      await db.put('cases', caseData);
    }
  }

  async function getCaseCount() {
    const db = await getDB();
    const allCases = await db.getAll('cases');
    return allCases.filter(c => c.isDeleted !== true).length;
  }

  async function getNextCaseNumber() {
    const db = await getDB();
    const allCases = await db.getAll('cases');
    let maxNum = 0;
    allCases.forEach(c => {
      const match = c.caseId && c.caseId.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return maxNum + 1;
  }

  // ─── Proceedings ─────────────────────────────────────────────────────────────

  async function getProceedings(caseId) {
    const db = await getDB();
    const tx = db.transaction('proceedings', 'readonly');
    const index = tx.store.index('byCaseId');
    const results = await index.getAll(caseId);
    return results.sort((a, b) => new Date(b.hearingDate) - new Date(a.hearingDate));
  }

  async function saveProceeding(data) {
    const db = await getDB();
    if (!data.id) {
      data.id = 'proc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    data.updatedAt = new Date().toISOString();
    return db.put('proceedings', data);
  }

  // ─── Compliance ──────────────────────────────────────────────────────────────

  async function getCompliance(caseId) {
    const db = await getDB();
    const tx = db.transaction('compliance', 'readonly');
    const index = tx.store.index('byCaseId');
    return index.getAll(caseId);
  }

  async function saveCompliance(data) {
    const db = await getDB();
    if (!data.id) {
      data.id = 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    data.updatedAt = new Date().toISOString();
    return db.put('compliance', data);
  }

  // ─── Sync Queue ──────────────────────────────────────────────────────────────

  async function addToSyncQueue(entry) {
    const db = await getDB();
    if (!entry.id) {
      entry.id = 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    entry.createdAt = new Date().toISOString();
    return db.put('syncQueue', entry);
  }

  async function getSyncQueue() {
    const db = await getDB();
    return db.getAll('syncQueue');
  }

  async function removeSyncQueueItem(id) {
    const db = await getDB();
    return db.delete('syncQueue', id);
  }

  // ─── Settings ────────────────────────────────────────────────────────────────

  async function getSetting(key) {
    const db = await getDB();
    const record = await db.get('settings', key);
    return record ? record.value : undefined;
  }

  async function setSetting(key, value) {
    const db = await getDB();
    return db.put('settings', { key, value, updatedAt: new Date().toISOString() });
  }

  // ─── Sample Data Seeding ─────────────────────────────────────────────────────

  async function seedSampleData() {
    const alreadySeeded = await getSetting('dataSeeded');
    if (alreadySeeded) return false;

    const now = Date.now();
    const DAY = 86400000;

    const sampleCases = [
      {
        caseId: 'DEO-2026-001',
        title: 'Muhammad Aslam Khan v. DEO Muzaffarabad',
        caseType: 'Service Matter',
        court: 'AJK Services Tribunal',
        courtBranch: 'Muzaffarabad',
        status: 'Active',
        priority: 'High',
        petitioner: 'Muhammad Aslam Khan',
        respondent: 'District Education Officer Muzaffarabad',
        advocate: 'Ch. Zulfiqar Ali Advocate',
        advocateContact: '0345-9876543',
        filingDate: new Date(now - 90 * DAY).toISOString(),
        nextHearingDate: new Date(now + 5 * DAY).toISOString(),
        lastHearingDate: new Date(now - 15 * DAY).toISOString(),
        caseNumber: 'ST/App/2026/087',
        description: 'Appeal against non-promotion from PST to HM despite seniority and qualifying criteria. Petitioner claims seniority list was manipulated.',
        reliefSought: 'Promotion to Headmaster (BPS-17) with back benefits from due date.',
        currentStage: 'Arguments in progress',
        remarks: 'Written arguments submitted by petitioner. Respondent to file reply.',
        tags: ['promotion', 'seniority', 'service-matter'],
        syncStatus: 'pending',
        isDeleted: false,
        createdAt: new Date(now - 90 * DAY).toISOString(),
        updatedAt: new Date(now - 2 * DAY).toISOString()
      },
      {
        caseId: 'DEO-2026-002',
        title: 'Rukhsana Bibi v. Secretary Education AJK & Others',
        caseType: 'Court/Tribunal Case',
        court: 'AJK High Court',
        courtBranch: 'Muzaffarabad',
        status: 'Stay Granted',
        priority: 'Urgent',
        petitioner: 'Rukhsana Bibi (SST)',
        respondent: 'Secretary Education AJK, DEO Muzaffarabad & Others',
        advocate: 'Sardar Amjad Hussain Advocate',
        advocateContact: '0300-5551234',
        filingDate: new Date(now - 45 * DAY).toISOString(),
        nextHearingDate: new Date(now + 2 * DAY).toISOString(),
        lastHearingDate: new Date(now - 10 * DAY).toISOString(),
        caseNumber: 'WP/2026/342',
        description: 'Writ petition challenging transfer order from GHS Chattar to GMS Leepa Valley. Stay order granted restraining transfer until next date.',
        reliefSought: 'Quashing of transfer order dated 15-02-2026 and restoration to original posting.',
        currentStage: 'Stay granted, reply due from respondents',
        remarks: 'URGENT: Reply is overdue. Court may vacate stay if reply not filed. Coordinate with Law Section immediately.',
        replyDueDate: new Date(now - 3 * DAY).toISOString(),
        isReplyOverdue: true,
        tags: ['transfer', 'stay-order', 'writ-petition', 'urgent'],
        syncStatus: 'pending',
        isDeleted: false,
        createdAt: new Date(now - 45 * DAY).toISOString(),
        updatedAt: new Date(now - 1 * DAY).toISOString()
      },
      {
        caseId: 'DEO-2026-003',
        title: 'Tariq Mehmood v. DEO Muzaffarabad (Contempt)',
        caseType: 'Contempt of Court',
        court: 'AJK High Court',
        courtBranch: 'Muzaffarabad',
        status: 'Compliance Pending',
        priority: 'Critical',
        petitioner: 'Tariq Mehmood (CT)',
        respondent: 'DEO Muzaffarabad',
        advocate: 'Barrister Khalid Mehmood',
        advocateContact: '0333-7778899',
        filingDate: new Date(now - 30 * DAY).toISOString(),
        nextHearingDate: new Date(now + 12 * DAY).toISOString(),
        lastHearingDate: new Date(now - 8 * DAY).toISOString(),
        caseNumber: 'CMA/Contempt/2026/156',
        description: 'Contempt petition for non-compliance of earlier order directing regularization of petitioner as CT (BPS-15). Court has issued notice to DEO to appear in person.',
        reliefSought: 'Implementation of regularization order and contempt proceedings against DEO.',
        currentStage: 'Personal appearance of DEO required',
        remarks: 'Critical: Must comply with original order before next hearing or risk contempt conviction. Prepare compliance report with supporting documents.',
        originalOrderDate: new Date(now - 120 * DAY).toISOString(),
        complianceDeadline: new Date(now + 10 * DAY).toISOString(),
        tags: ['contempt', 'regularization', 'personal-appearance', 'critical'],
        syncStatus: 'pending',
        isDeleted: false,
        createdAt: new Date(now - 30 * DAY).toISOString(),
        updatedAt: new Date(now - 1 * DAY).toISOString()
      },
      {
        caseId: 'DEO-2026-004',
        title: 'Haji Abdul Rashid RTI Appeal \u2014 School Land',
        caseType: 'RTI Appeal',
        court: 'AJK Ombudsman',
        courtBranch: 'Muzaffarabad',
        status: 'Active',
        priority: 'Medium',
        petitioner: 'Haji Abdul Rashid',
        respondent: 'DEO Muzaffarabad (Public Information Officer)',
        advocate: 'Self (in person)',
        advocateContact: 'N/A',
        filingDate: new Date(now - 60 * DAY).toISOString(),
        nextHearingDate: new Date(now + 20 * DAY).toISOString(),
        lastHearingDate: new Date(now - 20 * DAY).toISOString(),
        caseNumber: 'RTI/Appeal/2026/023',
        description: 'RTI appeal seeking disclosure of land record documents for GMS Danna school land. Applicant alleges encroachment and seeks copies of allotment orders and mutation records.',
        reliefSought: 'Disclosure of complete land record including allotment letter, mutation entries, and site plan of GMS Danna.',
        currentStage: 'PIO directed to provide information within 15 days',
        remarks: 'Gather land documents from record room. Coordinate with AEO concerned for physical verification report.',
        tags: ['rti', 'land-record', 'school-property'],
        syncStatus: 'pending',
        isDeleted: false,
        createdAt: new Date(now - 60 * DAY).toISOString(),
        updatedAt: new Date(now - 5 * DAY).toISOString()
      },
      {
        caseId: 'DEO-2026-005',
        title: 'GHS Panjgrain \u2014 Boundary Wall Land Dispute',
        caseType: 'Land/Property Dispute',
        court: 'Civil Court',
        courtBranch: 'Muzaffarabad',
        status: 'Active',
        priority: 'Medium',
        petitioner: 'Sajjad Hussain & Others (Adjacent Landowners)',
        respondent: 'Principal GHS Panjgrain through DEO Muzaffarabad',
        advocate: 'Raja Naveed Akhtar Advocate',
        advocateContact: '0346-5552233',
        filingDate: new Date(now - 180 * DAY).toISOString(),
        nextHearingDate: new Date(now + 30 * DAY).toISOString(),
        lastHearingDate: new Date(now - 25 * DAY).toISOString(),
        caseNumber: 'CS/2025/456',
        description: 'Suit for declaration and permanent injunction regarding boundary wall construction. Plaintiffs claim school boundary wall encroaches on their land by 10 feet.',
        reliefSought: 'Demolition of boundary wall and restoration of land to plaintiffs.',
        currentStage: 'Evidence of plaintiffs in progress',
        remarks: 'Revenue record supports school ownership. Ensure patwari and school principal appear as witnesses on next date. Keep survey report ready.',
        tags: ['land-dispute', 'boundary-wall', 'civil-suit', 'school-property'],
        syncStatus: 'pending',
        isDeleted: false,
        createdAt: new Date(now - 180 * DAY).toISOString(),
        updatedAt: new Date(now - 3 * DAY).toISOString()
      }
    ];

    const sampleProceedings = [
      {
        id: 'proc_seed_001',
        caseId: 'DEO-2026-001',
        hearingDate: new Date(now - 15 * DAY).toISOString(),
        court: 'AJK Services Tribunal',
        judge: 'Justice (R) Syed Manzoor Gillani',
        summary: 'Written arguments submitted by petitioner counsel. Tribunal directed respondent to file counter-affidavit within 15 days.',
        nextDate: new Date(now + 5 * DAY).toISOString(),
        ordersPasssed: 'Counter-affidavit to be filed within 15 days. Adjournment granted.',
        attendees: 'Ch. Zulfiqar Ali (Petitioner Counsel), AAG AJK (Respondent)',
        updatedAt: new Date(now - 15 * DAY).toISOString()
      },
      {
        id: 'proc_seed_002',
        caseId: 'DEO-2026-002',
        hearingDate: new Date(now - 10 * DAY).toISOString(),
        court: 'AJK High Court',
        judge: 'Justice Sadaqat Hussain Raja',
        summary: 'Stay order maintained. Respondents directed to file reply within 7 days. Matter adjourned.',
        nextDate: new Date(now + 2 * DAY).toISOString(),
        ordersPasssed: 'Stay maintained. Reply within 7 days. Non-compliance may lead to adverse inference.',
        attendees: 'Sardar Amjad Hussain (Petitioner), AAG (State)',
        updatedAt: new Date(now - 10 * DAY).toISOString()
      },
      {
        id: 'proc_seed_003',
        caseId: 'DEO-2026-003',
        hearingDate: new Date(now - 8 * DAY).toISOString(),
        court: 'AJK High Court',
        judge: 'Justice Ghulam Mustafa Mughal',
        summary: 'Court expressed displeasure at non-compliance. DEO directed to appear in person on next date with compliance report. Warned of contempt conviction.',
        nextDate: new Date(now + 12 * DAY).toISOString(),
        ordersPasssed: 'Personal appearance of DEO directed. Compliance report to be filed. Last opportunity granted.',
        attendees: 'Barrister Khalid Mehmood (Petitioner), Section Officer Law (Respondent side)',
        updatedAt: new Date(now - 8 * DAY).toISOString()
      }
    ];

    const sampleCompliance = [
      {
        id: 'comp_seed_001',
        caseId: 'DEO-2026-003',
        description: 'Regularization order for Tariq Mehmood as CT (BPS-15)',
        orderDate: new Date(now - 120 * DAY).toISOString(),
        deadline: new Date(now + 10 * DAY).toISOString(),
        status: 'Pending',
        action: 'Issue regularization letter and notify establishment section',
        responsibleOfficer: 'DEO Muzaffarabad',
        remarks: 'Requires DD Establishment approval. File moved to Secretary office.',
        updatedAt: new Date(now - 8 * DAY).toISOString()
      },
      {
        id: 'comp_seed_002',
        caseId: 'DEO-2026-002',
        description: 'File parawise comments/reply to writ petition WP/2026/342',
        orderDate: new Date(now - 10 * DAY).toISOString(),
        deadline: new Date(now - 3 * DAY).toISOString(),
        status: 'Overdue',
        action: 'Prepare and file parawise comments through AAG office',
        responsibleOfficer: 'DEO Muzaffarabad / Law Section',
        remarks: 'OVERDUE. Must file before next hearing or stay may be vacated.',
        updatedAt: new Date(now - 1 * DAY).toISOString()
      }
    ];

    // Save all sample data
    const db = await getDB();

    const caseTx = db.transaction('cases', 'readwrite');
    for (const c of sampleCases) {
      await caseTx.store.put(c);
    }
    await caseTx.done;

    const procTx = db.transaction('proceedings', 'readwrite');
    for (const p of sampleProceedings) {
      await procTx.store.put(p);
    }
    await procTx.done;

    const compTx = db.transaction('compliance', 'readwrite');
    for (const comp of sampleCompliance) {
      await compTx.store.put(comp);
    }
    await compTx.done;

    await setSetting('dataSeeded', true);
    await setSetting('seedDate', new Date().toISOString());

    return true;
  }

  // ─── Export to window.DB ─────────────────────────────────────────────────────

  window.DB = {
    initDB,
    getAllCases,
    getCaseById,
    saveCase,
    deleteCase,
    getProceedings,
    saveProceeding,
    getCompliance,
    saveCompliance,
    addToSyncQueue,
    getSyncQueue,
    removeSyncQueueItem,
    getSetting,
    setSetting,
    getCaseCount,
    getNextCaseNumber,
    seedSampleData
  };

})();
