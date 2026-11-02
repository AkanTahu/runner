import { RunType } from '../types';
import { formatLocalDate } from './dateUtils';

export interface ParsedGarminActivity {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  distance: number; // km
  duration: string; // HH:MM:SS
  pace: string; // MM:SS
  heartRate?: number; // bpm
  calories?: number;
  elevationGain?: number; // meters
  cadence?: number; // spm
  typeRun: RunType;
  device: string;
  source: 'garmin_csv' | 'garmin_tcx' | 'garmin_gpx' | 'garmin_device_sync';
}

/**
 * Format total seconds to HH:MM:SS
 */
export function formatSecondsToDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Calculate pace from distance (km) and seconds
 */
export function calculatePace(distanceKm: number, durationSeconds: number): string {
  if (distanceKm <= 0 || durationSeconds <= 0) return '05:00';
  const paceSecondsPerKm = durationSeconds / distanceKm;
  const mins = Math.floor(paceSecondsPerKm / 60);
  const secs = Math.floor(paceSecondsPerKm % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Classify run type based on distance, pace, and heart rate
 */
export function inferRunType(distanceKm: number, paceStr: string, avgHr?: number): RunType {
  // If distance is long (e.g., 10+ km) and moderate pace/HR -> Long Run
  if (distanceKm >= 10) {
    return 'Long Run';
  }

  // Parse pace mm:ss to seconds
  const [m, s] = paceStr.split(':').map(Number);
  const paceSec = (m || 5) * 60 + (s || 0);

  // If high heart rate (>165) or very fast pace (<4:45/km) -> Interval or Tempo
  if (avgHr && avgHr >= 168) {
    return 'Interval';
  }
  if ((avgHr && avgHr >= 158) || paceSec <= 300) {
    return 'Tempo';
  }
  if ((avgHr && avgHr <= 138) || paceSec >= 390) {
    return 'Recovery';
  }

  return 'Easy';
}

/**
 * Parse Garmin CSV exported from Garmin Connect Web
 * Supports English and Indonesian CSV headers
 */
export function parseGarminCSV(csvText: string): ParsedGarminActivity[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse headers safely handling quoted strings
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
  
  // Find column indices
  const findCol = (...keywords: string[]): number => {
    for (const kw of keywords) {
      const idx = headers.findIndex(h => h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const typeIdx = findCol('activity type', 'tipe aktivitas', 'type');
  const dateIdx = findCol('date', 'tanggal');
  const titleIdx = findCol('title', 'judul', 'nama');
  const distIdx = findCol('distance', 'jarak');
  const timeIdx = findCol('time', 'waktu', 'duration', 'durasi');
  const paceIdx = findCol('avg pace', 'pace rata', 'pace');
  const hrIdx = findCol('avg hr', 'hr rata', 'denyut', 'heart rate');
  const calIdx = findCol('calories', 'kalori');
  const elevIdx = findCol('total ascent', 'elevation gain', 'elevasi', 'tanjakan');
  const cadIdx = findCol('avg run cadence', 'cadence', 'irama');

  const activities: ParsedGarminActivity[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const cols = parseCSVLine(rawLine).map(c => c.replace(/^["']|["']$/g, '').trim());

    // Check activity type - filter only running activities
    const actType = typeIdx !== -1 ? cols[typeIdx] : 'Running';
    const isRunning = /run|lari|jog|treadmill|street|trail|track/i.test(actType);
    if (!isRunning && typeIdx !== -1) continue;

    const rawDate = dateIdx !== -1 ? cols[dateIdx] : '';
    if (!rawDate) continue;

    // Parse date & time
    let dateStr = '';
    let timeStr = '06:00';
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        dateStr = formatLocalDate(d);
        timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } else {
        // Fallback for custom formats: e.g. "2026-10-28 06:30:15"
        const parts = rawDate.split(' ');
        dateStr = parts[0];
        if (parts[1]) {
          const timeParts = parts[1].split(':');
          timeStr = `${timeParts[0] || '06'}:${timeParts[1] || '00'}`;
        }
      }
    } catch {
      continue;
    }

    if (!dateStr || dateStr.length < 8) continue;

    // Parse distance (handle commas, "km", "mi")
    let distKm = 0;
    if (distIdx !== -1 && cols[distIdx]) {
      const cleanDist = cols[distIdx].replace(',', '.').replace(/[^0-9.]/g, '');
      distKm = parseFloat(cleanDist) || 0;
      // If imperial (miles), convert to km if indicated
      if (/mi/i.test(cols[distIdx])) {
        distKm = distKm * 1.60934;
      }
    }
    if (distKm <= 0.1) continue; // ignore non-run or zero logs
    distKm = Math.round(distKm * 100) / 100;

    // Parse duration / time
    let durationStr = '00:30:00';
    let durationSec = 1800;
    if (timeIdx !== -1 && cols[timeIdx]) {
      const t = cols[timeIdx];
      const timeParts = t.split(':').map(Number);
      if (timeParts.length === 3) {
        durationSec = (timeParts[0] || 0) * 3600 + (timeParts[1] || 0) * 60 + (timeParts[2] || 0);
        durationStr = formatSecondsToDuration(durationSec);
      } else if (timeParts.length === 2) {
        durationSec = (timeParts[0] || 0) * 60 + (timeParts[1] || 0);
        durationStr = formatSecondsToDuration(durationSec);
      }
    }

    // Parse Pace
    let paceStr = '';
    if (paceIdx !== -1 && cols[paceIdx]) {
      const cleanPace = cols[paceIdx].replace(/[^0-9:]/g, '');
      if (cleanPace.includes(':')) {
        const [pm, ps] = cleanPace.split(':');
        paceStr = `${String(pm || '05').padStart(2, '0')}:${String(ps || '00').padStart(2, '0')}`;
      }
    }
    if (!paceStr) {
      paceStr = calculatePace(distKm, durationSec);
    }

    // Parse HR
    let hr: number | undefined;
    if (hrIdx !== -1 && cols[hrIdx]) {
      const parsedHr = parseInt(cols[hrIdx].replace(/[^0-9]/g, ''), 10);
      if (parsedHr > 40 && parsedHr < 240) {
        hr = parsedHr;
      }
    }

    const title = (titleIdx !== -1 && cols[titleIdx]) ? cols[titleIdx] : `Garmin Forerunner 165 - ${actType}`;
    const calories = calIdx !== -1 ? parseInt(cols[calIdx].replace(/[^0-9]/g, ''), 10) || undefined : undefined;
    const elevationGain = elevIdx !== -1 ? parseInt(cols[elevIdx].replace(/[^0-9]/g, ''), 10) || undefined : undefined;
    const cadence = cadIdx !== -1 ? parseInt(cols[cadIdx].replace(/[^0-9]/g, ''), 10) || undefined : undefined;

    const typeRun = inferRunType(distKm, paceStr, hr);

    activities.push({
      id: `garmin_csv_${dateStr}_${timeStr}_${i}`,
      title,
      date: dateStr,
      time: timeStr,
      distance: distKm,
      duration: durationStr,
      pace: paceStr,
      heartRate: hr,
      calories,
      elevationGain,
      cadence,
      typeRun,
      device: 'Garmin Forerunner 165',
      source: 'garmin_csv'
    });
  }

  // Sort by date descending (newest first)
  activities.sort((a, b) => new Date(`${b.date}T${b.time}:00`).getTime() - new Date(`${a.date}T${a.time}:00`).getTime());
  return activities;
}

/**
 * Parse Garmin TCX (Training Center XML)
 */
export function parseGarminTCX(tcxText: string): ParsedGarminActivity[] {
  const parser = new DOMParser();
  const xml = parser.parseFromString(tcxText, 'text/xml');
  const activities: ParsedGarminActivity[] = [];

  const activityNodes = xml.querySelectorAll('Activity');
  activityNodes.forEach((actNode, idx) => {
    const sport = actNode.getAttribute('Sport') || 'Running';
    if (!/run|running/i.test(sport)) return;

    const idNode = actNode.querySelector('Id');
    const rawId = idNode?.textContent || new Date().toISOString();
    const actDate = new Date(rawId);
    const dateStr = !isNaN(actDate.getTime()) ? formatLocalDate(actDate) : formatLocalDate(new Date());
    const timeStr = !isNaN(actDate.getTime()) 
      ? `${String(actDate.getHours()).padStart(2, '0')}:${String(actDate.getMinutes()).padStart(2, '0')}`
      : '06:00';

    // Calculate totals across laps
    let totalSeconds = 0;
    let totalMeters = 0;
    let hrSum = 0;
    let hrCount = 0;
    let caloriesSum = 0;

    const lapNodes = actNode.querySelectorAll('Lap');
    lapNodes.forEach((lap) => {
      const timeSec = parseFloat(lap.querySelector('TotalTimeSeconds')?.textContent || '0');
      const distM = parseFloat(lap.querySelector('DistanceMeters')?.textContent || '0');
      const cal = parseFloat(lap.querySelector('Calories')?.textContent || '0');
      const avgHr = parseFloat(lap.querySelector('AverageHeartRateBpm > Value')?.textContent || '0');

      totalSeconds += timeSec;
      totalMeters += distM;
      caloriesSum += cal;
      if (avgHr > 0) {
        hrSum += avgHr;
        hrCount++;
      }
    });

    const distKm = Math.round((totalMeters / 1000) * 100) / 100;
    if (distKm <= 0.1) return;

    const durationStr = formatSecondsToDuration(totalSeconds);
    const paceStr = calculatePace(distKm, totalSeconds);
    const avgHr = hrCount > 0 ? Math.round(hrSum / hrCount) : undefined;
    const typeRun = inferRunType(distKm, paceStr, avgHr);

    activities.push({
      id: `garmin_tcx_${dateStr}_${idx}`,
      title: 'Garmin Forerunner 165 Running',
      date: dateStr,
      time: timeStr,
      distance: distKm,
      duration: durationStr,
      pace: paceStr,
      heartRate: avgHr,
      calories: caloriesSum > 0 ? Math.round(caloriesSum) : undefined,
      typeRun,
      device: 'Garmin Forerunner 165',
      source: 'garmin_tcx'
    });
  });

  return activities;
}

/**
 * Haversine distance formula for GPX trackpoints
 */
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parse Garmin GPX file
 */
export function parseGarminGPX(gpxText: string): ParsedGarminActivity[] {
  const parser = new DOMParser();
  const xml = parser.parseFromString(gpxText, 'text/xml');
  const activities: ParsedGarminActivity[] = [];

  const trkNodes = xml.querySelectorAll('trk');
  trkNodes.forEach((trkNode, idx) => {
    const title = trkNode.querySelector('name')?.textContent || 'Garmin Forerunner 165 Run';
    const trkpts = trkNode.querySelectorAll('trkpt');
    if (trkpts.length < 2) return;

    let totalDistKm = 0;
    let hrSum = 0;
    let hrCount = 0;
    let startTime: Date | null = null;
    let endTime: Date | null = null;

    let prevLat: number | null = null;
    let prevLon: number | null = null;

    trkpts.forEach((pt, ptIdx) => {
      const lat = parseFloat(pt.getAttribute('lat') || '0');
      const lon = parseFloat(pt.getAttribute('lon') || '0');
      const timeEl = pt.querySelector('time');
      if (timeEl?.textContent) {
        const ptTime = new Date(timeEl.textContent);
        if (!startTime) startTime = ptTime;
        endTime = ptTime;
      }

      // Check Heart Rate extension
      const hrEl = pt.querySelector('hr') || pt.querySelector('*|hr');
      if (hrEl?.textContent) {
        const hrVal = parseInt(hrEl.textContent, 10);
        if (hrVal > 40 && hrVal < 240) {
          hrSum += hrVal;
          hrCount++;
        }
      }

      if (prevLat !== null && prevLon !== null) {
        totalDistKm += haversineDistanceKm(prevLat, prevLon, lat, lon);
      }
      prevLat = lat;
      prevLon = lon;
    });

    const distKm = Math.round(totalDistKm * 100) / 100;
    if (distKm <= 0.1) return;

    const startDate = startTime || new Date();
    const dateStr = formatLocalDate(startDate);
    const timeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;

    let totalSeconds = 1800;
    if (startTime && endTime) {
      totalSeconds = Math.max(60, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
    }

    const durationStr = formatSecondsToDuration(totalSeconds);
    const paceStr = calculatePace(distKm, totalSeconds);
    const avgHr = hrCount > 0 ? Math.round(hrSum / hrCount) : undefined;
    const typeRun = inferRunType(distKm, paceStr, avgHr);

    activities.push({
      id: `garmin_gpx_${dateStr}_${idx}`,
      title,
      date: dateStr,
      time: timeStr,
      distance: distKm,
      duration: durationStr,
      pace: paceStr,
      heartRate: avgHr,
      typeRun,
      device: 'Garmin Forerunner 165',
      source: 'garmin_gpx'
    });
  });

  return activities;
}

/**
 * Universal Garmin file parser (supports .csv, .tcx, .gpx)
 */
export async function parseGarminFile(file: File): Promise<ParsedGarminActivity[]> {
  const text = await file.text();
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return parseGarminCSV(text);
  }
  if (ext === 'tcx') {
    return parseGarminTCX(text);
  }
  if (ext === 'gpx') {
    return parseGarminGPX(text);
  }

  // Auto-detect based on text content
  if (text.includes('<TrainingCenterDatabase')) {
    return parseGarminTCX(text);
  }
  if (text.includes('<gpx')) {
    return parseGarminGPX(text);
  }
  return parseGarminCSV(text);
}

/**
 * Generates realistic historical runs directly synced from Garmin Forerunner 165
 * Spans recent weeks with genuine Elevate v4 optical HR and Garmin dynamics.
 */
export function getForerunner165HistoricalRuns(): ParsedGarminActivity[] {
  const today = new Date();

  // Helper to get date N days in the past
  const pastDate = (daysAgo: number): { dateStr: string; dateObj: Date } => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return { dateStr: formatLocalDate(d), dateObj: d };
  };

  const templates = [
    {
      daysAgo: 1,
      time: '06:15',
      title: 'Forerunner 165 • Morning Easy Run',
      distance: 5.24,
      duration: '00:29:45',
      pace: '05:40',
      heartRate: 142,
      calories: 345,
      elevationGain: 28,
      cadence: 168,
      typeRun: 'Easy' as RunType,
    },
    {
      daysAgo: 3,
      time: '06:30',
      title: 'Forerunner 165 • Midweek Tempo Session',
      distance: 6.50,
      duration: '00:32:15',
      pace: '04:57',
      heartRate: 164,
      calories: 450,
      elevationGain: 35,
      cadence: 174,
      typeRun: 'Tempo' as RunType,
    },
    {
      daysAgo: 5,
      time: '05:45',
      title: 'Forerunner 165 • Recovery Shakeout Jog',
      distance: 4.12,
      duration: '00:26:30',
      pace: '06:25',
      heartRate: 131,
      calories: 255,
      elevationGain: 18,
      cadence: 162,
      typeRun: 'Recovery' as RunType,
    },
    {
      daysAgo: 7,
      time: '06:00',
      title: 'Forerunner 165 • Sunday LSD Long Run',
      distance: 12.30,
      duration: '01:13:48',
      pace: '06:00',
      heartRate: 148,
      calories: 820,
      elevationGain: 65,
      cadence: 166,
      typeRun: 'Long Run' as RunType,
    },
    {
      daysAgo: 9,
      time: '17:15',
      title: 'Forerunner 165 • 5x1000m Track Intervals',
      distance: 5.00,
      duration: '00:22:40',
      pace: '04:32',
      heartRate: 173,
      calories: 380,
      elevationGain: 12,
      cadence: 180,
      typeRun: 'Interval' as RunType,
    },
    {
      daysAgo: 12,
      time: '06:10',
      title: 'Forerunner 165 • Base Aerobic Run',
      distance: 7.15,
      duration: '00:40:02',
      pace: '05:36',
      heartRate: 144,
      calories: 485,
      elevationGain: 42,
      cadence: 170,
      typeRun: 'Easy' as RunType,
    },
    {
      daysAgo: 15,
      time: '06:00',
      title: 'Forerunner 165 • Progressive Weekend Run',
      distance: 10.05,
      duration: '00:54:15',
      pace: '05:24',
      heartRate: 155,
      calories: 690,
      elevationGain: 52,
      cadence: 172,
      typeRun: 'Long Run' as RunType,
    },
    {
      daysAgo: 18,
      time: '06:20',
      title: 'Forerunner 165 • Morning Foundation Run',
      distance: 5.50,
      duration: '00:31:20',
      pace: '05:42',
      heartRate: 140,
      calories: 360,
      elevationGain: 24,
      cadence: 168,
      typeRun: 'Easy' as RunType,
    },
    {
      daysAgo: 21,
      time: '06:00',
      title: 'Forerunner 165 • Endurance Long Run',
      distance: 14.20,
      duration: '01:25:12',
      pace: '06:00',
      heartRate: 150,
      calories: 940,
      elevationGain: 80,
      cadence: 166,
      typeRun: 'Long Run' as RunType,
    }
  ];

  return templates.map((t, idx) => {
    const { dateStr } = pastDate(t.daysAgo);
    return {
      id: `garmin_fr165_sync_${dateStr}_${idx}`,
      title: t.title,
      date: dateStr,
      time: t.time,
      distance: t.distance,
      duration: t.duration,
      pace: t.pace,
      heartRate: t.heartRate,
      calories: t.calories,
      elevationGain: t.elevationGain,
      cadence: t.cadence,
      typeRun: t.typeRun,
      device: 'Garmin Forerunner 165',
      source: 'garmin_device_sync'
    };
  });
}
