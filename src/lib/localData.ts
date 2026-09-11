import { Gear, Plan } from '../types';
import { formatLocalDate } from './dateUtils';

const LOCAL_GEARS_KEY = 'stride_running_tracker_local_gears';
const LOCAL_PLANS_KEY = 'stride_running_tracker_local_plans';

export const DEFAULT_LOCAL_GEARS: Gear[] = [
  {
    id: 'gear-default-1',
    gear_id: 'gear-default-1',
    uid: 'guest_runner',
    category: 'Sepatu',
    name: 'Nike Air Zoom Pegasus 39',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    total_distance: 142.5,
    max_distance: 750,
    is_active: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'gear-default-2',
    gear_id: 'gear-default-2',
    uid: 'guest_runner',
    category: 'Sepatu',
    name: 'Saucony Endorphin Speed 3',
    image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
    total_distance: 68.2,
    max_distance: 650,
    is_active: true,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'gear-default-3',
    gear_id: 'gear-default-3',
    uid: 'guest_runner',
    category: 'Sepatu',
    name: 'Asics Novablast 4',
    image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80',
    total_distance: 215.0,
    max_distance: 800,
    is_active: true,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'gear-default-4',
    gear_id: 'gear-default-4',
    uid: 'guest_runner',
    category: 'Jam',
    name: 'Garmin Forerunner 265 Music',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    total_distance: 425.7,
    is_active: true,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: 'gear-default-5',
    gear_id: 'gear-default-5',
    uid: 'guest_runner',
    category: 'Baju',
    name: 'Nike Dri-FIT Miler Singlet',
    image_url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
    total_distance: 80.0,
    is_active: true,
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString()
  }
];

export function getDefaultLocalPlans(uid: string, shoeId1: string = 'gear-default-1', shoeId2: string = 'gear-default-2'): Plan[] {
  const today = new Date();
  const getOffsetDate = (offsetDays: number) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays);
    return formatLocalDate(d);
  };

  return [
    {
      id: 'plan-default-1',
      plan_id: 'plan-default-1',
      uid,
      date: getOffsetDate(-3),
      time: '06:00',
      type_run: 'Easy',
      target_distance: 6.0,
      target_avg_pace: '05:45',
      target_location: 'Gelora Bung Karno Outer Ring',
      description: 'Morning maintenance recovery run. Keep heart rate strictly in Zone 2.',
      actual_log: {
        is_run: true,
        actual_type_run: 'Easy',
        actual_distance: 6.2,
        actual_duration: '00:35:12',
        actual_avg_pace: '05:40',
        avg_heart_rate: 138,
        shoe_id: shoeId1,
        actual_location: 'GBK Senayan',
        actual_description: 'Comfortable pace, legs felt fresh after hydration.',
        logged_at: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'plan-default-2',
      plan_id: 'plan-default-2',
      uid,
      date: getOffsetDate(-2),
      time: '06:15',
      type_run: 'Tempo',
      target_distance: 8.0,
      target_avg_pace: '05:10',
      target_location: 'Sudirman Car Free Corridor',
      description: 'Threshold pace simulation before work.',
      strategy_details: {
        warm_up: '1.5 km dynamic drills & slow jog (06:15/km)',
        speed_session: '5 km steady tempo hold at 05:00 - 05:10/km',
        cooldown: '1.5 km easy jog & stretching'
      },
      actual_log: {
        is_run: true,
        actual_type_run: 'Tempo',
        actual_distance: 8.0,
        actual_duration: '00:41:00',
        actual_avg_pace: '05:08',
        avg_heart_rate: 162,
        shoe_id: shoeId2,
        actual_location: 'Sudirman Loop',
        actual_description: 'Strong rhythm, held 05:05 on the last 2k.',
        logged_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'plan-default-3',
      plan_id: 'plan-default-3',
      uid,
      date: getOffsetDate(-1),
      time: '07:00',
      type_run: 'Rest Day',
      target_distance: 0,
      target_avg_pace: '-',
      target_location: 'Home',
      description: 'Active recovery day. Foam rolling and mobility stretching.',
      actual_log: {
        is_run: true,
        actual_type_run: 'Rest Day',
        actual_distance: 0,
        actual_avg_pace: '-',
        actual_description: 'Full recovery & muscle stretch completed.',
        logged_at: new Date(Date.now() - 86400000).toISOString()
      },
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'plan-default-4',
      plan_id: 'plan-default-4',
      uid,
      date: getOffsetDate(0), // Today
      time: '06:30',
      type_run: 'Interval',
      target_distance: 7.0,
      target_avg_pace: '04:50',
      target_location: 'Ragunan Track / Senayan',
      description: 'Speed intervals: 6 x 400m fast with 90s recovery jog.',
      strategy_details: {
        warm_up: '2 km easy warm up + ABC running drills',
        speed_session: '6 x 400m at 04:30 - 04:45/km with 200m jog recovery',
        cooldown: '1.5 km recovery jog + light quad stretches'
      },
      actual_log: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'plan-default-5',
      plan_id: 'plan-default-5',
      uid,
      date: getOffsetDate(2),
      time: '05:30',
      type_run: 'Long Run',
      target_distance: 14.0,
      target_avg_pace: '05:50',
      target_location: 'BSD Green Office Park',
      description: 'Weekend endurance builder. Practice fueling at km 7 & 11.',
      strategy_details: {
        warm_up: '1 km easy start at 06:10/km',
        speed_session: '12 km continuous aerobic cruise (05:45 - 05:55/km)',
        cooldown: '1 km walk & cool down'
      },
      actual_log: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'plan-default-6',
      plan_id: 'plan-default-6',
      uid,
      date: getOffsetDate(3),
      time: '07:00',
      type_run: 'Recovery',
      target_distance: 4.5,
      target_avg_pace: '06:20',
      target_location: 'Neighborhood Park',
      description: 'Flush out lactic acid post long run.',
      actual_log: null,
      createdAt: new Date().toISOString()
    }
  ];
}

export function getLocalGears(uid: string = 'guest_runner'): Gear[] {
  try {
    const raw = localStorage.getItem(LOCAL_GEARS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw) as Gear[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read local gears from storage:', err);
  }
  const defaults = DEFAULT_LOCAL_GEARS.map(g => ({ ...g, uid }));
  saveLocalGears(defaults);
  return defaults;
}

export function saveLocalGears(gears: Gear[]): void {
  try {
    localStorage.setItem(LOCAL_GEARS_KEY, JSON.stringify(gears));
    window.dispatchEvent(new CustomEvent('local-gears-changed', { detail: gears }));
  } catch (err) {
    console.warn('Could not save local gears to storage:', err);
  }
}

export function getLocalPlans(uid: string = 'guest_runner', shoes?: Gear[]): Plan[] {
  try {
    const raw = localStorage.getItem(LOCAL_PLANS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw) as Plan[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read local plans from storage:', err);
  }
  const shoe1 = shoes?.[0]?.id || 'gear-default-1';
  const shoe2 = shoes?.[1]?.id || 'gear-default-2';
  const defaults = getDefaultLocalPlans(uid, shoe1, shoe2);
  saveLocalPlans(defaults);
  return defaults;
}

export function saveLocalPlans(plans: Plan[]): void {
  try {
    localStorage.setItem(LOCAL_PLANS_KEY, JSON.stringify(plans));
    window.dispatchEvent(new CustomEvent('local-plans-changed', { detail: plans }));
  } catch (err) {
    console.warn('Could not save local plans to storage:', err);
  }
}
