import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Target, 
  Activity, 
  Footprints, 
  CheckCircle2, 
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Heart,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Plan, Gear } from '../types';
import { useAuth } from '../lib/authContext';
import { getTodayLocalDate } from '../lib/dateUtils';

interface SummaryPageProps {
  plans: Plan[];
  gears: Gear[];
}

export const SummaryPage: React.FC<SummaryPageProps> = ({ plans, gears }) => {
  const { t, language } = useAuth();
  
  // Current month in YYYY-MM format
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Collect all available months from plans + ensure current month is present
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add(currentMonthStr);
    plans.forEach(p => {
      if (p.date && p.date.length >= 7) {
        monthSet.add(p.date.slice(0, 7));
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [plans, currentMonthStr]);

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
    const newMonthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  // Month display label
  const monthDisplayLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      month: 'long',
      year: 'numeric'
    });
  }, [selectedMonth, language]);

  // Filter plans for selected month
  const monthlyPlans = useMemo(() => {
    return plans.filter(p => p.date && p.date.startsWith(selectedMonth));
  }, [plans, selectedMonth]);

  // Compute monthly stats
  const monthlyCompletedRuns = monthlyPlans.filter(p => p.actual_log?.is_run);
  const monthlyActualDistance = monthlyCompletedRuns.reduce((sum, p) => sum + (p.actual_log?.actual_distance || 0), 0);
  const monthlyPlannedDistance = monthlyPlans.reduce((sum, p) => sum + (p.type_run !== 'Rest Day' ? p.target_distance : 0), 0);

  // Monthly Average Pace
  let paceSecondsSum = 0;
  let paceCount = 0;
  monthlyCompletedRuns.forEach(p => {
    if (p.actual_log?.actual_avg_pace && p.actual_log.actual_avg_pace !== '-') {
      const parts = p.actual_log.actual_avg_pace.split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        paceSecondsSum += (parts[0] * 60) + parts[1];
        paceCount++;
      }
    }
  });

  const monthlyAvgPace = paceCount > 0 
    ? (() => {
        const sec = Math.round(paceSecondsSum / paceCount);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      })()
    : '05:30';

  // Monthly Average Heart Rate
  const runsWithHR = monthlyCompletedRuns.filter(p => p.actual_log?.avg_heart_rate);
  const avgHR = runsWithHR.length > 0
    ? Math.round(runsWithHR.reduce((sum, p) => sum + (p.actual_log?.avg_heart_rate || 0), 0) / runsWithHR.length)
    : null;

  // Monthly Compliance Rate
  const monthlyPlannedCount = monthlyPlans.filter(p => p.type_run !== 'Rest Day').length;
  const complianceRate = monthlyPlannedCount > 0 
    ? Math.min(100, Math.round((monthlyCompletedRuns.length / monthlyPlannedCount) * 100))
    : (monthlyCompletedRuns.length > 0 ? 100 : 0);

  // Longest Run in this month
  const longestRunDist = monthlyCompletedRuns.reduce((max, p) => {
    const dist = p.actual_log?.actual_distance || 0;
    return dist > max ? dist : max;
  }, 0);

  // Monthly Total Duration
  let totalMinutes = 0;
  monthlyCompletedRuns.forEach(p => {
    if (p.actual_log?.actual_duration) {
      const parts = p.actual_log.actual_duration.split(':').map(Number);
      if (parts.length === 3) {
        totalMinutes += parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
      } else if (parts.length === 2) {
        totalMinutes += parts[0] + Math.round(parts[1] / 60);
      }
    }
  });
  const durationDisplay = totalMinutes > 0 
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` 
    : '-';

  // Shoe usage in this month
  const monthlyShoeMileage = useMemo(() => {
    const map = new Map<string, number>();
    monthlyCompletedRuns.forEach(p => {
      const shoeId = p.actual_log?.shoe_id;
      if (shoeId && p.actual_log?.actual_distance) {
        map.set(shoeId, (map.get(shoeId) || 0) + p.actual_log.actual_distance);
      }
    });
    return Array.from(map.entries()).map(([shoeId, dist]) => {
      const shoe = gears.find(g => g.id === shoeId);
      return {
        id: shoeId,
        name: shoe ? shoe.name : 'Running Shoe',
        distance: dist
      };
    });
  }, [monthlyCompletedRuns, gears]);

  // Unique Active Days in this month (days where at least 1 run was completed)
  const uniqueActiveDays = useMemo(() => {
    return new Set(monthlyCompletedRuns.map(p => p.date)).size;
  }, [monthlyCompletedRuns]);

  // Generate days for Monthly Calendar Grid (supports multiple sessions per day)
  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);
    const totalDays = lastDayOfMonth.getDate();
    
    // Day of week for 1st day (0 = Sun, 1 = Mon ... shift so Mon is 0)
    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex < 0) startDayIndex = 6; // Sunday becomes index 6

    const planMap = new Map<string, Plan[]>();
    monthlyPlans.forEach(p => {
      const arr = planMap.get(p.date) || [];
      arr.push(p);
      planMap.set(p.date, arr);
    });

    const cells = [];
    
    // Leading empty cells for preceding month padding
    for (let i = 0; i < startDayIndex; i++) {
      cells.push({
        dayNumber: null,
        dateStr: '',
        dayPlans: [] as Plan[],
        isPadding: true
      });
    }

    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      const dayPlans = planMap.get(dateStr) || [];
      // Sort sessions by time
      dayPlans.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

      cells.push({
        dayNumber: day,
        dateStr,
        dayPlans,
        isPadding: false
      });
    }

    return cells;
  }, [selectedMonth, monthlyPlans]);

  const getShoeName = (shoeId?: string) => {
    if (!shoeId) return '-';
    const shoe = gears.find(g => g.id === shoeId);
    return shoe ? shoe.name : '-';
  };

  const isCurrentMonth = selectedMonth === currentMonthStr;

  return (
    <div id="summary-page-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Month Navigator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Calendar className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight capitalize">
              {monthDisplayLabel}
            </h1>
            {isCurrentMonth && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                {t('this_month')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'id' 
              ? 'Statistik evaluasi target vs aktual khusus untuk bulan yang dipilih'
              : 'Target vs actual performance metrics strictly for the selected month'}
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center space-x-2">
          <button
            id="analytics-prev-month-btn"
            onClick={() => navigateMonth('prev')}
            title={t('prev_month')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Month Dropdown Picker */}
          <select
            id="analytics-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-xs"
          >
            {availableMonths.map((m) => {
              const [y, mon] = m.split('-').map(Number);
              const label = new Date(y, mon - 1, 1).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                month: 'short',
                year: 'numeric'
              });
              return (
                <option key={m} value={m}>
                  {label} {m === currentMonthStr ? `(${t('this_month')})` : ''}
                </option>
              );
            })}
          </select>

          <button
            id="analytics-next-month-btn"
            onClick={() => navigateMonth('next')}
            title={t('next_month')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isCurrentMonth && (
            <button
              id="analytics-today-month-btn"
              onClick={() => setSelectedMonth(currentMonthStr)}
              className="px-3 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-xs font-semibold transition-all cursor-pointer"
            >
              {t('this_month')}
            </button>
          )}
        </div>
      </div>

      {/* Top 4 Monthly Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Distance */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{t('monthly_distance')}</span>
            <span className="p-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Footprints className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-3">
            {monthlyActualDistance.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">km</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'id' 
              ? `Target rencana: ${monthlyPlannedDistance.toFixed(1)} km` 
              : `Planned target: ${monthlyPlannedDistance.toFixed(1)} km`}
          </div>
        </div>

        {/* Monthly Average Pace */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{t('monthly_avg_pace')}</span>
            <span className="p-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-3">
            {monthlyAvgPace} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">min/km</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'id' 
              ? `${monthlyCompletedRuns.length} sesi lari di ${monthDisplayLabel}` 
              : `${monthlyCompletedRuns.length} runs in ${monthDisplayLabel}`}
          </div>
        </div>

        {/* Monthly Completed Runs */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{t('monthly_runs')}</span>
            <span className="p-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-3">
            {monthlyCompletedRuns.length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{language === 'id' ? 'sesi' : 'runs'}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {durationDisplay !== '-' 
              ? `${language === 'id' ? 'Total waktu lari:' : 'Total time:'} ${durationDisplay}`
              : (language === 'id' ? 'Sesi tercatat' : 'Recorded sessions')}
          </div>
        </div>

        {/* Monthly Compliance Rate */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{t('monthly_compliance')}</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight mt-3">
            {complianceRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'id' 
              ? `${monthlyCompletedRuns.length} dari ${monthlyPlannedCount} rencana terlaksana` 
              : `${monthlyCompletedRuns.length} of ${monthlyPlannedCount} planned runs completed`}
          </div>
        </div>
      </div>

      {/* Monthly Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500">{t('longest_run')}</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {longestRunDist > 0 ? `${longestRunDist} km` : '-'}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500">{t('stat_avg_hr')}</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {avgHR ? `${avgHR} bpm` : '-'}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500">{t('active_days')}</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {uniqueActiveDays} {language === 'id' ? 'Hari' : 'Days'}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500">{t('duration')}</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {durationDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Activity Calendar View */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{t('monthly_calendar')} — {monthDisplayLabel}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'id' 
                ? 'Peta aktivitas harian untuk melihat konsistensi lari sepanjang bulan ini'
                : 'Daily activity map highlighting running consistency across this month'}
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500 dark:bg-cyan-400" />
              <span>{language === 'id' ? 'Lari Selesai' : 'Completed Run'}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs border border-dashed border-cyan-400 dark:border-cyan-500" />
              <span>{language === 'id' ? 'Rencana' : 'Planned'}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 dark:bg-slate-800" />
              <span>Rest Day</span>
            </span>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-mono uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Monthly Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((cell, idx) => {
            if (cell.isPadding || !cell.dayNumber) {
              return (
                <div 
                  key={`pad-${idx}`} 
                  className="min-h-[64px] rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-transparent opacity-30" 
                />
              );
            }

            const dayPlans = cell.dayPlans || [];
            const completedPlans = dayPlans.filter(p => p.actual_log?.is_run);
            const isCompleted = completedPlans.length > 0;
            const isRest = dayPlans.length > 0 && dayPlans.every(p => p.type_run === 'Rest Day');
            const hasPlanPending = dayPlans.length > 0 && !isCompleted && !isRest;
            const isCellToday = cell.dateStr === getTodayLocalDate();
            const sessionCount = dayPlans.length;

            const totalActualDist = completedPlans.reduce((sum, p) => sum + (p.actual_log?.actual_distance || 0), 0);
            const totalTargetDist = dayPlans.reduce((sum, p) => sum + (p.type_run !== 'Rest Day' ? p.target_distance : 0), 0);

            // Detailed tooltip string
            const tooltipTitle = sessionCount > 0
              ? `${cell.dateStr}:\n` + dayPlans.map(p => {
                  const labelPrefix = p.session_label ? `[${p.session_label}] ` : '';
                  const timePrefix = p.time ? `${p.time} - ` : '';
                  const status = p.actual_log?.is_run 
                    ? `Done: ${p.actual_log.actual_distance} km (${p.actual_log.actual_avg_pace || '-'})`
                    : `Plan: ${p.target_distance} km`;
                  return `• ${labelPrefix}${timePrefix}${p.type_run} -> ${status}`;
                }).join('\n')
              : `${cell.dateStr}: ${language === 'id' ? 'Tidak ada lari' : 'No run'}`;

            return (
              <div
                key={cell.dateStr}
                className={`min-h-[64px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCellToday ? 'ring-2 ring-cyan-500/50' : ''
                } ${
                  isCompleted
                    ? 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60'
                    : isRest
                    ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/60 opacity-70'
                    : hasPlanPending
                    ? 'bg-blue-50/50 dark:bg-blue-950/30 border-dashed border-cyan-400/70 dark:border-cyan-600/70'
                    : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60'
                }`}
                title={tooltipTitle}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-bold ${
                    isCellToday ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {cell.dayNumber}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    {sessionCount > 1 && (
                      <span className="text-[9px] font-bold px-1 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                        {sessionCount}x
                      </span>
                    )}
                    {isCompleted && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    )}
                  </div>
                </div>

                <div className="mt-1">
                  {isCompleted ? (
                    <div>
                      <div className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                        {Math.round(totalActualDist * 10) / 10}k
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        {sessionCount > 1 ? `${sessionCount} ${language === 'id' ? 'Sesi' : 'Runs'}` : dayPlans[0]?.type_run}
                      </div>
                    </div>
                  ) : isRest ? (
                    <div className="text-[10px] font-mono text-slate-400 italic">
                      Rest
                    </div>
                  ) : hasPlanPending ? (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {Math.round(totalTargetDist * 10) / 10}k
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 truncate">
                        {sessionCount > 1 ? `${sessionCount} ${language === 'id' ? 'Sesi' : 'Plans'}` : 'Plan'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-300 dark:text-slate-700">-</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shoe Mileage Breakdown for Selected Month */}
      {monthlyShoeMileage.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <Footprints className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t('shoe_mileage_this_month')} ({monthDisplayLabel})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {monthlyShoeMileage.map(shoe => (
              <div 
                key={shoe.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between"
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {shoe.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {language === 'id' ? 'Pemakaian bulan ini' : 'Usage this month'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                    {shoe.distance.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500 ml-0.5">km</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Review Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                {language === 'id' ? `Evaluasi Log Lari: ${monthDisplayLabel}` : `Running Logs: ${monthDisplayLabel}`}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'id' 
                  ? `Daftar seluruh sesi dan rencana lari pada ${monthDisplayLabel}` 
                  : `All planned and completed running sessions in ${monthDisplayLabel}`}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {monthlyPlans.length} {language === 'id' ? 'Catatan' : 'Entries'}
          </span>
        </div>

        {/* Table responsive */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono uppercase text-[10px]">
                <th className="py-3 px-3">{language === 'id' ? 'Tanggal' : 'Date'}</th>
                <th className="py-3 px-3">{language === 'id' ? 'Tipe Lari' : 'Run Type'}</th>
                <th className="py-3 px-3">{language === 'id' ? 'Target Jarak' : 'Target Dist'}</th>
                <th className="py-3 px-3">{language === 'id' ? 'Aktual Jarak' : 'Actual Dist'}</th>
                <th className="py-3 px-3">{language === 'id' ? 'Pace (Aktual)' : 'Pace (Actual)'}</th>
                <th className="py-3 px-3">Heart Rate</th>
                <th className="py-3 px-3">{language === 'id' ? 'Sepatu Lari' : 'Running Shoe'}</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {monthlyPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    <Footprints className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">{t('no_sessions_this_month')} ({monthDisplayLabel})</p>
                  </td>
                </tr>
              ) : (
                monthlyPlans.map((p) => {
                  const isRun = p.actual_log?.is_run;
                  const isRest = p.type_run === 'Rest Day';
                  const shoe = getShoeName(p.actual_log?.shoe_id);

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isRest ? 'text-slate-400 italic bg-slate-50/50 dark:bg-slate-900/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-200 font-medium">
                        {p.date}
                      </td>
                      <td className="py-3 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                        {p.type_run}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                        {isRest ? '-' : `${p.target_distance} km`}
                      </td>
                      <td className="py-3 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                        {isRun ? `${p.actual_log?.actual_distance} km` : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {isRun ? (p.actual_log?.actual_avg_pace || '-') : (p.target_avg_pace || '-')}
                      </td>
                      <td className="py-3 px-3 text-rose-500 dark:text-rose-400 font-medium">
                        {p.actual_log?.avg_heart_rate ? `${p.actual_log.avg_heart_rate} bpm` : '-'}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-500 dark:text-slate-400 max-w-[140px] truncate">
                        {shoe}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        {isRun ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Done</span>
                          </span>
                        ) : isRest ? (
                          <span className="text-[10px] text-slate-400">Rest</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                            Plan
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


