import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  addDoc, query, where, orderBy, onSnapshot, serverTimestamp,
  Timestamp, type DocumentData, type QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Job, ChecklistItem, JobPhoto, JobFlag, User, Property, Notification } from '../types';

// ─── Collection References ────────────────────────────────────────────────────
export const Collections = {
  USERS:         'users',
  PROPERTIES:    'properties',
  JOBS:          'jobs',
  CHECKLIST:     'checklistItems',
  PHOTOS:        'photos',
  FLAGS:         'flags',
  NOTIFICATIONS: 'notifications',
  SOP_TASKS:     'sopTasks',
  ONBOARDING:    'onboardingCodes',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fromDoc = <T>(id: string, data: DocumentData): T => {
  const converted: any = { id, ...data };
  // Convert all Timestamp fields to Date
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted as T;
};

// ─── USER OPERATIONS ──────────────────────────────────────────────────────────
export const getUser = async (userId: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, Collections.USERS, userId));
  if (!snap.exists()) return null;
  return fromDoc<User>(snap.id, snap.data());
};

export const createUser = async (userId: string, data: Omit<User, 'id' | 'createdAt'>) => {
  await setDoc(doc(db, Collections.USERS, userId), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const updateUser = async (userId: string, data: Partial<User>) => {
  await updateDoc(doc(db, Collections.USERS, userId), data);
};

// ─── PROPERTY OPERATIONS ──────────────────────────────────────────────────────
export const getProperty = async (propertyId: string): Promise<Property | null> => {
  const snap = await getDoc(doc(db, Collections.PROPERTIES, propertyId));
  if (!snap.exists()) return null;
  return fromDoc<Property>(snap.id, snap.data());
};

export const getClientProperties = async (clientId: string): Promise<Property[]> => {
  const q = query(
    collection(db, Collections.PROPERTIES),
    where('clientId', '==', clientId),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromDoc<Property>(d.id, d.data()));
};

export const subscribeToClientProperties = (
  clientId: string,
  callback: (properties: Property[]) => void
) => {
  const q = query(
    collection(db, Collections.PROPERTIES),
    where('clientId', '==', clientId),
    where('isActive', '==', true)
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => fromDoc<Property>(d.id, d.data())));
  });
};

// ─── JOB OPERATIONS ───────────────────────────────────────────────────────────
export const getJob = async (jobId: string): Promise<Job | null> => {
  const snap = await getDoc(doc(db, Collections.JOBS, jobId));
  if (!snap.exists()) return null;
  return fromDoc<Job>(snap.id, snap.data());
};

export const getTechJobs = async (techId: string, date?: string): Promise<Job[]> => {
  const constraints: QueryConstraint[] = [where('assignedTechId', '==', techId)];
  if (date) constraints.push(where('scheduledDate', '==', date));
  const q = query(collection(db, Collections.JOBS), ...constraints, orderBy('scheduledDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => fromDoc<Job>(d.id, d.data()));
};

export const getPropertyJobs = async (propertyId: string): Promise<Job[]> => {
  const q = query(
    collection(db, Collections.JOBS),
    where('propertyId', '==', propertyId),
    orderBy('scheduledDate', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromDoc<Job>(d.id, d.data()));
};

// Real-time job subscription (for live dashboard)
export const subscribeToJob = (jobId: string, callback: (job: Job | null) => void) => {
  return onSnapshot(doc(db, Collections.JOBS, jobId), snap => {
    if (!snap.exists()) { callback(null); return; }
    callback(fromDoc<Job>(snap.id, snap.data()));
  });
};

// Real-time subscription to active jobs for a property
export const subscribeToActivePropertyJob = (
  propertyId: string,
  callback: (job: Job | null) => void
) => {
  const q = query(
    collection(db, Collections.JOBS),
    where('propertyId', '==', propertyId),
    where('status', 'in', ['active', 'in_progress'])
  );
  return onSnapshot(q, snap => {
    if (snap.empty) { callback(null); return; }
    callback(fromDoc<Job>(snap.docs[0].id, snap.docs[0].data()));
  });
};

export const updateJobStatus = async (jobId: string, status: Job['status'], extra?: Partial<Job>) => {
  await updateDoc(doc(db, Collections.JOBS, jobId), {
    status,
    updatedAt: serverTimestamp(),
    ...extra,
  });
};

export const clockInJob = async (jobId: string, _techId: string) => {
  await updateDoc(doc(db, Collections.JOBS, jobId), {
    status: 'active',
    clockedInAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const completeJob = async (jobId: string) => {
  await updateDoc(doc(db, Collections.JOBS, jobId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// ─── CHECKLIST OPERATIONS ─────────────────────────────────────────────────────
export const subscribeToChecklist = (
  jobId: string,
  callback: (items: ChecklistItem[]) => void
) => {
  const q = query(
    collection(db, Collections.CHECKLIST),
    where('jobId', '==', jobId),
    orderBy('sortOrder', 'asc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => fromDoc<ChecklistItem>(d.id, d.data())));
  });
};

export const updateChecklistItem = async (
  itemId: string,
  status: ChecklistItem['status'],
  completedBy: string,
  failNote?: string
) => {
  await updateDoc(doc(db, Collections.CHECKLIST, itemId), {
    status,
    completedBy,
    completedAt: serverTimestamp(),
    ...(failNote ? { failNote } : {}),
  });
};

export const getChecklistProgress = (items: ChecklistItem[]) => {
  const applicable = items.filter(i => i.status !== 'na');
  const completed  = applicable.filter(i => i.status === 'pass' || i.status === 'fail');
  const passed     = applicable.filter(i => i.status === 'pass');
  return {
    total:      items.length,
    applicable: applicable.length,
    completed:  completed.length,
    passed:     passed.length,
    percent:    applicable.length > 0 ? Math.round((completed.length / applicable.length) * 100) : 0,
    allDone:    applicable.length > 0 && completed.length === applicable.length,
  };
};

// ─── PHOTO OPERATIONS ─────────────────────────────────────────────────────────
export const addPhoto = async (data: Omit<JobPhoto, 'id' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, Collections.PHOTOS), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const subscribeToJobPhotos = (
  jobId: string,
  callback: (photos: JobPhoto[]) => void
) => {
  const q = query(
    collection(db, Collections.PHOTOS),
    where('jobId', '==', jobId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => fromDoc<JobPhoto>(d.id, d.data())));
  });
};

// ─── FLAG OPERATIONS ──────────────────────────────────────────────────────────
export const addFlag = async (data: Omit<JobFlag, 'id' | 'flaggedAt'>) => {
  const ref = await addDoc(collection(db, Collections.FLAGS), {
    ...data,
    flaggedAt: serverTimestamp(),
    status: 'open',
  });
  // Also update job status to flagged if urgent
  if (data.severity === 'urgent') {
    await updateDoc(doc(db, Collections.JOBS, data.jobId), {
      status: 'flagged',
      updatedAt: serverTimestamp(),
    });
  }
  return ref.id;
};

export const subscribeToJobFlags = (
  jobId: string,
  callback: (flags: JobFlag[]) => void
) => {
  const q = query(
    collection(db, Collections.FLAGS),
    where('jobId', '==', jobId),
    orderBy('flaggedAt', 'desc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => fromDoc<JobFlag>(d.id, d.data())));
  });
};

export const resolveFlag = async (flagId: string, resolvedBy: string, notes: string) => {
  await updateDoc(doc(db, Collections.FLAGS, flagId), {
    status: 'resolved',
    resolvedBy,
    resolvedAt: serverTimestamp(),
    resolutionNotes: notes,
  });
};

// ─── NOTIFICATION OPERATIONS ──────────────────────────────────────────────────
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, Collections.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => fromDoc<Notification>(d.id, d.data())));
  });
};

export const markNotificationRead = async (notificationId: string) => {
  await updateDoc(doc(db, Collections.NOTIFICATIONS, notificationId), { isRead: true });
};

export const createNotification = async (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
  await addDoc(collection(db, Collections.NOTIFICATIONS), {
    ...data,
    isRead: false,
    createdAt: serverTimestamp(),
  });
};