import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Plan, ActualLog, RunType } from '../types';
import { updateShoeMileage } from './gearService';
import { getLocalPlans, saveLocalPlans, getDefaultLocalPlans } from './localData';

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
    const docRef = await addDoc(collection(db, path), {
      ...planData,
      uid,
      target_distance: Number(planData.target_distance) || 0,
      createdAt: new Date().toISOString()
    });

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
    await updateDoc(doc(db, PLANS_COLLECTION, planId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });

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

// Seed realistic starter running schedule for this week and recent activities
export async function seedDefaultPlansIfEmpty(uid: string, currentPlansCount: number, shoes: { id?: string; name: string }[]) {
  if (currentPlansCount > 0) return;

  if (!auth.currentUser || !uid || uid.startsWith('guest_')) {
    getLocalPlans(uid || 'guest_runner');
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
