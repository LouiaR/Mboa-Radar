import { openDB, DBSchema, IDBPDatabase } from 'idb';

import { supabase } from './supabase';

export interface HazardType {
  id: string;
  label_en: string;
  label_fr: string;
  icon_name: string;
  color: string;
}

interface CamRouteDB extends DBSchema {
  hazard_types: {
    key: string;
    value: HazardType;
  };
  reports: {
    key: string;
    value: {
      id: string;
      type: 'fixed' | 'mobile' | 'traffic_light' | 'checkpoint';
      latitude: number;
      longitude: number;
      timestamp: number;
      synced: number; // 0 for false, 1 for true
      locationName?: string; // Cached reverse geocoding name
      reporterName?: string; // First 3 letters
      reporterLevel?: string;
      upvotes: number;
      downvotes: number;
      customLocation?: string; // Local names (e.g. "Carrefour J'aime mon pays")
    };
    indexes: { 'by-synced': number };
  };
  user: {
    key: string;
    value: {
      id: string; // 'me' for local, or the Supabase UUID
      score: number;
      reportsCount: number;
      level: string;
      auth_id?: string; // Explicitly store the Supabase UID if different
    };
  };
  user_votes: {
    key: string;
    value: {
      report_id: string;
      vote_type: 'up' | 'down';
    };
  };
  notifications: {
    key: string;
    value: {
      id: string;
      title: string;
      message: string;
      type: 'proximity' | 'system' | 'community';
      timestamp: number;
      isRead: boolean;
      hazardId?: string;
    };
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<CamRouteDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<CamRouteDB>('camroute-db', 8, {
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
        if (oldVersion < 3) {
          db.createObjectStore('hazard_types', { keyPath: 'id' });
        }
        if (oldVersion < 7) {
          db.createObjectStore('user_votes', { keyPath: 'report_id' });
        }
        if (oldVersion < 8) {
          const store = db.createObjectStore('notifications', { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
};

export const getUserProfile = async () => {
  const db = await initDB();

  // Try to get the active session user
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || 'me';

  let profile = await db.get('user', userId);

  if (!profile && userId !== 'me') {
    // Check if we have a profile in Supabase
    const { data: cloudProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (cloudProfile) {
      profile = {
        id: userId,
        score: cloudProfile.score,
        reportsCount: cloudProfile.reports_count,
        level: cloudProfile.level,
        auth_id: userId
      };
      await db.put('user', profile);
    }
  }

  if (!profile) {
    profile = {
      id: userId,
      score: 100,
      reportsCount: 0,
      level: 'Novice',
      auth_id: userId === 'me' ? undefined : userId
    };
    await db.put('user', profile);
  }
  return profile;
};

export const addReport = async (report: Omit<CamRouteDB['reports']['value'], 'id' | 'timestamp' | 'synced' | 'reporterName' | 'reporterLevel' | 'upvotes' | 'downvotes'>) => {
  const db = await initDB();
  const profile = await getUserProfile();
  const id = crypto.randomUUID();
  const locationName = await reverseGeocode(report.latitude, report.longitude);

  const newReport: CamRouteDB['reports']['value'] = {
    ...report,
    id,
    timestamp: Date.now(),
    synced: 0,
    locationName: locationName || undefined,
    reporterName: profile.id !== 'me' ? profile.id.substring(0, 3).toUpperCase() : 'GST',
    reporterLevel: profile.level,
    upvotes: 0,
    downvotes: 0,
    customLocation: report.customLocation
  };
  console.log('[DB] Adding Report:', newReport);
  await db.add('reports', newReport);

  // Update user score
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

export const syncReportsDownFromCloud = async () => {
  try {
    const { data: cloudReports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    const db = await initDB();
    const tx = db.transaction('reports', 'readwrite');
    const store = tx.objectStore('reports');

    // 1. Get all local reports currently marked as synced
    const localReports = await store.index('by-synced').getAll(1);
    const cloudIds = new Set(cloudReports?.map(cr => cr.id) || []);

    // 2. Delete local reports that are no longer in the cloud
    for (const local of localReports) {
      if (!cloudIds.has(local.id)) {
        await store.delete(local.id);
      }
    }

    // 3. Update/Insert cloud reports into local cache
    if (cloudReports) {
      for (const cr of cloudReports) {
        const local = await store.get(cr.id);
        // Only overwrite if it wasn't a pending local sync (synced === 0)
        if (!local || local.synced === 1) {
          await store.put({
            id: cr.id,
            type: cr.type,
            latitude: cr.latitude,
            longitude: cr.longitude,
            timestamp: new Date(cr.timestamp).getTime(),
            synced: 1,
            reporterName: cr.reporter_name,
            reporterLevel: cr.reporter_level,
            upvotes: cr.upvotes || 0,
            downvotes: cr.downvotes || 0,
            customLocation: cr.custom_location,
            locationName: cr.location_name
          });
        }
      }
    }

    await tx.done;
  } catch (error) {
    console.error("Failed to sync reports down from Supabase:", error);
  }
};

export const getAllReports = async () => {
  const db = await initDB();
  const localReports = await db.getAll('reports');

  // Background pull to keep updated without blocking UI
  syncReportsDownFromCloud().catch(console.error);

  return localReports;
};

export const syncHazardTypes = async () => {
  try {
    const { data: types, error } = await supabase
      .from('hazard_types')
      .select('*');

    if (error) throw error;

    if (types && types.length > 0) {
      const db = await initDB();
      const tx = db.transaction('hazard_types', 'readwrite');

      // Clear old types and add new ones to ensure sync
      await tx.store.clear();
      for (const type of types) {
        await tx.store.put(type);
      }

      await tx.done;
      return types;
    }
  } catch (error) {
    console.error("Failed to sync hazard types from Supabase:", error);
    return null;
  }
};

const geoCache = new Map<string, string>();
const geoPending = new Map<string, Promise<string | null>>();
let geoQueue: Promise<string | null> = Promise.resolve(null);
let lastGeoRequest = 0;
let geoBackoff = 0; // ms

export const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;

  // 1. Instant Cache Check
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey)!;

  // 2. Instant Pending Check (Coalesce identical parallel requests)
  if (geoPending.has(cacheKey)) return geoPending.get(cacheKey)!;

  // 3. Serial Queue Logic
  const fetchPromise = (async () => {
    // Add to serial queue to avoid thundering herd and 429s
    geoQueue = geoQueue.then(async () => {
      // Re-re-check cache inside the queue
      if (geoCache.has(cacheKey)) return geoCache.get(cacheKey)!;

      const now = Date.now();
      const waitTime = Math.max(0, (1000 + geoBackoff) - (now - lastGeoRequest));
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      lastGeoRequest = Date.now();

      try {
        // console.log(`[Geo] Fetching names for ${lat}, ${lon}... ${geoBackoff > 0 ? `(Backoff: ${geoBackoff}ms)` : ''}`);
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16`, {
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'Mboa-Radar-App-v1.0 (contact: support@mboa-radar.cm)'
          }
        });

        if (res.status === 429) {
          console.warn("Geocoding rate limited (429). Increasing backoff.");
          geoBackoff = Math.min(geoBackoff + 2000, 10000); // Add 2s, cap at 10s
          return null;
        }

        // Success: gradually reduce backoff
        geoBackoff = Math.max(0, geoBackoff - 500);

        const data = await res.json();
        const name = data.display_name || data.address?.suburb || data.address?.neighbourhood || data.address?.city || 'Zone inconnue';

        // console.log('[Geo] Success:', { name, raw: data });
        geoCache.set(cacheKey, name);
        return name;
      } catch (e) {
        console.warn("Reverse geocoding failed - network or CORS. Triggering backoff:", e);
        // Treat fetch failure (often CORS 429) as a rate limit trigger
        geoBackoff = Math.min(geoBackoff + 2000, 10000);
        return null;
      }
    });

    try {
      const result = await geoQueue;
      return result;
    } finally {
      geoPending.delete(cacheKey);
    }
  })();

  geoPending.set(cacheKey, fetchPromise);
  return fetchPromise;
};

export const updateReport = async (id: string, updates: Partial<CamRouteDB['reports']['value']>) => {
  const db = await initDB();
  const report = await db.get('reports', id);
  if (report) {
    const updated = { ...report, ...updates };
    await db.put('reports', updated);
    return updated;
  }
  return null;
};

export const voteReport = async (id: string, type: 'up' | 'down', userId: string) => {
  const db = await initDB();
  const tx = db.transaction(['reports', 'user_votes'], 'readwrite');
  const report = await tx.objectStore('reports').get(id);
  const existingVote = await tx.objectStore('user_votes').get(id);

  if (report) {
    if (existingVote) {
      if (existingVote.vote_type === type) return report; // Already voted this way

      // Switch vote
      if (type === 'up') {
        report.upvotes += 1;
        report.downvotes = Math.max(0, report.downvotes - 1);
      } else {
        report.downvotes += 1;
        report.upvotes = Math.max(0, report.upvotes - 1);
      }
      existingVote.vote_type = type;
      await tx.objectStore('user_votes').put(existingVote);
    } else {
      // New vote
      if (type === 'up') report.upvotes += 1;
      else report.downvotes += 1;
      await tx.objectStore('user_votes').add({ report_id: id, vote_type: type });
    }

    report.synced = 0; // Mark for sync
    await tx.objectStore('reports').put(report);
    await tx.done;
    return report;
  }
  return null;
};

export const getUserVote = async (reportId: string) => {
  const db = await initDB();
  return db.get('user_votes', reportId);
};

export const addNotification = async (notif: Omit<CamRouteDB['notifications']['value'], 'id' | 'timestamp' | 'isRead'>) => {
  const db = await initDB();
  const id = crypto.randomUUID();
  const timestamp = Date.now();
  await db.add('notifications', {
    ...notif,
    id,
    timestamp,
    isRead: false
  });
  return { id, timestamp };
};

export const getNotifications = async () => {
  const db = await initDB();
  return db.getAllFromIndex('notifications', 'by-timestamp');
};

export const markNotificationAsRead = async (id: string) => {
  const db = await initDB();
  const notif = await db.get('notifications', id);
  if (notif) {
    notif.isRead = true;
    await db.put('notifications', notif);
  }
};

export const markAllNotificationsAsRead = async () => {
  const db = await initDB();
  const tx = db.transaction('notifications', 'readwrite');
  const store = tx.objectStore('notifications');
  const all = await store.getAll();
  for (const notif of all) {
    if (!notif.isRead) {
      notif.isRead = true;
      await store.put(notif);
    }
  }
  await tx.done;
};

export const getHazardTypes = async (): Promise<HazardType[]> => {
  const db = await initDB();
  const localTypes = await db.getAll('hazard_types');

  // If we have local types, return them immediately
  if (localTypes.length > 0) {
    // Fire off background sync but don't wait for it
    syncHazardTypes().catch(console.error);
    return localTypes;
  }

  // If we have no local cache, block on network request
  const fallbackTypes = await syncHazardTypes();
  return fallbackTypes || [];
};
