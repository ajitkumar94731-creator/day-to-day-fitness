// js/database.js
// Central IndexedDB wrapper for Day to Day Fitness local application.
// Stores: registrations, reviews, members, trainers, attendance, payments, schedules, enquiries, notifications, settings

const DB_NAME = 'DayToDayFitnessDB';
// Increment DB version whenever new object stores are added.
let DB_VERSION = 3; // version 1: core stores, 2: attendance & payments, 3: trainers, schedules, enquiries, notifications, settings
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Core stores
      if (!db.objectStoreNames.contains('registrations')) {
        const regStore = db.createObjectStore('registrations', { keyPath: 'id' });
        regStore.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains('reviews')) {
        const revStore = db.createObjectStore('reviews', { keyPath: 'id' });
        revStore.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains('members')) {
        db.createObjectStore('members', { keyPath: 'id' });
      }
      // New stores added in later versions
      if (!db.objectStoreNames.contains('attendance')) {
        const attStore = db.createObjectStore('attendance', { keyPath: 'id' });
        attStore.createIndex('memberId', 'memberId', { unique: false });
        attStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('payments')) {
        const payStore = db.createObjectStore('payments', { keyPath: 'id' });
        payStore.createIndex('memberId', 'memberId', { unique: false });
        payStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('trainers')) {
        db.createObjectStore('trainers', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('schedules')) {
        const schStore = db.createObjectStore('schedules', { keyPath: 'id' });
        schStore.createIndex('trainerId', 'trainerId', { unique: false });
        schStore.createIndex('memberId', 'memberId', { unique: false });
        schStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('enquiries')) {
        const enqStore = db.createObjectStore('enquiries', { keyPath: 'id' });
        enqStore.createIndex('status', 'status', { unique: false });
        enqStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('notifications')) {
        const notStore = db.createObjectStore('notifications', { keyPath: 'id' });
        notStore.createIndex('read', 'read', { unique: false });
        notStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
  return dbPromise;
}

// ---------- Generic Helpers ----------
async function addRecord(storeName, record, generateIdPrefix = '') {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const id = generateIdPrefix + Date.now();
    const entry = { id, ...record };
    const req = store.add(entry);
    req.onsuccess = () => resolve(entry);
    req.onerror = e => reject(e.target.error);
  });
}

async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function getById(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function updateRecord(storeName, id, updates) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const rec = getReq.result;
      if (!rec) return reject('Record not found');
      Object.assign(rec, updates);
      const putReq = store.put(rec);
      putReq.onsuccess = () => resolve(rec);
      putReq.onerror = e => reject(e.target.error);
    };
    getReq.onerror = e => reject(e.target.error);
  });
}

async function deleteRecord(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  });
}

// ---------- Registrations ----------
export async function addRegistration(reg) { return addRecord('registrations', { status: 'pending', ...reg }, 'REG-'); }
export async function getAllRegistrations() { return getAll('registrations'); }
export async function updateRegistration(id, updates) { return updateRecord('registrations', id, updates); }
export async function deleteRegistration(id) { return deleteRecord('registrations', id); }
export async function approveRegistration(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['registrations', 'members'], 'readwrite');
    const regStore = tx.objectStore('registrations');
    const memStore = tx.objectStore('members');
    const getReq = regStore.get(id);
    getReq.onsuccess = () => {
      const reg = getReq.result;
      if (!reg) return reject('Registration not found');
      reg.status = 'approved';
      regStore.put(reg);
      const member = {
        id: 'MEM-' + Date.now(),
        name: reg.fullName,
        phone: reg.phone,
        email: reg.email,
        plan: reg.membershipPlan,
        joinDate: new Date().toISOString()
      };
      memStore.add(member);
      resolve({ registration: reg, member });
    };
    getReq.onerror = e => reject(e.target.error);
  });
}

// ---------- Reviews ----------
export async function addReview(review) { return addRecord('reviews', { status: 'pending', ...review }, 'REV-'); }
export async function getAllReviews() { return getAll('reviews'); }
export async function getApprovedReviews() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reviews', 'readonly');
    const store = tx.objectStore('reviews');
    const index = store.index('status');
    const req = index.getAll('approved');
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}
export async function updateReview(id, updates) { return updateRecord('reviews', id, updates); }
export async function deleteReview(id) { return deleteRecord('reviews', id); }
export async function getAverageRating() {
  const approved = await getApprovedReviews();
  if (!approved.length) return 0;
  const sum = approved.reduce((a, r) => a + Number(r.rating), 0);
  return (sum / approved.length).toFixed(1);
}
export async function getApprovedReviewCount() { const approved = await getApprovedReviews(); return approved.length; }

// ---------- Members ----------
export async function addMember(member) { return addRecord('members', member, 'MEM-'); }
export async function getAllMembers() { return getAll('members'); }
export async function getMemberById(id) { return getById('members', id); }
export async function updateMember(id, updates) { return updateRecord('members', id, updates); }
export async function deleteMember(id) { return deleteRecord('members', id); }

// ---------- Trainers ----------
export async function addTrainer(trainer) { return addRecord('trainers', trainer, 'TRN-'); }
export async function getAllTrainers() { return getAll('trainers'); }
export async function getTrainerById(id) { return getById('trainers', id); }
export async function updateTrainer(id, updates) { return updateRecord('trainers', id, updates); }
export async function deleteTrainer(id) { return deleteRecord('trainers', id); }

// ---------- Attendance ----------
export async function addAttendance(record) { return addRecord('attendance', record, 'ATT-'); }
export async function getAttendanceByDate(date) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attendance', 'readonly');
    const store = tx.objectStore('attendance');
    const index = store.index('date');
    const req = index.getAll(date);
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}
export async function getAllAttendance() { return getAll('attendance'); }
export async function getAttendanceByMember(memberId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attendance', 'readonly');
    const store = tx.objectStore('attendance');
    const index = store.index('memberId');
    const req = index.getAll(memberId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}

// ---------- Payments ----------
export async function addPayment(record) { return addRecord('payments', record, 'PAY-'); }
export async function getPaymentsByMember(memberId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('payments', 'readonly');
    const store = tx.objectStore('payments');
    const index = store.index('memberId');
    const req = index.getAll(memberId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}
export async function getAllPayments() { return getAll('payments'); }

// ---------- Schedules ----------
export async function addSchedule(schedule) { return addRecord('schedules', schedule, 'SCH-'); }
export async function getSchedulesByTrainer(trainerId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('schedules', 'readonly');
    const store = tx.objectStore('schedules');
    const index = store.index('trainerId');
    const req = index.getAll(trainerId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}
export async function getSchedulesByMember(memberId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('schedules', 'readonly');
    const store = tx.objectStore('schedules');
    const index = store.index('memberId');
    const req = index.getAll(memberId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}
export async function updateSchedule(id, updates) { return updateRecord('schedules', id, updates); }
export async function deleteSchedule(id) { return deleteRecord('schedules', id); }
export async function checkScheduleOverlap(trainerId, date, startTime, endTime, excludeId = null) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('schedules', 'readonly');
    const store = tx.objectStore('schedules');
    const index = store.index('trainerId');
    const req = index.getAll(trainerId);
    req.onsuccess = () => {
      const schedules = req.result.filter(s => s.date === date && s.id !== excludeId);
      const overlap = schedules.some(s =>
        (startTime < s.endTime && endTime > s.startTime)
      );
      resolve(overlap);
    };
    req.onerror = e => reject(e.target.error);
  });
}

// ---------- Enquiries ----------
export async function addEnquiry(enquiry) { return addRecord('enquiries', enquiry, 'ENQ-'); }
export async function getAllEnquiries() { return getAll('enquiries'); }
export async function updateEnquiry(id, updates) { return updateRecord('enquiries', id, updates); }
export async function deleteEnquiry(id) { return deleteRecord('enquiries', id); }

// ---------- Notifications ----------
export async function createNotification(notification) {
  // notification: {title, message, type, read:false, date:ISO}
  return addRecord('notifications', { read: false, date: new Date().toISOString(), ...notification }, 'NTF-');
}
export async function getAllNotifications() { return getAll('notifications'); }
export async function getUnreadCount() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notifications', 'readonly');
    const store = tx.objectStore('notifications');
    const index = store.index('read');
    const req = index.getAll(false);
    req.onsuccess = () => resolve(req.result.length);
    req.onerror = e => reject(e.target.error);
  });
}
export async function markNotificationRead(id) { return updateRecord('notifications', id, { read: true }); }
export async function markAllNotificationsRead() {
  const notifications = await getAllNotifications();
  const promises = notifications.filter(n => !n.read).map(n => markNotificationRead(n.id));
  return Promise.all(promises);
}
export async function deleteNotification(id) { return deleteRecord('notifications', id); }

// ---------- Settings ----------
export async function setSetting(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const req = store.put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  });
}
export async function getSetting(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = e => reject(e.target.error);
  });
}

// ---------- Backup & Restore ----------
export async function exportAllData() {
  const db = await openDB();
  const exportObj = {};
  const storeNames = Array.from(db.objectStoreNames);
  for (const name of storeNames) {
    const tx = db.transaction(name, 'readonly');
    const store = tx.objectStore(name);
    const req = store.getAll();
    exportObj[name] = await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = e => reject(e.target.error);
    });
  }
  return exportObj;
}

export async function importAllData(dataObj, { overwrite = false } = {}) {
  const db = await openDB();
  const storeNames = Array.from(db.objectStoreNames);
  for (const name of storeNames) {
    if (!dataObj[name]) continue;
    const tx = db.transaction(name, 'readwrite');
    const store = tx.objectStore(name);
    if (overwrite) {
      await new Promise((resolve, reject) => {
        const clearReq = store.clear();
        clearReq.onsuccess = () => resolve();
        clearReq.onerror = e => reject(e.target.error);
      });
    }
    for (const rec of dataObj[name]) {
      const existing = await new Promise((resolve, reject) => {
        const getReq = store.get(rec.id);
        getReq.onsuccess = () => resolve(getReq.result);
        getReq.onerror = e => reject(e.target.error);
      });
      if (existing) continue;
      await new Promise((resolve, reject) => {
        const addReq = store.add(rec);
        addReq.onsuccess = () => resolve();
        addReq.onerror = e => reject(e.target.error);
      });
    }
  }
  return true;
}
