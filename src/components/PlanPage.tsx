import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Activity, 
  Heart, 
  Trash2, 
  Edit3, 
  Footprints, 
  Flame, 
  Zap,
  Coffee,
  CalendarRange,
  ListFilter,
  Layers,
  Sparkles
} from 'lucide-react';
import { Plan, RunType, Gear } from '../types';
import { deletePlan } from '../lib/planService';
import { useAuth } from '../lib/authContext';

interface PlanPageProps {
  plans: Plan[];
  gears: Gear[];
  onOpenCreatePlan: (defaultDate?: string, defaultSessionLabel?: string) => void;
  onOpenQuickRunModal: (defaultDate?: string, defaultSessionLabel?: string) => void;
  onEditPlan: (plan: Plan) => void;
  onLogActual: (plan: Plan) => void;
}

export const PlanPage: React.FC<PlanPageProps> = ({
  plans,
  gears,
  onOpenCreatePlan,
  onOpenQuickRunModal,
  onEditPlan,
  onLogActual
}) => {
  const { t, language } = useAuth();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Week display modes
  const [groupByWeek, setGroupByWeek] = useState<boolean>(true);
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('all');

  // Helper date calculations
  const today = new Date();
  const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getMondayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay(); // 0 is Sun, 1 is Mon...
    const diff = (day === 0 ? -6 : 1) - day;
    date.setDate(date.getDate() + diff);
    return date;
  };

  const todayMondayISO = toISODate(getMondayDate(toISODate(today)));

  // Filter plans by type and search query
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // Run type filter
      if (filterType !== 'all') {
        if (filterType === 'completed') {
          if (!plan.actual_log?.is_run) return false;
        } else if (filterType === 'planned') {
          if (plan.actual_log?.is_run) return false;
        } else if (plan.type_run !== filterType) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLoc = plan.target_location?.toLowerCase().includes(q);
        const matchDesc = plan.description?.toLowerCase().includes(q);
        const matchType = plan.type_run.toLowerCase().includes(q);
        const matchDate = plan.date.includes(q);
        if (!matchLoc && !matchDesc && !matchType && !matchDate) return false;
      }

      // Week filter
      if (selectedWeekFilter !== 'all') {
        const planMondayISO = toISODate(getMondayDate(plan.date));
        if (selectedWeekFilter === 'this_week') {
          if (planMondayISO !== todayMondayISO) return false;
        } else if (selectedWeekFilter === 'last_week') {
          const lastWeekMonday = new Date(getMondayDate(toISODate(today)));
          lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);
          if (planMondayISO !== toISODate(lastWeekMonday)) return false;
        } else if (selectedWeekFilter === 'next_week') {
          const nextWeekMonday = new Date(getMondayDate(toISODate(today)));
          nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);
          if (planMondayISO !== toISODate(nextWeekMonday)) return false;
        } else if (planMondayISO !== selectedWeekFilter) {
          return false;
        }
      }

      return true;
    });
  }, [plans, filterType, searchQuery, selectedWeekFilter, todayMondayISO]);

  // Unique weeks in plans for dropdown selector
  const availableWeeks = useMemo(() => {
    const weekMap = new Map<string, { start: Date; end: Date; label: string }>();
    
    // Always include this week
    const thisMon = getMondayDate(toISODate(today));
    const thisSun = new Date(thisMon);
    thisSun.setDate(thisMon.getDate() + 6);
    const thisMonISO = toISODate(thisMon);
    weekMap.set(thisMonISO, {
      start: thisMon,
      end: thisSun,
      label: `${thisMon.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })} – ${thisSun.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
    });

    plans.forEach(p => {
      const mon = getMondayDate(p.date);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const monISO = toISODate(mon);
      if (!weekMap.has(monISO)) {
        weekMap.set(monISO, {
          start: mon,
          end: sun,
          label: `${mon.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
        });
      }
    });

    return Array.from(weekMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [plans, language, today]);

  // Group filtered plans by week
  const groupedWeekPlans = useMemo(() => {
    const groups = new Map<string, Plan[]>();
    
    filteredPlans.forEach(plan => {
      const monISO = toISODate(getMondayDate(plan.date));
      const existing = groups.get(monISO) || [];
      existing.push(plan);
      groups.set(monISO, existing);
    });

    // Format week groups
    const result = Array.from(groups.entries()).map(([monISO, weekPlans]) => {
      const monDate = new Date(monISO + 'T00:00:00');
      const sunDate = new Date(monDate);
      sunDate.setDate(monDate.getDate() + 6);

      const isThisWeek = monISO === todayMondayISO;
      const completedRuns = weekPlans.filter(p => p.actual_log?.is_run);
      const totalActualDist = completedRuns.reduce((sum, p) => sum + (p.actual_log?.actual_distance || 0), 0);
      const totalTargetDist = weekPlans.reduce((sum, p) => sum + (p.type_run !== 'Rest Day' ? p.target_distance : 0), 0);

      // Pace
      let paceSec = 0;
      let paceCnt = 0;
      completedRuns.forEach(p => {
        if (p.actual_log?.actual_avg_pace && p.actual_log.actual_avg_pace !== '-') {
          const parts = p.actual_log.actual_avg_pace.split(':').map(Number);
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            paceSec += parts[0] * 60 + parts[1];
            paceCnt++;
          }
        }
      });
      const avgPace = paceCnt > 0 
        ? `${String(Math.floor((paceSec / paceCnt) / 60)).padStart(2, '0')}:${String(Math.round((paceSec / paceCnt) % 60)).padStart(2, '0')}`
        : '-';

      const label = `${monDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })} – ${sunDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;

      return {
        weekKey: monISO,
        label,
        isThisWeek,
        plans: weekPlans.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return (a.time || '00:00').localeCompare(b.time || '00:00');
        }),
        totalActualDist,
        totalTargetDist,
        completedCount: completedRuns.length,
        plannedCount: weekPlans.filter(p => p.type_run !== 'Rest Day').length,
        avgPace
      };
    });

    // Sort weeks descending (most recent / current first)
    return result.sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  }, [filteredPlans, todayMondayISO, language]);

  const handleDelete = async (plan: Plan) => {
    if (!plan.id) return;
    const confirmMsg = language === 'id' 
      ? `Hapus jadwal/log lari tanggal ${plan.date}?` 
      : `Delete run schedule/log for ${plan.date}?`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(plan.id);
    try {
      await deletePlan(plan.id, plan);
    } catch (err) {
      console.error('Failed to delete plan:', err);
      alert('Failed to delete plan.');
    } finally {
      setDeletingId(null);
    }
  };

  const getRunTypeIcon = (type: RunType) => {
    switch (type) {
      case 'Interval':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'Tempo':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'Long Run':
        return <Footprints className="w-4 h-4 text-purple-500" />;
      case 'Rest Day':
        return <Coffee className="w-4 h-4 text-slate-400" />;
      case 'Recovery':
        return <Activity className="w-4 h-4 text-emerald-500" />;
      default:
        return <Footprints className="w-4 h-4 text-blue-500" />;
    }
  };

  // Find gear name by shoe_id
  const getShoeName = (shoeId?: string) => {
    if (!shoeId) return null;
    const g = gears.find(item => item.id === shoeId);
    return g ? g.name : null;
  };

  // Render a single plan row card
  const renderPlanCard = (plan: Plan) => {
    const isCompleted = plan.actual_log?.is_run;
    const isRestDay = plan.type_run === 'Rest Day';
    const shoeName = getShoeName(plan.actual_log?.shoe_id);
    const dateObj = new Date(plan.date + 'T00:00:00');

    return (
      <div
        key={plan.id}
        id={`plan-row-card-${plan.id}`}
        className={`p-5 rounded-3xl border transition-all hover:border-slate-300 dark:hover:border-slate-700/80 shadow-xs ${
          isRestDay
            ? 'bg-slate-50/70 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 italic text-slate-500 dark:text-slate-400'
            : isCompleted
            ? 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/5 backdrop-blur-sm'
            : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/5 backdrop-blur-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left block: Date badge, Run Type & Location */}
          <div className="flex items-start space-x-3.5">
            {/* Date badge */}
            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
              isRestDay
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                : isCompleted
                ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400'
                : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
            }`}>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                {dateObj.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' })}
              </span>
              <span className="text-lg font-bold leading-none mt-0.5">
                {plan.date.split('-')[2]}
              </span>
            </div>

            {/* Meta info */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center space-x-1.5 text-sm font-bold text-slate-900 dark:text-white">
                  {getRunTypeIcon(plan.type_run)}
                  <span>{plan.type_run}</span>
                </span>

                {/* Session Label Badge (e.g. Sesi Pagi, Sesi 1, Sesi Sore) */}
                {plan.session_label && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 shadow-2xs">
                    {plan.session_label}
                  </span>
                )}

                {/* Status Badge */}
                {isCompleted ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{t('completed_status')}</span>
                  </span>
                ) : isRestDay ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Rest Recovery
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    {t('planned_pending')}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                {plan.time && (
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{plan.time}</span>
                  </span>
                )}
                {plan.target_location && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{plan.target_location}</span>
                  </span>
                )}
                {shoeName && (
                  <span className="flex items-center space-x-1 text-cyan-600 dark:text-cyan-400 font-medium">
                    <Footprints className="w-3.5 h-3.5" />
                    <span>{shoeName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center block: Target vs Actual Numbers */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-2 sm:py-0 border-y sm:border-y-0 sm:border-x border-slate-100 dark:border-slate-800/80 px-0 sm:px-6">
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">{t('target_distance')}</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {isRestDay ? '0 km' : `${plan.target_distance} km`}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">{t('actual_distance')}</div>
              <div className={`text-sm font-bold mt-0.5 ${
                isCompleted ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {isCompleted ? `${plan.actual_log?.actual_distance} km` : '-'}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Avg Pace</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {isCompleted ? (plan.actual_log?.actual_avg_pace || '-') : (plan.target_avg_pace || '-')}
              </div>
            </div>

            {isCompleted && plan.actual_log?.avg_heart_rate && (
              <div className="hidden sm:block">
                <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Heart Rate</div>
                <div className="text-sm font-bold text-rose-500 dark:text-rose-400 flex items-center space-x-1 mt-0.5">
                  <Heart className="w-3 h-3 fill-current" />
                  <span>{plan.actual_log.avg_heart_rate} bpm</span>
                </div>
              </div>
            )}
          </div>

          {/* Right block: Action Buttons */}
          <div className="flex items-center justify-end space-x-2">
            {!isCompleted && !isRestDay && (
              <button
                id={`row-log-actual-btn-${plan.id}`}
                onClick={() => onLogActual(plan)}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Log Actual</span>
              </button>
            )}

            <button
              id={`row-add-session-btn-${plan.id}`}
              onClick={() => {
                const countOnDate = plans.filter(p => p.date === plan.date).length;
                const nextLabel = language === 'id' ? `Sesi ${countOnDate + 1}` : `Session ${countOnDate + 1}`;
                onOpenCreatePlan(plan.date, nextLabel);
              }}
              title={t('add_another_session')}
              className="p-2 rounded-xl text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[11px] font-bold hidden xl:inline">{language === 'id' ? '+ Sesi' : '+ Session'}</span>
            </button>

            <button
              id={`row-edit-plan-btn-${plan.id}`}
              onClick={() => onEditPlan(plan)}
              title={t('edit')}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              id={`row-delete-plan-btn-${plan.id}`}
              onClick={() => handleDelete(plan)}
              disabled={deletingId === plan.id}
              title={t('delete')}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-description or Strategy details toggle */}
        {(plan.description || plan.strategy_details || plan.actual_log?.actual_description) && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            {plan.strategy_details && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-2xl text-[11px]">
                {plan.strategy_details.warm_up && (
                  <span>🏃 <strong className="text-slate-800 dark:text-slate-200">Warm up:</strong> {plan.strategy_details.warm_up}</span>
                )}
                {plan.strategy_details.speed_session && (
                  <span>⚡ <strong className="text-slate-800 dark:text-slate-200">Set:</strong> {plan.strategy_details.speed_session}</span>
                )}
                {plan.strategy_details.cooldown && (
                  <span>🧘 <strong className="text-slate-800 dark:text-slate-200">Cooldown:</strong> {plan.strategy_details.cooldown}</span>
                )}
              </div>
            )}
            {plan.description && !plan.actual_log?.actual_description && (
              <p className="line-clamp-1 italic text-slate-500 dark:text-slate-400">📌 {plan.description}</p>
            )}
            {plan.actual_log?.actual_description && (
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                💬 <strong className="text-cyan-600 dark:text-cyan-400">{language === 'id' ? 'Evaluasi:' : 'Evaluation:'}</strong> {plan.actual_log.actual_description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="plan-page-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">
            {t('plans')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'id' 
              ? 'Manajemen rencana latihan dan pencatatan hasil aktual terstruktur per minggu'
              : 'Daily schedule management and verified workout performance organized by week'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="plan-page-create-plan-btn"
            onClick={onOpenCreatePlan}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-xs cursor-pointer"
          >
            <CalendarIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>+ {t('create_plan')}</span>
          </button>

          <button
            id="plan-page-quick-log-btn"
            onClick={onOpenQuickRunModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('log_run_result')}</span>
          </button>
        </div>
      </div>

      {/* Week Selector & View Mode Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Week Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
              <CalendarRange className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{t('filter_by_week')}:</span>
            </span>
            <select
              id="plan-week-filter-select"
              value={selectedWeekFilter}
              onChange={(e) => setSelectedWeekFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-xs"
            >
              <option value="all">{t('all_weeks')}</option>
              <option value="this_week">⭐️ {t('this_week')}</option>
              <option value="last_week">{t('last_week')}</option>
              <option value="next_week">{t('next_week')}</option>
              {availableWeeks.map(([weekKey, info]) => (
                <option key={weekKey} value={weekKey}>
                  {info.label} {weekKey === todayMondayISO ? `(${t('this_week')})` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedWeekFilter !== 'all' && (
            <button
              onClick={() => setSelectedWeekFilter('all')}
              className="px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              {language === 'id' ? 'Reset Minggu' : 'Reset Week'}
            </button>
          )}
        </div>

        {/* View Mode Toggle: Group by Week vs All List */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
          <button
            id="plan-view-by-week-toggle"
            onClick={() => setGroupByWeek(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              groupByWeek
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{t('view_by_week')}</span>
          </button>

          <button
            id="plan-view-all-list-toggle"
            onClick={() => setGroupByWeek(false)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              !groupByWeek
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{t('view_all_list')}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-xs transition-colors">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            id="search-plans-input"
            placeholder={language === 'id' ? 'Cari lokasi, tipe lari, atau catatan...' : 'Search location, run type, or note...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: language === 'id' ? 'Semua' : 'All' },
            { id: 'planned', label: language === 'id' ? 'Pending Plan' : 'Pending' },
            { id: 'completed', label: language === 'id' ? 'Selesai (Completed)' : 'Completed' },
            { id: 'Easy', label: 'Easy' },
            { id: 'Tempo', label: 'Tempo' },
            { id: 'Interval', label: 'Interval' },
            { id: 'Long Run', label: 'Long Run' },
            { id: 'Rest Day', label: 'Rest Day' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilterType(chip.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterType === chip.id
                  ? 'bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Grouped by Week OR Flat List */}
      {filteredPlans.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 shadow-xs">
          <Footprints className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {language === 'id' ? 'Tidak Ada Data Sesi Lari yang Cocok' : 'No matching run sessions found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {language === 'id' 
              ? 'Cobalah ubah filter pencarian atau pilih minggu lain.'
              : 'Try changing search filters or selecting another week.'}
          </p>
        </div>
      ) : groupByWeek ? (
        /* Grouped by Week view */
        <div className="space-y-6">
          {groupedWeekPlans.map((group) => (
            <div 
              key={group.weekKey}
              id={`week-group-block-${group.weekKey}`}
              className="space-y-3"
            >
              {/* Week Header Banner Card */}
              <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                group.isThisWeek
                  ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-800/60 ring-1 ring-cyan-400/40'
                  : 'bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-2xl ${
                    group.isThisWeek
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    <CalendarRange className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {group.label}
                      </h3>
                      {group.isThisWeek && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950 uppercase tracking-wider shadow-xs">
                          {t('this_week')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {group.plans.length} {language === 'id' ? 'hari terjadwal' : 'scheduled days'}
                    </div>
                  </div>
                </div>

                {/* Week Metrics Summary Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  {/* Distance Pill */}
                  <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center space-x-1.5">
                    <Footprints className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {group.totalActualDist.toFixed(1)}
                    </span>
                    <span className="text-slate-400">/ {group.totalTargetDist.toFixed(1)} km</span>
                  </div>

                  {/* Sessions Count Pill */}
                  <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {group.completedCount}
                    </span>
                    <span className="text-slate-400">/ {group.plannedCount} {language === 'id' ? 'sesi' : 'runs'}</span>
                  </div>

                  {/* Average Pace Pill */}
                  {group.avgPace !== '-' && (
                    <div className="hidden md:flex px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span className="font-bold text-slate-900 dark:text-white">{group.avgPace}</span>
                      <span className="text-slate-400">/km</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Day Cards for this week */}
              <div className="space-y-3 pl-1 sm:pl-3 border-l-2 border-slate-200 dark:border-slate-800 ml-3 sm:ml-4">
                {group.plans.map(plan => renderPlanCard(plan))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Flat List View */
        <div className="space-y-3">
          {filteredPlans.map(plan => renderPlanCard(plan))}
        </div>
      )}
    </div>
  );
};


