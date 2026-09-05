import React, { useState } from 'react';
import { 
  BarChart3, 
  Flame, 
  Target, 
  Calendar, 
  Activity, 
  Footprints, 
  CheckCircle2, 
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Plan, Gear } from '../types';

interface SummaryPageProps {
  plans: Plan[];
  gears: Gear[];
}

export const SummaryPage: React.FC<SummaryPageProps> = ({ plans, gears }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Compute aggregated stats
  const completedRuns = plans.filter(p => p.actual_log?.is_run);
  const totalActualDistance = completedRuns.reduce((sum, p) => sum + (p.actual_log?.actual_distance || 0), 0);
  const totalPlannedDistance = plans.reduce((sum, p) => sum + (p.type_run !== 'Rest Day' ? p.target_distance : 0), 0);

  // Pace calculations
  let paceSecondsSum = 0;
  let paceCount = 0;
  completedRuns.forEach(p => {
    if (p.actual_log?.actual_avg_pace && p.actual_log.actual_avg_pace !== '-') {
      const parts = p.actual_log.actual_avg_pace.split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        paceSecondsSum += (parts[0] * 60) + parts[1];
        paceCount++;
      }
    }
  });

  const avgPace = paceCount > 0 
    ? (() => {
        const sec = Math.round(paceSecondsSum / paceCount);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      })()
    : '05:30';

  const plannedRunsCount = plans.filter(p => p.type_run !== 'Rest Day').length;
  const complianceRate = plannedRunsCount > 0 
    ? Math.min(100, Math.round((completedRuns.length / plannedRunsCount) * 100))
    : 100;

  // Heatmap generation (Last 16 weeks / ~112 days)
  const today = new Date();
  const heatmapDaysCount = 112; // 16 weeks
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - heatmapDaysCount);

  // Map plans by date string
  const planMapByDate = new Map<string, Plan>();
  plans.forEach(p => planMapByDate.set(p.date, p));

  const heatmapCells = [];
  for (let i = 0; i <= heatmapDaysCount; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const plan = planMapByDate.get(dateStr);
    const dist = plan?.actual_log?.is_run ? plan.actual_log.actual_distance : 0;
    heatmapCells.push({
      date: dateStr,
      dayOfWeek: d.getDay(),
      distance: dist,
      plan
    });
  }

  // Determine heatmap cell color intensity (cyan scale in Sleek Interface)
  const getHeatmapColor = (dist: number) => {
    if (dist <= 0) return 'bg-slate-800/80';
    if (dist < 4) return 'bg-cyan-950 border border-cyan-800/50';
    if (dist < 8) return 'bg-cyan-800';
    if (dist < 12) return 'bg-cyan-600';
    return 'bg-cyan-400 ring-1 ring-cyan-300 shadow-sm shadow-cyan-500/30';
  };

  const getShoeName = (shoeId?: string) => {
    if (!shoeId) return '-';
    const shoe = gears.find(g => g.id === shoeId);
    return shoe ? shoe.name : '-';
  };

  return (
    <div id="summary-page-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight uppercase">
            Ringkasan & Analitik Lari
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Command Center evaluasi performa, konsistensi aktivitas (Heatmap), dan rekapitulasi data
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">
            Total Sesi: <strong className="text-white">{plans.length}</strong>
          </span>
        </div>
      </div>

      {/* Top 4 Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Mileage</span>
            <span className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Footprints className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight mt-3">
            {totalActualDistance.toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Dari target {totalPlannedDistance.toFixed(1)} km
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Rata-rata Pace</span>
            <span className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight mt-3">
            {avgPace} <span className="text-xs font-normal text-slate-400">min/km</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Akumulasi seluruh sesi lari
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Hari Aktif Lari</span>
            <span className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight mt-3">
            {completedRuns.length} <span className="text-xs font-normal text-slate-400">sesi</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Log aktual terverifikasi
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Compliance Rate</span>
            <span className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-emerald-400 tracking-tight mt-3">
            {complianceRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Tingkat kepatuhan jadwal
          </div>
        </div>
      </div>

      {/* Activity Heatmap Chart */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <Flame className="w-4 h-4 text-cyan-400" />
              <span>Activity Heatmap (16 Minggu Terakhir)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Intensitas warna merepresentasikan akumulasi jarak tempuh harian (km)
            </p>
          </div>

          {/* Heatmap color scale legend */}
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono">
            <span>0km</span>
            <div className="w-3 h-3 rounded-xs bg-slate-800/80" />
            <div className="w-3 h-3 rounded-xs bg-cyan-950 border border-cyan-800/50" />
            <div className="w-3 h-3 rounded-xs bg-cyan-800" />
            <div className="w-3 h-3 rounded-xs bg-cyan-600" />
            <div className="w-3 h-3 rounded-xs bg-cyan-400" />
            <span>12km+</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[650px]">
            {heatmapCells.map((cell, idx) => (
              <div
                key={idx}
                title={`${cell.date}: ${cell.distance > 0 ? `${cell.distance} km (${cell.plan?.type_run})` : 'Tidak lari'}`}
                className={`w-3.5 h-3.5 rounded-xs transition-transform hover:scale-125 cursor-pointer ${getHeatmapColor(cell.distance)}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Review Table */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Rekapitulasi Evaluasi Target vs Aktual
              </h2>
              <p className="text-xs text-slate-500">
                Tabel riwayat perbandingan performa lari
              </p>
            </div>
          </div>
        </div>

        {/* Table responsive */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-mono uppercase text-[10px]">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Tipe Lari</th>
                <th className="py-3 px-3">Target Jarak</th>
                <th className="py-3 px-3">Aktual Jarak</th>
                <th className="py-3 px-3">Pace (Aktual)</th>
                <th className="py-3 px-3">Heart Rate</th>
                <th className="py-3 px-3">Sepatu Lari</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Belum ada data riwayat lari.
                  </td>
                </tr>
              ) : (
                plans.map((p) => {
                  const isRun = p.actual_log?.is_run;
                  const isRest = p.type_run === 'Rest Day';
                  const shoe = getShoeName(p.actual_log?.shoe_id);

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isRest ? 'text-slate-500 italic bg-slate-900/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-200 font-medium">
                        {p.date}
                      </td>
                      <td className="py-3 px-3 font-sans font-semibold text-white">
                        {p.type_run}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {isRest ? '-' : `${p.target_distance} km`}
                      </td>
                      <td className="py-3 px-3 font-bold text-cyan-400">
                        {isRun ? `${p.actual_log?.actual_distance} km` : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {isRun ? (p.actual_log?.actual_avg_pace || '-') : (p.target_avg_pace || '-')}
                      </td>
                      <td className="py-3 px-3 text-rose-400 font-medium">
                        {p.actual_log?.avg_heart_rate ? `${p.actual_log.avg_heart_rate} bpm` : '-'}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-400 max-w-[140px] truncate">
                        {shoe}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        {isRun ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Done</span>
                          </span>
                        ) : isRest ? (
                          <span className="text-[10px] text-slate-500">Rest</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
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
