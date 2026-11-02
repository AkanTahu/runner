import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Plan, ActualLog, RunType } from '../types';
import { updateShoeMileage } from './gearService';
import { getLocalPlans, saveLocalPlans, getDefaultLocalPlans } from './localData';
import { removeUndefinedFields } from './cleanData';
import { ParsedGarminActivity } from './garminParser';

const PLANS_COLLECTION = 'plans';

export function subscribePlans(uid: string, callback: (plans: Plan[]) => void) {
  // If not authenticated or in guest mode, use local storage to avoid permission errors
  if (!auth.currentUser || !uid || uid.startsWith('guest_')) {
    const items = getLocalPlans(uid || 'guest_runner');
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    callback(items);
    const handler = () => {
      const updated = getLocalPlans(uid || 'guest_runner');
      updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      callback(updated);
    };
    window.addEventListener('local-plans-changed', handler);
    return () => window.removeEventListener('local-plans-changed', handler);
  }

  const path = PLANS_COLLECTION;
  const q = query(
    collection(db, path),
    where('uid', '==', uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Plan[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          id: docSnap.id,
          plan_id: docSnap.id,
          ...(docSnap.data() as Omit<Plan, 'id' | 'plan_id'>)
        });
      });
      // Sort by date ascending
      items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createPlan(uid: string, planData: Omit<Plan, 'id' | 'plan_id' | 'uid' | 'createdAt'>): Promise<string> {
  if (!auth.currentUser || !uid || uid.startsWith('guest_')) {
    const current = getLocalPlans(uid || 'guest_runner');
    const newId = `plan_${Date.now()}`;
    const newPlan: Plan = {
      ...planData,
      id: newId,
      plan_id: newId,
      uid: uid || 'guest_runner',
      target_distance: Number(planData.target_distance) || 0,
      createdAt: new Date().toISOString()
    };
    saveLocalPlans([...current, newPlan]);

    if (planData.actual_log?.is_run && planData.actual_log.actual_distance > 0) {
      await updateShoeMileage(
        undefined, 
        0, 
        planData.actual_log.shoe_id, 
        planData.actual_log.actual_distance
      );
    }
    return newId;
  }

  const path = PLANS_COLLECTION;
  try {
    const dataToSave = removeUndefinedFields({
      ...planData,
      uid,
      target_distance: Number(planData.target_distance) || 0,
      createdAt: new Date().toISOString()
    });
    const docRef = await addDoc(collection(db, path), dataToSave);

    // If actual_log was submitted right upon creation (e.g. direct run tracking)
    if (planData.actual_log?.is_run && planData.actual_log.actual_distance > 0) {
      await updateShoeMileage(
        undefined, 
        0, 
        planData.actual_log.shoe_id, 
        planData.actual_log.actual_distance
      );
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePlan(
  planId: string, 
  updates: Partial<Plan>, 
  previousPlan?: Plan
): Promise<void> {
  const oldShoeId = previousPlan?.actual_log?.shoe_id;
  const oldDist = previousPlan?.actual_log?.is_run ? Number(previousPlan.actual_log.actual_distance) || 0 : 0;
  const newShoeId = updates.actual_log?.shoe_id ?? oldShoeId;
  const newDist = updates.actual_log?.is_run ? Number(updates.actual_log.actual_distance) || 0 : 0;

  if (!auth.currentUser) {
    const current = getLocalPlans('guest_runner');
    const idx = current.findIndex(p => p.id === planId || p.plan_id === planId);
    if (idx !== -1) {
      current[idx] = {
        ...current[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveLocalPlans([...current]);
    }

    if (updates.actual_log !== undefined) {
      await updateShoeMileage(oldShoeId, oldDist, newShoeId, newDist);
    }
    return;
  }

  const path = `${PLANS_COLLECTION}/${planId}`;
  try {
    const dataToUpdate = removeUndefinedFields({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    await updateDoc(doc(db, PLANS_COLLECTION, planId), dataToUpdate);

    if (updates.actual_log !== undefined) {
      await updateShoeMileage(oldShoeId, oldDist, newShoeId, newDist);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePlan(planId: string, previousPlan?: Plan): Promise<void> {
  if (!auth.currentUser) {
    const current = getLocalPlans('guest_runner');
    const filtered = current.filter(p => p.id !== planId && p.plan_id !== planId);
    saveLocalPlans(filtered);

    if (previousPlan?.actual_log?.is_run && previousPlan.actual_log.actual_distance > 0 && previousPlan.actual_log.shoe_id) {
      await updateShoeMileage(
        previousPlan.actual_log.shoe_id, 
        previousPlan.actual_log.actual_distance, 
        undefined, 
        0
      );
    }
    return;
  }

  const path = `${PLANS_COLLECTION}/${planId}`;
  try {
    // If it had logged actual mileage on a shoe, remove that distance from shoe
    if (previousPlan?.actual_log?.is_run && previousPlan.actual_log.actual_distance > 0 && previousPlan.actual_log.shoe_id) {
      await updateShoeMileage(
        previousPlan.actual_log.shoe_id, 
        previousPlan.actual_log.actual_distance, 
        undefined, 
        0
      );
    }

    await deleteDoc(doc(db, PLANS_COLLECTION, planId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function logActualRun(
  planId: string, 
  actualLog: ActualLog, 
  previousPlan?: Plan
): Promise<void> {
  await updatePlan(planId, { actual_log: actualLog }, previousPlan);
}

// Seed realistic starter running schedule for this week and recent activities (explicit trigger only)
export async function seedDefaultPlansIfEmpty(uid: string, currentPlansCount: number, shoes: { id?: string; name: string }[]) {
  if (!auth.currentUser || !uid || uid.startsWith('guest_')) {
    const shoeId1 = shoes[0]?.id || 'gear-default-1';
    const shoeId2 = shoes[1]?.id || 'gear-default-2';
    const samplePlans = getDefaultLocalPlans(uid || 'guest_runner', shoeId1, shoeId2);
    saveLocalPlans(samplePlans);
    return;
  }

  const shoeId1 = shoes[0]?.id || 'gear-default-1';
  const shoeId2 = shoes[1]?.id || 'gear-default-2';
  const samplePlans = getDefaultLocalPlans(uid, shoeId1, shoeId2);

  const batch = writeBatch(db);
  samplePlans.forEach((plan) => {
    const docRef = doc(collection(db, PLANS_COLLECTION));
    const { id, plan_id, ...data } = plan;
    batch.set(docRef, {
      ...data,
      uid
    });
  });

  try {
    await batch.commit();
  } catch (error) {
    console.warn('Could not seed default plans to Firestore:', error);
  }
}

export async function clearAllPlans(uid: string): Promise<void> {
  if (!auth.currentUser || !uid || uid.startsWith('guest_')) {
    saveLocalPlans([]);
    return;
  }

  const path = PLANS_COLLECTION;
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

/**
 * Batch import activities from Garmin Forerunner 165 / Garmin Connect
 * Checks duplicates based on date + time, stores actual_logs, and updates shoe mileage.
 */
export async function batchImportGarminRuns(
  uid: string, 
  activities: ParsedGarminActivity[], 
  defaultShoeId?: string
): Promise<{ importedCount: number; skippedCount: number }> {
  if (activities.length === 0) return { importedCount: 0, skippedCount: 0 };

  const effectiveUid = uid || 'guest_runner';
  let totalMileageToAdd = 0;
  let importedCount = 0;
  let skippedCount = 0;

  // Local / Guest mode handling
  if (!auth.currentUser || !uid || uid.startsWith('guest_')) {
    const current = getLocalPlans(effectiveUid);
    const existingDateTimes = new Set(current.map(p => `${p.date}_${p.time || ''}`));

    const newPlans: Plan[] = [];

    for (const act of activities) {
      const key = `${act.date}_${act.time}`;
      if (existingDateTimes.has(key)) {
        skippedCount++;
        continue;
      }
      existingDateTimes.add(key);

      const planId = `garmin_plan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const plan: Plan = {
        id: planId,
        plan_id: planId,
        uid: effectiveUid,
        date: act.date,
        time: act.time,
        session_label: act.title || 'Garmin Forerunner 165 Run',
        type_run: act.typeRun,
        target_distance: act.distance,
        target_avg_pace: act.pace,
        target_location: 'GPS Outdoor (Garmin 165)',
        description: `Import Garmin Forerunner 165 • HR: ${act.heartRate || '-'} bpm • Cal: ${act.calories || '-'} kcal`,
        actual_log: {
          is_run: true,
          actual_type_run: act.typeRun,
          actual_distance: act.distance,
          actual_duration: act.duration,
          actual_avg_pace: act.pace,
          avg_heart_rate: act.heartRate,
          shoe_id: defaultShoeId,
          actual_location: 'Garmin GPS Tracked',
          actual_description: `Garmin Forerunner 165 • Elevate Optical HR • Cadence: ${act.cadence || '-'} spm • Elev Gain: ${act.elevationGain || '-'} m`,
          logged_at: `${act.date}T${act.time}:00.000Z`
        },
        createdAt: new Date().toISOString()
      };

      newPlans.push(plan);
      importedCount++;
      totalMileageToAdd += act.distance;
    }

    if (newPlans.length > 0) {
      saveLocalPlans([...current, ...newPlans]);
      if (defaultShoeId && totalMileageToAdd > 0) {
        await updateShoeMileage(undefined, 0, defaultShoeId, totalMileageToAdd);
      }
    }

    return { importedCount, skippedCount };
  }

  // Firestore mode
  const path = PLANS_COLLECTION;
  try {
    // Fetch existing plans to avoid duplicate entries for the same date & time
    const q = query(collection(db, path), where('uid', '==', uid));
    const snapshot = await getDocs(q);
    const existingDateTimes = new Set<string>();
    snapshot.forEach(docSnap => {
      const d = docSnap.data() as Plan;
      if (d.date) {
        existingDateTimes.add(`${d.date}_${d.time || ''}`);
      }
    });

    const newActivitiesToImport: ParsedGarminActivity[] = [];
    for (const act of activities) {
      const key = `${act.date}_${act.time}`;
      if (existingDateTimes.has(key)) {
        skippedCount++;
      } else {
        existingDateTimes.add(key);
        newActivitiesToImport.push(act);
      }
    }

    if (newActivitiesToImport.length === 0) {
      return { importedCount: 0, skippedCount };
    }

    // Process in batches of 400 (Firestore batch limit is 500)
    const BATCH_SIZE = 400;
    for (let i = 0; i < newActivitiesToImport.length; i += BATCH_SIZE) {
      const chunk = newActivitiesToImport.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const act of chunk) {
        const docRef = doc(collection(db, path));
        const dataToSave = removeUndefinedFields({
          uid,
          date: act.date,
          time: act.time,
          session_label: act.title || 'Garmin Forerunner 165 Run',
          type_run: act.typeRun,
          target_distance: act.distance,
          target_avg_pace: act.pace,
          target_location: 'GPS Outdoor (Garmin 165)',
          description: `Import Garmin Forerunner 165 • HR: ${act.heartRate || '-'} bpm • Cal: ${act.calories || '-'} kcal`,
          actual_log: {
            is_run: true,
            actual_type_run: act.typeRun,
            actual_distance: act.distance,
            actual_duration: act.duration,
            actual_avg_pace: act.pace,
            avg_heart_rate: act.heartRate,
            shoe_id: defaultShoeId,
            actual_location: 'Garmin GPS Tracked',
            actual_description: `Garmin Forerunner 165 • Elevate Optical HR • Cadence: ${act.cadence || '-'} spm • Elev Gain: ${act.elevationGain || '-'} m`,
            logged_at: `${act.date}T${act.time}:00.000Z`
          },
          createdAt: new Date().toISOString()
        });

        batch.set(docRef, dataToSave);
        importedCount++;
        totalMileageToAdd += act.distance;
      }

      await batch.commit();
    }

    if (defaultShoeId && totalMileageToAdd > 0) {
      await updateShoeMileage(undefined, 0, defaultShoeId, totalMileageToAdd);
    }

    return { importedCount, skippedCount };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

