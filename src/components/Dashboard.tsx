import React, { useState, useMemo } from 'react';
import { 
  Footprints, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Activity, 
  Clock, 
  MapPin, 
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Plan, Gear, UserSettings } from '../types';
import { useAuth } from '../lib/authContext';

interface DashboardProps {
  plans: Plan[];
  gears: Gear[];
  userSettings?: UserSettings;
  onOpenCreatePlan: (defaultDate?: string, defaultSessionLabel?: string) => void;
  onLogActual: (plan: Plan) => void;
  onOpenQuickRunModal: (defaultDate?: string, defaultSessionLabel?: string) => void;
  onGoToPlans: () => void;
  onGoToGears?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  plans,
  userSettings,
  onOpenCreatePlan,
  onLogActual,
  onOpenQuickRunModal,
  onGoToPlans
}) => {
  const { t, language } = useAuth();
  const weeklyTargetKm = userSettings?.weekly_target_km || 30;

  // State for navigating 7-day schedule weeks
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // State for showing concise summary when clicking a day in the 7-day schedule
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    date: string;
    dayName: string;
    plans: Plan[];
  } | null>(null);

  // Calculate current week range (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() + diffToMonday);
  currentMonday.setHours(0, 0, 0, 0);

  const currentSunday = new Date(currentMonday);
  currentSunday.setDate(currentMonday.getDate() + 6);
  currentSunday.setHours(23, 59, 59, 999);

  const todayStr = now.toISOString().split('T')[0];

  // Calculate stats for current week (Donut chart)
  let totalDistanceCompleted = 0;

  plans.forEach((p) => {
    const pDate = new Date(p.date);
    const isThisWeek = pDate >= currentMonday && pDate <= currentSunday;

    if (p.actual_log?.is_run && isThisWeek) {
      totalDistanceCompleted += p.actual_log.actual_distance;
    }
  });

  const percentageAchieved = Math.min(100, Math.round((totalDistanceCompleted / weeklyTargetKm) * 100));

  // Today's plans (supports multiple sessions in a single day!)
  const todayPlans = useMemo(() => {
    return plans
      .filter((p) => p.date === todayStr)
      .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
  }, [plans, todayStr]);

  const todayCompletedPlans = todayPlans.filter(p => p.actual_log?.is_run);
  const todayTotalActualDist = todayCompletedPlans.reduce((sum, p) => sum + (p.actual_log?.actual_distance || 0), 0);
  const todayTotalTargetDist = todayPlans.reduce((sum, p) => sum + (p.type_run !== 'Rest Day' ? p.target_distance : 0), 0);

  // 7-day schedule range (responsive to weekOffset)
  const scheduleMonday = new Date(currentMonday);
  scheduleMonday.setDate(currentMonday.getDate() + (weekOffset * 7));

  // Weekdays representation for 7-day schedule
  const dayNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayNamesId = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const activeDayNames = language === 'id' ? dayNamesId : dayNamesEn;

  const weekDays = activeDayNames.map((dayName, index) => {
    const dayDate = new Date(scheduleMonday);
    dayDate.setDate(scheduleMonday.getDate() + index);
    const dateFormatted = dayDate.toISOString().split('T')[0];
    const dayPlans = plans
      .filter(p => p.date === dateFormatted)
      .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
    const isToday = dateFormatted === todayStr;
    const completedPlans = dayPlans.filter(p => p.actual_log?.is_run);
    const isAnyCompleted = completedPlans.length > 0;
    const isAllCompleted = dayPlans.length > 0 && completedPlans.length === dayPlans.length;
    const isRestOnly = dayPlans.length > 0 && dayPlans.every(p => p.type_run === 'Rest Day');
    
    const totalActualDist = completedPlans.reduce((sum, p) => sum + (p.actual_log?.actual_distance || 0), 0);
    const totalTargetDist = dayPlans.reduce((sum, p) => sum + (p.type_run !== 'Rest Day' ? p.target_distance : 0), 0);
    const distance = isAnyCompleted ? totalActualDist : totalTargetDist;

    return {
      dayName,
      dayDate,
      dateFormatted,
      dayPlans,
      isToday,
      isAnyCompleted,
      isAllCompleted,
      isRestOnly,
      distance: Math.round(distance * 10) / 10
    };
  });

  // Donut SVG parameters
  const strokeWidth = 14;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentageAchieved / 100) * circumference;

  return (
    <div id="dashboard-main-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Grid: Donut Progress & Today's Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Weekly Mileage Statistic (Donut Chart) */}
        <div id="weekly-donut-card" className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('weekly_mileage_progress')}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {t('target_label')}: {weeklyTargetKm} {t('target_per_week')}
              </p>
            </div>
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Activity className="w-4 h-4" />
            </span>
          </div>

          {/* Donut SVG Ring */}
          <div className="relative flex items-center justify-center my-6">
            <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-cyan-500 transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Centered Donut Value */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                {percentageAchieved}%
              </span>
              <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mt-0.5">
                {t('achieved')}
              </span>
            </div>
          </div>

          {/* Donut Legend / Details */}
          <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50">
              <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">{t('actual_completed')}</div>
              <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                {totalDistanceCompleted.toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50">
              <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">{t('target_remaining')}</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {Math.max(0, weeklyTargetKm - totalDistanceCompleted).toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 & 3: This Week's Plan / Today's Card Note */}
        <div id="today-plan-card" className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('today_schedule')} ({new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' })})
                    </h2>
                    {todayPlans.length > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                        {todayPlans.length} {t('sessions_unit')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {todayPlans.length > 1 
                      ? (language === 'id' ? 'Beberapa sesi latihan dijadwalkan hari ini' : 'Multiple training sessions scheduled for today')
                      : t('today_plan_subtitle')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {todayPlans.length > 0 && (
                  <button
                    type="button"
                    id="add-another-today-session-btn"
                    onClick={() => onOpenCreatePlan(todayStr, language === 'id' ? `Sesi ${todayPlans.length + 1}` : `Session ${todayPlans.length + 1}`)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                    title={t('add_another_session')}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('add_another_session')}</span>
                    <span className="sm:hidden">+ Sesi</span>
                  </button>
                )}

                <button
                  id="view-all-plans-btn"
                  onClick={onGoToPlans}
                  className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <span>{t('view_full_schedule')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Today Plans Content */}
            {todayPlans.length > 0 ? (
              <div className="mt-5 space-y-4">
                {/* Multi-session Summary Header Bar (when > 1 session) */}
                {todayPlans.length > 1 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {language === 'id' ? 'Progres Latihan Hari Ini' : "Today's Training Progress"}:
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {todayCompletedPlans.length} / {todayPlans.length} {t('sessions_unit')} {language === 'id' ? 'selesai' : 'done'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] font-mono">
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                        {todayTotalActualDist.toFixed(1)} km {t('achieved')}
                      </span>
                      {todayTotalTargetDist > 0 && (
                        <span className="text-slate-400">
                          / {t('target_label')} {todayTotalTargetDist} km
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* List of Sessions for Today */}
                <div className="space-y-3">
                  {todayPlans.map((todayPlan, pIdx) => {
                    const isCompleted = todayPlan.actual_log?.is_run;
                    const isRest = todayPlan.type_run === 'Rest Day';

                    return (
                      <div 
                        key={todayPlan.id || `today-plan-${pIdx}`}
                        className={`p-4.5 rounded-2xl border transition-all ${
                          isRest
                            ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 italic'
                            : isCompleted 
                            ? 'bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-300 dark:border-emerald-500/20'
                            : 'bg-cyan-50/40 dark:bg-cyan-500/5 border-cyan-200 dark:border-cyan-500/20'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Session Label Badge */}
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 shadow-xs">
                              {todayPlan.session_label || `${t('session_item')} ${pIdx + 1}`}
                            </span>

                            {/* Run Type */}
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                              isRest
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              {todayPlan.type_run}
                            </span>

                            {/* Time */}
                            <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                              <span>{todayPlan.time || (language === 'id' ? '06:00' : '06:00 AM')}</span>
                            </span>

                            {/* Location */}
                            {todayPlan.target_location && (
                              <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                <span className="truncate max-w-[140px]">{todayPlan.target_location}</span>
                              </span>
                            )}
                          </div>

                          {/* Status Badge */}
                          {isCompleted ? (
                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t('completed_status')}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-medium shrink-0">
                              <span>{isRest ? (language === 'id' ? 'Istirahat' : 'Rest') : t('planned_pending')}</span>
                            </span>
                          )}
                        </div>

                        {/* Metrics Grid */}
                        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="p-2.5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/50">
                            <div className="text-[10px] uppercase font-mono text-slate-500">{t('target_distance')}</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                              {todayPlan.target_distance} <span className="text-xs font-normal text-slate-400">km</span>
                            </div>
                          </div>

                          <div className="p-2.5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/50">
                            <div className="text-[10px] uppercase font-mono text-slate-500">{t('target_pace')}</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                              {todayPlan.target_avg_pace || '-'}
                            </div>
                          </div>

                          <div className="p-2.5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/50">
                            <div className="text-[10px] uppercase font-mono text-slate-500">{t('actual_distance')}</div>
                            <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                              {isCompleted ? `${todayPlan.actual_log?.actual_distance} km` : '-'}
                            </div>
                          </div>

                          <div className="p-2.5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/50">
                            <div className="text-[10px] uppercase font-mono text-slate-500">{t('actual_duration')}</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                              {todayPlan.actual_log?.actual_duration || '-'}
                            </div>
                          </div>
                        </div>

                        {todayPlan.description && (
                          <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                            📝 {todayPlan.description}
                          </p>
                        )}

                        {/* Action buttons */}
                        <div className="mt-3 flex items-center justify-end space-x-2">
                          {!isCompleted && !isRest && (
                            <button
                              type="button"
                              id={`log-today-actual-btn-${todayPlan.id || pIdx}`}
                              onClick={() => onLogActual(todayPlan)}
                              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t('input_today_actual')}</span>
                            </button>
                          )}
                          {isCompleted && (
                            <button
                              type="button"
                              id={`edit-today-actual-btn-${todayPlan.id || pIdx}`}
                              onClick={() => onLogActual(todayPlan)}
                              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                            >
                              <span>{language === 'id' ? 'Edit Log' : 'Edit Log'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Shortcut to add another session */}
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    id="bottom-add-today-session-btn"
                    onClick={() => onOpenCreatePlan(todayStr, language === 'id' ? `Sesi ${todayPlans.length + 1}` : `Session ${todayPlans.length + 1}`)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-dashed border-cyan-400 dark:border-cyan-600 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{t('add_another_session')}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* If no plan today: Show shortcut "Buat Plan" */
              <div className="mt-6 p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <Footprints className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3 opacity-60" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('no_plan_today')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  {t('no_plan_today_sub')}
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    id="create-today-plan-btn"
                    onClick={() => onOpenCreatePlan(todayStr)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{t('create_today_plan')}</span>
                  </button>
                  <button
                    id="direct-record-today-btn"
                    onClick={() => onOpenQuickRunModal(todayStr)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>{t('directly_record_run')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Schedule Cards Strip (Week Overview with Prev / Next Navigation) */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('schedule_7_days')}
                </span>
                {weekOffset !== 0 && (
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 font-medium cursor-pointer transition-colors"
                  >
                    {language === 'id' ? 'Minggu Ini' : 'This Week'}
                  </button>
                )}
              </div>

              {/* Navigation buttons < and > */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  id="schedule-prev-week-btn"
                  onClick={() => setWeekOffset(prev => prev - 1)}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title={language === 'id' ? 'Minggu Sebelumnya' : 'Previous Week'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  id="schedule-next-week-btn"
                  onClick={() => setWeekOffset(prev => prev + 1)}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title={language === 'id' ? 'Minggu Berikutnya' : 'Next Week'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekDays.map((item, idx) => {
                const hasRun = item.dayPlans.some(p => p.type_run !== 'Rest Day');
                const isRest = item.isRestOnly;
                const completed = item.isAnyCompleted;
                const isSelected = selectedDayInfo?.date === item.dateFormatted;
                const sessionCount = item.dayPlans.length;

                return (
                  <button
                    type="button"
                    key={idx}
                    id={`schedule-day-${item.dateFormatted}`}
                    onClick={() => setSelectedDayInfo({
                      date: item.dateFormatted,
                      dayName: item.dayName,
                      plans: item.dayPlans
                    })}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer hover:scale-[1.03] active:scale-95 relative ${
                      isSelected
                        ? 'ring-2 ring-cyan-500 border-cyan-500 bg-cyan-500/10'
                        : item.isToday
                        ? 'border-cyan-500 ring-1 ring-cyan-500/30 bg-cyan-50/50 dark:bg-slate-800/60'
                        : 'border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700'
                    } ${
                      isRest
                        ? 'text-slate-400 italic'
                        : completed
                        ? 'border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10'
                        : hasRun
                        ? 'border-slate-300 dark:border-slate-700/60'
                        : 'text-slate-400'
                    }`}
                  >
                    {/* Multi-session tiny tag */}
                    {sessionCount > 1 && (
                      <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-cyan-500 text-slate-950 shadow-xs">
                        {sessionCount}x
                      </span>
                    )}

                    <div className="text-[10px] font-mono text-slate-500">{item.dayName}</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      {item.dateFormatted.split('-')[2]}
                    </div>
                    <div className="text-[10px] font-semibold mt-1 truncate">
                      {sessionCount > 0 ? (
                        isRest ? (
                          <span className="text-slate-400">Rest</span>
                        ) : (
                          <span className={completed ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                            {item.distance}k
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">-</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Schedule Summary Modal */}
      {selectedDayInfo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedDayInfo(null)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {new Date(selectedDayInfo.date + 'T00:00:00').toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </h3>
                    {selectedDayInfo.plans.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                        {selectedDayInfo.plans.length} {t('sessions_unit')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {language === 'id' ? 'Ringkasan Jadwal Latihan' : 'Schedule Summary'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="close-day-summary-modal-btn"
                onClick={() => setSelectedDayInfo(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal content */}
            {selectedDayInfo.plans.length > 0 ? (
              <div className="mt-4 space-y-4">
                {selectedDayInfo.plans.map((p, pIdx) => {
                  const isRunCompleted = p.actual_log?.is_run;
                  const isPlanRest = p.type_run === 'Rest Day';

                  return (
                    <div 
                      key={p.id || `selected-day-plan-${pIdx}`}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPlanRest
                          ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 italic'
                          : isRunCompleted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/20'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 shadow-xs">
                            {p.session_label || `${t('session_item')} ${pIdx + 1}`}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                            isPlanRest
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                              : 'bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          }`}>
                            {p.type_run}
                          </span>
                          {p.time && (
                            <span className="text-xs text-slate-500 flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{p.time}</span>
                            </span>
                          )}
                        </div>

                        {isRunCompleted ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t('completed_status')}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                            <span>{isPlanRest ? (language === 'id' ? 'Istirahat' : 'Rest') : t('planned_pending')}</span>
                          </span>
                        )}
                      </div>

                      {/* Planned target grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/50">
                          <div className="text-[10px] text-slate-500 uppercase font-mono">{t('target_distance')}</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            {p.target_distance} km
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/50">
                          <div className="text-[10px] text-slate-500 uppercase font-mono">{t('target_pace')}</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            {p.target_avg_pace || '-'}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/50">
                          <div className="text-[10px] text-slate-500 uppercase font-mono">{t('actual_distance')}</div>
                          <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                            {isRunCompleted ? `${p.actual_log?.actual_distance} km` : '-'}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/50">
                          <div className="text-[10px] text-slate-500 uppercase font-mono">{t('actual_duration')}</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            {p.actual_log?.actual_duration || '-'}
                          </div>
                        </div>
                      </div>

                      {p.target_location && (
                        <div className="mt-2 text-xs text-slate-500 flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.target_location}</span>
                        </div>
                      )}

                      {p.description && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                          📝 {p.description}
                        </p>
                      )}

                      {/* Action Button for this session */}
                      <div className="mt-3 flex justify-end space-x-2">
                        {!isRunCompleted && !isPlanRest && (
                          <button
                            type="button"
                            id={`summary-log-actual-btn-${p.id || pIdx}`}
                            onClick={() => {
                              setSelectedDayInfo(null);
                              onLogActual(p);
                            }}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-xs transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t('input_today_actual')}</span>
                          </button>
                        )}
                        {isRunCompleted && (
                          <button
                            type="button"
                            id={`summary-edit-log-btn-${p.id || pIdx}`}
                            onClick={() => {
                              setSelectedDayInfo(null);
                              onLogActual(p);
                            }}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer transition-colors"
                          >
                            <span>{language === 'id' ? 'Edit Hasil' : 'Edit Log'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Button to add another session for this specific date */}
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    id="add-session-to-selected-date-btn"
                    onClick={() => {
                      const date = selectedDayInfo.date;
                      const nextLabel = language === 'id' 
                        ? `Sesi ${selectedDayInfo.plans.length + 1}` 
                        : `Session ${selectedDayInfo.plans.length + 1}`;
                      setSelectedDayInfo(null);
                      onOpenCreatePlan(date, nextLabel);
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{t('add_another_session')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 py-4 text-center space-y-3">
                <Footprints className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto opacity-50" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'id' ? 'Tidak ada jadwal latihan pada tanggal ini.' : 'No workout planned for this date.'}
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    type="button"
                    id="summary-create-plan-btn"
                    onClick={() => {
                      const date = selectedDayInfo.date;
                      setSelectedDayInfo(null);
                      onOpenCreatePlan(date);
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t('create_plan')}</span>
                  </button>
                  <button
                    type="button"
                    id="summary-quick-log-btn"
                    onClick={() => {
                      const date = selectedDayInfo.date;
                      setSelectedDayInfo(null);
                      onOpenQuickRunModal(date);
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>{t('directly_record_run')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
