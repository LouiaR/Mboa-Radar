import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CamRouteDB extends DBSchema {
  reports: {
    key: string;
    value: {
      id: string;
      type: 'fixed' | 'mobile' | 'traffic_light' | 'checkpoint';
      latitude: number;
      longitude: number;
      timestamp: number;
      synced: number; // 0 for false, 1 for true
    };
    indexes: { 'by-synced': number };
  };
  user: {
    key: string;
    value: {
      id: string;
      score: number;
      reportsCount: number;
      level: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<CamRouteDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<CamRouteDB>('camroute-db', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('reports', {
            keyPath: 'id',
          });
          store.createIndex('by-synced', 'synced');
        }
        if (oldVersion < 2) {
          db.createObjectStore('user', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const getUserProfile = async () => {
  const db = await initDB();
  let profile = await db.get('user', 'me');
  if (!profile) {
    profile = { id: 'me', score: 100, reportsCount: 0, level: 'Novice' };
    await db.put('user', profile);
  }
  return profile;
};

export const addReport = async (report: Omit<CamRouteDB['reports']['value'], 'id' | 'timestamp' | 'synced'>) => {
  const db = await initDB();
  const id = crypto.randomUUID();
  const newReport = {
    ...report,
    id,
    timestamp: Date.now(),
    synced: 0,
  };
  await db.add('reports', newReport);
  
  // Update user score
  const profile = await getUserProfile();
  profile.reportsCount += 1;
  profile.score += 10; // +10 points per report
  if (profile.score > 200) profile.level = 'Scout';
  if (profile.score > 500) profile.level = 'Veteran';
  await db.put('user', profile);

  return newReport;
};

export const getUnsyncedReports = async () => {
  const db = await initDB();
  return db.getAllFromIndex('reports', 'by-synced', 0);
};

export const markAsSynced = async (id: string) => {
  const db = await initDB();
  const report = await db.get('reports', id);
  if (report) {
    report.synced = 1;
    await db.put('reports', report);
  }
};

export const getAllReports = async () => {
  const db = await initDB();
  return db.getAll('reports');
};
