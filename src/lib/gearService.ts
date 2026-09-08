import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  increment,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Gear } from '../types';
import { getLocalGears, saveLocalGears, DEFAULT_LOCAL_GEARS } from './localData';
import { removeUndefinedFields } from './cleanData';

const GEARS_COLLECTION = 'gears';

// Starter gear presets with clean transparent sneaker / watch visuals
export const DEFAULT_GEARS: Omit<Gear, 'uid' | 'createdAt'>[] = DEFAULT_LOCAL_GEARS.map(g => ({
  category: g.category,
  name: g.name,
  image_url: g.image_url,
  total_distance: g.total_distance,
  max_distance: g.max_distance,
  is_active: g.is_active
}));

export function subscribeGears(uid: string, callback: (gears: Gear[]) => void) {
  // If not authenticated or in guest mode, use local storage to avoid permission errors
  if (!auth.currentUser || !uid || uid.startsWith('guest_')) {
    const items = getLocalGears(uid || 'guest_runner');
    callback(items);
    const handler = () => {
      callback(getLocalGears(uid || 'guest_runner'));
    };
    window.addEventListener('local-gears-changed', handler);
    return () => window.removeEventListener('local-gears-changed', handler);
  }

  const path = GEARS_COLLECTION;
  const q = query(
    collection(db, path),
    where('uid', '==', uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Gear[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          id: docSnap.id,
          gear_id: docSnap.id,
          ...(docSnap.data() as Omit<Gear, 'id' | 'gear_id'>)
        });
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addGear(uid: string, gearData: Omit<Gear, 'id' | 'gear_id' | 'uid' | 'createdAt'>): Promise<string> {
  if (!auth.currentUser || !uid || uid.startsWith('guest_')) {
    const current = getLocalGears(uid || 'guest_runner');
    const newId = `gear_${Date.now()}`;
    const newGear: Gear = {
      ...gearData,
      id: newId,
      gear_id: newId,
      uid: uid || 'guest_runner',
      total_distance: Number(gearData.total_distance) || 0,
      is_active: gearData.is_active ?? true,
      createdAt: new Date().toISOString()
    };
    saveLocalGears([...current, newGear]);
    return newId;
  }

  const path = GEARS_COLLECTION;
  try {
    const dataToSave = removeUndefinedFields({
      ...gearData,
      uid,
      total_distance: Number(gearData.total_distance) || 0,
      is_active: gearData.is_active ?? true,
      createdAt: new Date().toISOString()
    });
    const docRef = await addDoc(collection(db, path), dataToSave);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function seedDefaultGearsIfEmpty(uid: string, currentGearsCount: number = 0) {
  if (!auth.currentUser || !uid || uid.startsWith('guest_')) {
    const defaults = DEFAULT_LOCAL_GEARS.map(g => ({ ...g, uid: uid || 'guest_runner' }));
    saveLocalGears(defaults);
    return;
  }

  const batch = writeBatch(db);
  const now = new Date().toISOString();

  DEFAULT_GEARS.forEach((gear) => {
    const docRef = doc(collection(db, GEARS_COLLECTION));
    batch.set(docRef, {
      ...gear,
      uid,
      createdAt: now
    });
  });

  try {
    await batch.commit();
  } catch (error) {
    console.warn('Could not seed default gears to Firestore:', error);
  }
}

export async function clearAllGears(uid: string): Promise<void> {
  if (!auth.currentUser || !uid || uid.startsWith('guest_')) {
    saveLocalGears([]);
    return;
  }

  const path = GEARS_COLLECTION;
  try {
    const q = query(collection(db, path), where('uid', '==', uid));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateGear(gearId: string, updates: Partial<Gear>): Promise<void> {
  if (!auth.currentUser) {
    const current = getLocalGears('guest_runner');
    const idx = current.findIndex(g => g.id === gearId || g.gear_id === gearId);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      saveLocalGears([...current]);
    }
    return;
  }

  const path = `${GEARS_COLLECTION}/${gearId}`;
  try {
    const dataToUpdate = removeUndefinedFields(updates);
    await updateDoc(doc(db, GEARS_COLLECTION, gearId), dataToUpdate);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteGear(gearId: string): Promise<void> {
  if (!auth.currentUser) {
    const current = getLocalGears('guest_runner');
    const filtered = current.filter(g => g.id !== gearId && g.gear_id !== gearId);
    saveLocalGears(filtered);
    return;
  }

  const path = `${GEARS_COLLECTION}/${gearId}`;
  try {
    await deleteDoc(doc(db, GEARS_COLLECTION, gearId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Automatically accumulates shoe mileage when an actual run is saved or updated
 */
export async function updateShoeMileage(
  oldShoeId?: string, 
  oldDistance: number = 0, 
  newShoeId?: string, 
  newDistance: number = 0
): Promise<void> {
  if (!auth.currentUser) {
    const gears = getLocalGears('guest_runner');
    let changed = false;

    if (oldShoeId === newShoeId) {
      if (newShoeId && oldDistance !== newDistance) {
        const delta = newDistance - oldDistance;
        const g = gears.find(item => item.id === newShoeId || item.gear_id === newShoeId);
        if (g) {
          g.total_distance = Math.max(0, (g.total_distance || 0) + delta);
          changed = true;
        }
      }
    } else {
      if (oldShoeId && oldDistance > 0) {
        const gOld = gears.find(item => item.id === oldShoeId || item.gear_id === oldShoeId);
        if (gOld) {
          gOld.total_distance = Math.max(0, (gOld.total_distance || 0) - oldDistance);
          changed = true;
        }
      }
      if (newShoeId && newDistance > 0) {
        const gNew = gears.find(item => item.id === newShoeId || item.gear_id === newShoeId);
        if (gNew) {
          gNew.total_distance = (gNew.total_distance || 0) + newDistance;
          changed = true;
        }
      }
    }

    if (changed) {
      saveLocalGears(gears);
    }
    return;
  }

  try {
    // If shoe didn't change
    if (oldShoeId === newShoeId) {
      if (newShoeId && oldDistance !== newDistance) {
        const delta = newDistance - oldDistance;
        await updateDoc(doc(db, GEARS_COLLECTION, newShoeId), {
          total_distance: increment(delta)
        });
      }
      return;
    }

    // If shoe changed: decrement old shoe, increment new shoe
    if (oldShoeId && oldDistance > 0) {
      await updateDoc(doc(db, GEARS_COLLECTION, oldShoeId), {
        total_distance: increment(-oldDistance)
      });
    }

    if (newShoeId && newDistance > 0) {
      await updateDoc(doc(db, GEARS_COLLECTION, newShoeId), {
        total_distance: increment(newDistance)
      });
    }
  } catch (error) {
    console.error('Shoe mileage tracking error:', error);
  }
}
