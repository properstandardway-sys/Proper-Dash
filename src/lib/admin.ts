import {
  collection, doc, getDocs, setDoc, updateDoc, addDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
  type QueryConstraint, Timestamp, type DocumentData,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { db, auth } from './firebase';
import { Collections } from './firestore';
import type { Job, User, Property, JobFlag } from '../types';

// ─── Helper ───────────────────────────────────────────────────────────────────
const fromDoc = <T>(id: string, data: DocumentData): T => {
  const converted: any = { id, ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) converted[key] = converted[key].toDate();
  });
  return converted as T;
};

// ─── JOBS ─────────────────────────────────────────────────────────────────────
export const getAllJobs = async (filters?: {
  status?: string;
  date?: string;
  techId?: string;
}): Promise<Job[]> => {
  const constraints: QueryConstraint[] = [];
  if (filters?.status)  constraints.push(where('status', '==', filters.status));
  if (filters?.date)    constraints.push(where('scheduledDate', '==', filters.date));
  if (filters?.techId)  constraints.push(where('assignedTechId', '==', filters.techId));
  constraints.push(orderBy('scheduledDate', 'desc'));
  const q = query(collection(db, Collections.JOBS), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => fromDoc<Job>(d.id, d.data()));
};

export const subscribeToAllJobs = (
  filters: { status?: string; date?: string } = {},
  callback: (jobs: Job[]) => void
) => {
  const constraints: QueryConstraint[] = [];
  if (filters.status) constraints.push(where('status', 'in',
    filters.status === 'active' ? ['active', 'in_progress'] : [filters.status]
  ));
  if (filters.date) constraints.push(where('scheduledDate', '==', filters.date));
  constraints.push(orderBy('scheduledDate', 'desc'));
  const q = query(collection(db, Collections.JOBS), ...constraints);
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => fromDoc<Job>(d.id, d.data())));
  });
};

export const createJob = async (data: {
  propertyId: string;
  jobType: Job['jobType'];
  scheduledDate: string;
  assignedTechId?: string;
  leadTechId?: string;
  checkinDeadline?: Date;
  notes?: string;
}) => {
  const ref = await addDoc(collection(db, Collections.JOBS), {
    ...data,
    status: 'scheduled',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateJob = async (jobId: string, data: Partial<Job>) => {
  await updateDoc(doc(db, Collections.JOBS, jobId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const assignTech = async (jobId: string, techId: string, leadTechId?: string) => {
  await updateDoc(doc(db, Collections.JOBS, jobId), {
    assignedTechId: techId,
    ...(leadTechId ? { leadTechId } : {}),
    updatedAt: serverTimestamp(),
  });
};

// ─── USERS ────────────────────────────────────────────────────────────────────
export const getAllUsers = async (role?: string): Promise<User[]> => {
  const constraints: QueryConstraint[] = [];
  if (role) constraints.push(where('role', '==', role));
  const q = query(collection(db, Collections.USERS), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => fromDoc<User>(d.id, d.data()));
};

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  const q = query(collection(db, Collections.USERS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => fromDoc<User>(d.id, d.data())));
  });
};

export const createUserAccount = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: User['role'];
}) => {
  // Create Firebase Auth user
  const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
  // Create Firestore profile
  await setDoc(doc(db, Collections.USERS, cred.user.uid), {
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone ?? '',
    role: data.role,
    isActive: true,
    createdAt: serverTimestamp(),
  });
  return cred.user.uid;
};

export const updateUserRole = async (userId: string, role: User['role']) => {
  await updateDoc(doc(db, Collections.USERS, userId), { role });
};

export const toggleUserActive = async (userId: string, isActive: boolean) => {
  await updateDoc(doc(db, Collections.USERS, userId), { isActive });
};

// ─── PROPERTIES ───────────────────────────────────────────────────────────────
export const getAllProperties = async (): Promise<Property[]> => {
  const q = query(collection(db, Collections.PROPERTIES), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => fromDoc<Property>(d.id, d.data()));
};

export const subscribeToAllProperties = (callback: (properties: Property[]) => void) => {
  const q = query(collection(db, Collections.PROPERTIES), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => fromDoc<Property>(d.id, d.data())));
  });
};

export const createProperty = async (data: Omit<Property, 'id' | 'createdAt' | 'sopComplete'>) => {
  const ref = await addDoc(collection(db, Collections.PROPERTIES), {
    ...data,
    sopComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateProperty = async (propertyId: string, data: Partial<Property>) => {
  await updateDoc(doc(db, Collections.PROPERTIES, propertyId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ─── FLAGS ────────────────────────────────────────────────────────────────────
export const subscribeToAllOpenFlags = (callback: (flags: JobFlag[]) => void) => {
  const q = query(
    collection(db, Collections.FLAGS),
    where('status', 'in', ['open', 'acknowledged']),
    orderBy('flaggedAt', 'desc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => fromDoc<JobFlag>(d.id, d.data())));
  });
};

export const acknowledgeFlag = async (flagId: string, adminId: string) => {
  await updateDoc(doc(db, Collections.FLAGS, flagId), {
    status: 'acknowledged',
    resolvedBy: adminId,
  });
};

export const resolveFlag = async (flagId: string, adminId: string, notes: string) => {
  await updateDoc(doc(db, Collections.FLAGS, flagId), {
    status: 'resolved',
    resolvedBy: adminId,
    resolvedAt: serverTimestamp(),
    resolutionNotes: notes,
  });
};

// ─── ONBOARDING CODES ─────────────────────────────────────────────────────────
const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'PHP-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

export const createOnboardingCode = async (
  clientEmail: string,
  clientName: string,
  createdBy: string
): Promise<string> => {
  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await addDoc(collection(db, Collections.ONBOARDING), {
    code,
    clientEmail,
    clientName,
    createdBy,
    expiresAt,
    isUsed: false,
    createdAt: serverTimestamp(),
  });
  return code;
};

// ─── STATS ────────────────────────────────────────────────────────────────────
export const getDashboardStats = async () => {
  const today = new Date().toISOString().split('T')[0];
  const [allJobs, allUsers, allProperties, openFlags] = await Promise.all([
    getDocs(query(collection(db, Collections.JOBS), where('scheduledDate', '==', today))),
    getDocs(collection(db, Collections.USERS)),
    getDocs(query(collection(db, Collections.PROPERTIES), where('isActive', '==', true))),
    getDocs(query(collection(db, Collections.FLAGS), where('status', 'in', ['open', 'acknowledged']))),
  ]);

  const todayJobs = allJobs.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  const users     = allUsers.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  return {
    todayJobsTotal:     todayJobs.length,
    todayJobsActive:    todayJobs.filter(j => ['active', 'in_progress'].includes(j.status)).length,
    todayJobsCompleted: todayJobs.filter(j => j.status === 'completed').length,
    todayJobsScheduled: todayJobs.filter(j => j.status === 'scheduled').length,
    activeProperties:   allProperties.size,
    openFlags:          openFlags.size,
    totalTechs:         users.filter(u => ['tech', 'lead_tech'].includes(u.role)).length,
    totalClients:       users.filter(u => u.role === 'client').length,
  };
};