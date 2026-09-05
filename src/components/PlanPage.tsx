import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
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
  ChevronRight
} from 'lucide-react';
import { Plan, RunType, Gear } from '../types';
import { deletePlan } from '../lib/planService';

interface PlanPageProps {
  plans: Plan[];
  gears: Gear[];
  onOpenCreatePlan: () => void;
  onOpenQuickRunModal: () => void;
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
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter plans
  const filteredPlans = plans.filter((plan) => {
    if (filterType !== 'all') {
      if (filterType === 'completed') {
        if (!plan.actual_log?.is_run) return false;
      } else if (filterType === 'planned') {
        if (plan.actual_log?.is_run) return false;
      } else if (plan.type_run !== filterType) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLoc = plan.target_location?.toLowerCase().includes(q);
      const matchDesc = plan.description?.toLowerCase().includes(q);
      const matchType = plan.type_run.toLowerCase().includes(q);
      const matchDate = plan.date.includes(q);
      if (!matchLoc && !matchDesc && !matchType && !matchDate) return false;
    }

    return true;
  });

  const handleDelete = async (plan: Plan) => {
    if (!plan.id) return;
    if (!window.confirm(`Hapus jadwal/log lari tanggal ${plan.date}?`)) return;

    setDeletingId(plan.id);
    try {
      await deletePlan(plan.id, plan);
    } catch (err) {
      console.error('Failed to delete plan:', err);
      alert('Gagal menghapus data dari Firestore.');
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
        return <Coffee className="w-4 h-4 text-zinc-400" />;
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

  return (
    <div id="plan-page-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight uppercase">
            Jadwal & Log Lari (Plan)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manajemen rencana harian dan pencatatan hasil aktual terverifikasi
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="plan-page-create-plan-btn"
            onClick={onOpenCreatePlan}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <CalendarIcon className="w-4 h-4 text-cyan-400" />
            <span>+ Buat Rencana (Plan)</span>
          </button>

          <button
            id="plan-page-quick-log-btn"
            onClick={onOpenQuickRunModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Catat Hasil Selesai</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-sm">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            id="search-plans-input"
            placeholder="Cari lokasi, tipe lari, atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800/60 border border-slate-700/60 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'planned', label: 'Pending Plan' },
            { id: 'completed', label: 'Selesai (Completed)' },
            { id: 'Easy', label: 'Easy' },
            { id: 'Tempo', label: 'Tempo' },
            { id: 'Interval', label: 'Interval' },
            { id: 'Long Run', label: 'Long Run' },
            { id: 'Rest Day', label: 'Rest Day' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilterType(chip.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === chip.id
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-xs'
                  : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row-Based Cards List */}
      <div className="space-y-3">
        {filteredPlans.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800">
            <Footprints className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">
              Tidak Ada Data Sesi Lari yang Cocok
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Cobalah ubah filter pencarian atau buat jadwal/log aktivitas baru untuk hari ini.
            </p>
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const isCompleted = plan.actual_log?.is_run;
            const isRestDay = plan.type_run === 'Rest Day';
            const shoeName = getShoeName(plan.actual_log?.shoe_id);
            const dateObj = new Date(plan.date);

            return (
              <div
                key={plan.id}
                id={`plan-row-card-${plan.id}`}
                className={`p-5 rounded-3xl border transition-all hover:border-slate-700/80 ${
                  isRestDay
                    ? 'bg-slate-900/30 border-slate-800 italic text-slate-400'
                    : isCompleted
                    ? 'bg-slate-900/40 border-white/5 backdrop-blur-sm'
                    : 'bg-slate-900/40 border-white/5 backdrop-blur-sm'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left block: Date badge, Run Type & Location */}
                  <div className="flex items-start space-x-3.5">
                    {/* Date badge */}
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                      isRestDay
                        ? 'bg-slate-800 border-slate-700 text-slate-400'
                        : isCompleted
                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                    }`}>
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                        {dateObj.toLocaleDateString('id-ID', { weekday: 'short' })}
                      </span>
                      <span className="text-lg font-bold leading-none mt-0.5">
                        {plan.date.split('-')[2]}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center space-x-1.5 text-sm font-bold text-white">
                          {getRunTypeIcon(plan.type_run)}
                          <span>{plan.type_run}</span>
                        </span>

                        {/* Status Badge */}
                        {isCompleted ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        ) : isRestDay ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                            Rest Recovery
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Planned
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {plan.time && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{plan.time}</span>
                          </span>
                        )}
                        {plan.target_location && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{plan.target_location}</span>
                          </span>
                        )}
                        {shoeName && (
                          <span className="flex items-center space-x-1 text-cyan-400 font-medium">
                            <Footprints className="w-3.5 h-3.5" />
                            <span>{shoeName}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center block: Target vs Actual Numbers */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-2 sm:py-0 border-y sm:border-y-0 sm:border-x border-slate-800/80 px-0 sm:px-6">
                    <div>
                      <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Target Dist</div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {isRestDay ? '0 km' : `${plan.target_distance} km`}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Aktual Dist</div>
                      <div className={`text-sm font-bold mt-0.5 ${
                        isCompleted ? 'text-cyan-400' : 'text-slate-500'
                      }`}>
                        {isCompleted ? `${plan.actual_log?.actual_distance} km` : '-'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Avg Pace</div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {isCompleted ? (plan.actual_log?.actual_avg_pace || '-') : (plan.target_avg_pace || '-')}
                      </div>
                    </div>

                    {isCompleted && plan.actual_log?.avg_heart_rate && (
                      <div className="hidden sm:block">
                        <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Heart Rate</div>
                        <div className="text-sm font-bold text-rose-400 flex items-center space-x-1 mt-0.5">
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
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Log Actual</span>
                      </button>
                    )}

                    <button
                      id={`row-edit-plan-btn-${plan.id}`}
                      onClick={() => onEditPlan(plan)}
                      title="Edit Sesi"
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      id={`row-delete-plan-btn-${plan.id}`}
                      onClick={() => handleDelete(plan)}
                      disabled={deletingId === plan.id}
                      title="Hapus"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-description or Strategy details toggle */}
                {(plan.description || plan.strategy_details || plan.actual_log?.actual_description) && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 text-xs text-slate-400 space-y-1.5">
                    {plan.strategy_details && (
                      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-2xl text-[11px]">
                        {plan.strategy_details.warm_up && (
                          <span>🏃 <strong className="text-slate-200">Warm up:</strong> {plan.strategy_details.warm_up}</span>
                        )}
                        {plan.strategy_details.speed_session && (
                          <span>⚡ <strong className="text-slate-200">Set:</strong> {plan.strategy_details.speed_session}</span>
                        )}
                        {plan.strategy_details.cooldown && (
                          <span>🧘 <strong className="text-slate-200">Cooldown:</strong> {plan.strategy_details.cooldown}</span>
                        )}
                      </div>
                    )}
                    {plan.description && !plan.actual_log?.actual_description && (
                      <p className="line-clamp-1 italic text-slate-400">📌 {plan.description}</p>
                    )}
                    {plan.actual_log?.actual_description && (
                      <p className="text-slate-300 font-medium">
                        💬 <strong className="text-cyan-400">Evaluasi:</strong> {plan.actual_log.actual_description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
