export type ThemeMode = 'light' | 'dark';

export type Language = 'en' | 'id';

export type RunType = 
  | 'Recovery' 
  | 'Easy' 
  | 'Tempo' 
  | 'Interval' 
  | 'Long Run' 
  | 'Rest Day';

export type GearCategory = 'Sepatu' | 'Jam' | 'Baju';

export interface StrategyDetails {
  warm_up?: string;
  speed_session?: string;
  cooldown?: string;
}

export interface ActualLog {
  is_run: boolean;
  actual_type_run: RunType;
  actual_distance: number; // in Km
  actual_duration?: string; // e.g., "00:45:00" or "45 mins"
  actual_avg_pace: string; // e.g., "05:15"
  avg_heart_rate?: number; // in bpm, e.g. 145
  shoe_id?: string; // reference to gear_id
  actual_location?: string;
  actual_description?: string;
  logged_at: string; // ISO string
}

export interface Plan {
  id?: string;
  plan_id?: string;
  uid: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type_run: RunType;
  target_distance: number; // in Km, 0 for Rest Day
  target_avg_pace: string; // e.g. "05:30"
  target_location?: string;
  description?: string;
  strategy_details?: StrategyDetails;
  actual_log?: ActualLog | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Gear {
  id?: string;
  gear_id?: string;
  uid: string;
  category: GearCategory;
  name: string;
  image_url: string;
  total_distance: number; // in Km
  max_distance?: number; // typical running shoe lifespan: ~600-800 km
  is_active: boolean;
  createdAt: string;
}

export interface UserSettings {
  motivation_quote: string;
  theme_preference: ThemeMode;
  language_preference?: Language;
  runner_name?: string;
  weekly_target_km?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  settings: UserSettings;
  createdAt?: string;
}
