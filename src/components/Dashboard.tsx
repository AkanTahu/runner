import React from 'react';
import { 
  Footprints, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Heart, 
  Activity, 
  Clock, 
  MapPin, 
  ArrowUpRight
} from 'lucide-react';
import { Plan, Gear, UserSettings } from '../types';
import { useAuth } from '../lib/authContext';

interface DashboardProps {
  plans: Plan[];
  gears: Gear[];
  userSettings?: UserSettings;
  onOpenCreatePlan: () => void;
  onLogActual: (plan: Plan) => void;
  onOpenQuickRunModal: () => void;
  onGoToPlans: () => void;
  onGoToGears: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  plans,
  gears,
  userSettings,
  onOpenCreatePlan,
  onLogActual,
  onOpenQuickRunModal,
  onGoToPlans,
  onGoToGears
}) => {
  const { t, language } = useAuth();
  const weeklyTargetKm = userSettings?.weekly_target_km || 30;

  // Calculate current week range (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const todayStr = now.toISOString().split('T')[0];

  // Calculate stats
  let totalDistanceCompleted = 0;
  let plannedDistanceRemaining = 0;
  let totalRunPacesSec: number[] = [];
  let totalHeartRates: number[] = [];

  plans.forEach((p) => {
    const pDate = new Date(p.date);
    const isThisWeek = pDate >= monday && pDate <= sunday;

    if (p.actual_log?.is_run) {
      if (isThisWeek) {
        totalDistanceCompleted += p.actual_log.actual_distance;
      }
      if (p.actual_log.actual_avg_pace && p.actual_log.actual_avg_pace !== '-') {
        const parts = p.actual_log.actual_avg_pace.split(':').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          totalRunPacesSec.push(parts[0] * 60 + parts[1]);
        }
      }
      if (p.actual_log.avg_heart_rate) {
        totalHeartRates.push(p.actual_log.avg_heart_rate);
      }
    } else if (isThisWeek && p.type_run !== 'Rest Day') {
      plannedDistanceRemaining += p.target_distance;
    }
  });

  const percentageAchieved = Math.min(100, Math.round((totalDistanceCompleted / weeklyTargetKm) * 100));

  // Today's plan
  const todayPlan = plans.find((p) => p.date === todayStr);

  // Active shoes
  const activeShoes = gears.filter(g => g.category === 'Sepatu' && g.is_active);
  const primaryShoe = activeShoes.length > 0 ? activeShoes[0] : null;

  // Pace average calculation
  const avgPaceStr = totalRunPacesSec.length > 0
    ? (() => {
        const avgSec = Math.round(totalRunPacesSec.reduce((a, b) => a + b, 0) / totalRunPacesSec.length);
        const m = Math.floor(avgSec / 60);
        const s = avgSec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      })()
    : '05:30';

  const avgHeartRateStr = totalHeartRates.length > 0
    ? Math.round(totalHeartRates.reduce((a, b) => a + b, 0) / totalHeartRates.length)
    : 145;

  // Weekdays representation for mini chart
  const dayNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayNamesId = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const activeDayNames = language === 'id' ? dayNamesId : dayNamesEn;

  const weekDays = activeDayNames.map((dayName, index) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + index);
    const dateFormatted = dayDate.toISOString().split('T')[0];
    const dayPlan = plans.find(p => p.date === dateFormatted);
    const isToday = dateFormatted === todayStr;
    const isCompleted = dayPlan?.actual_log?.is_run;
    const distance = isCompleted 
      ? dayPlan!.actual_log!.actual_distance 
      : (dayPlan ? dayPlan.target_distance : 0);

    return {
      dayName,
      dateFormatted,
      dayPlan,
      isToday,
      isCompleted,
      distance
    };
  });

  // Donut SVG parameters
  const strokeWidth = 14;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentageAchieved / 100) * circumference;

  return (
    <div id="dashboard-main-view" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner / Sleek Motivational Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs transition-colors">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-md shadow-cyan-500/10 shrink-0">
            <TrendingUp className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                {userSettings?.runner_name || (language === 'id' ? 'Selamat Datang, Pelari' : 'Welcome, Runner')}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic mt-1 font-light">
              "{userSettings?.motivation_quote || (language === 'id' ? 'Disiplin dan konsistensi adalah kunci mencapai finish line.' : 'It never gets easier, you just go faster.')}"
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            id="dash-quick-log-btn"
            onClick={onOpenQuickRunModal}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('log_run_result')}</span>
          </button>
        </div>
      </div>

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
                  <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('today_schedule')} ({new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' })})
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {t('today_plan_subtitle')}
                  </p>
                </div>
              </div>

              <button
                id="view-all-plans-btn"
                onClick={onGoToPlans}
                className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <span>{t('view_full_schedule')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Today Plan Status */}
            {todayPlan ? (
              <div className={`mt-5 p-5 rounded-2xl border transition-all ${
                todayPlan.type_run === 'Rest Day'
                  ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 italic'
                  : (todayPlan.actual_log?.is_run 
                      ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-300 dark:border-emerald-500/20'
                      : 'bg-cyan-50/50 dark:bg-cyan-500/5 border-cyan-200 dark:border-cyan-500/20')
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                      todayPlan.type_run === 'Rest Day'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                        : 'bg-cyan-500 text-slate-950 shadow-xs'
                    }`}>
                      {todayPlan.type_run}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{todayPlan.time || (language === 'id' ? 'Pagi' : 'Morning')}</span>
                    </span>
                    {todayPlan.target_location && (
                      <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{todayPlan.target_location}</span>
                      </span>
                    )}
                  </div>

                  {todayPlan.actual_log?.is_run ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('completed_status')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-medium">
                      <span>{t('planned_pending')}</span>
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/50">
                    <div className="text-[10px] uppercase font-mono text-slate-500">{t('target_distance')}</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {todayPlan.target_distance} <span className="text-xs font-normal text-slate-400">km</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/50">
                    <div className="text-[10px] uppercase font-mono text-slate-500">{t('target_pace')}</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {todayPlan.target_avg_pace || '-'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/50">
                    <div className="text-[10px] uppercase font-mono text-slate-500">{t('actual_distance')}</div>
                    <div className="text-base font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                      {todayPlan.actual_log?.is_run ? `${todayPlan.actual_log.actual_distance} km` : '-'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/50">
                    <div className="text-[10px] uppercase font-mono text-slate-500">{t('actual_duration')}</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {todayPlan.actual_log?.actual_duration || '-'}
                    </div>
                  </div>
                </div>

                {todayPlan.description && (
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    📝 {todayPlan.description}
                  </p>
                )}

                {/* Quick prompt to input actual */}
                {!todayPlan.actual_log?.is_run && todayPlan.type_run !== 'Rest Day' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      id="log-today-actual-btn"
                      onClick={() => onLogActual(todayPlan)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('input_today_actual')}</span>
                    </button>
                  </div>
                )}
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
                    onClick={onOpenCreatePlan}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{t('create_today_plan')}</span>
                  </button>
                  <button
                    id="direct-record-today-btn"
                    onClick={onOpenQuickRunModal}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>{t('directly_record_run')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Schedule Cards Strip (Week Overview) */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              {t('schedule_7_days')}
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekDays.map((item, idx) => {
                const hasRun = item.dayPlan && item.dayPlan.type_run !== 'Rest Day';
                const isRest = item.dayPlan?.type_run === 'Rest Day';
                const completed = item.isCompleted;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      item.isToday
                        ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-50/50 dark:bg-slate-800/60'
                        : 'border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30'
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
                    <div className="text-[10px] font-mono text-slate-500">{item.dayName}</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      {item.dateFormatted.split('-')[2]}
                    </div>
                    <div className="text-[10px] font-semibold mt-1 truncate">
                      {item.dayPlan ? (
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Performance & Gear Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric: Avg Pace */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs flex items-center space-x-3.5 transition-colors">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{t('avg_running_pace')}</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {avgPaceStr} <span className="text-xs font-normal text-slate-400">min/km</span>
            </div>
          </div>
        </div>

        {/* Metric: Avg Heart Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs flex items-center space-x-3.5 transition-colors">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{t('avg_heart_rate')}</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {avgHeartRateStr} <span className="text-xs font-normal text-slate-400">bpm</span>
            </div>
          </div>
        </div>

        {/* Metric: Total Sesi Terlaksana */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs flex items-center space-x-3.5 transition-colors">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{t('completed_sessions')}</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {plans.filter(p => p.actual_log?.is_run).length} <span className="text-xs font-normal text-slate-400">runs</span>
            </div>
          </div>
        </div>

        {/* Metric: Primary Shoe Mileage */}
        <div 
          onClick={onGoToGears}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs flex items-center space-x-3.5 cursor-pointer hover:border-cyan-500/40 transition-colors group"
        >
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Footprints className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase truncate tracking-wider">
              {primaryShoe ? primaryShoe.name : (language === 'id' ? 'Sepatu Utama' : 'Primary Shoes')}
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {primaryShoe ? primaryShoe.total_distance.toFixed(1) : 0} <span className="text-xs font-normal text-slate-400">km</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

