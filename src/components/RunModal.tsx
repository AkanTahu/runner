import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Activity, 
  Zap, 
  Heart, 
  CheckCircle2, 
  Footprints, 
  FileText,
  Flame
} from 'lucide-react';
import { Plan, ActualLog, RunType, Gear } from '../types';
import { createPlan, updatePlan } from '../lib/planService';

interface RunModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  gears: Gear[];
  existingPlan?: Plan | null;
  initialMode?: 'quick_log' | 'plan' | 'actual';
}

const RUN_TYPES: RunType[] = ['Recovery', 'Easy', 'Tempo', 'Interval', 'Long Run', 'Rest Day'];

export const RunModal: React.FC<RunModalProps> = ({
  isOpen,
  onClose,
  uid,
  gears,
  existingPlan,
  initialMode = 'quick_log'
}) => {
  const [activeTab, setActiveTab] = useState<'quick_log' | 'plan' | 'actual'>(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common fields
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('06:00');
  const [typeRun, setTypeRun] = useState<RunType>('Easy');
  const [location, setLocation] = useState<string>('Gelora Bung Karno');
  const [notes, setNotes] = useState<string>('');

  // Plan fields
  const [targetDistance, setTargetDistance] = useState<string>('5.0');
  const [targetPace, setTargetPace] = useState<string>('05:30');
  const [warmUp, setWarmUp] = useState<string>('');
  const [speedSession, setSpeedSession] = useState<string>('');
  const [cooldown, setCooldown] = useState<string>('');

  // Actual run fields
  const [isRun, setIsRun] = useState<boolean>(true);
  const [actualDistance, setActualDistance] = useState<string>('5.0');
  const [actualDuration, setActualDuration] = useState<string>('00:27:30');
  const [actualPace, setActualPace] = useState<string>('05:30');
  const [avgHeartRate, setAvgHeartRate] = useState<string>('145');
  const [selectedShoeId, setSelectedShoeId] = useState<string>('');
  const [actualNotes, setActualNotes] = useState<string>('');

  // Shoes list filtered for category "Sepatu"
  const shoes = gears.filter(g => g.category === 'Sepatu' && g.is_active);

  useEffect(() => {
    if (shoes.length > 0 && !selectedShoeId) {
      setSelectedShoeId(shoes[0].id || '');
    }
  }, [shoes, selectedShoeId]);

  // Populate when editing existingPlan
  useEffect(() => {
    if (existingPlan) {
      setDate(existingPlan.date);
      setTime(existingPlan.time || '06:00');
      setTypeRun(existingPlan.type_run);
      setLocation(existingPlan.target_location || '');
      setTargetDistance(existingPlan.target_distance.toString());
      setTargetPace(existingPlan.target_avg_pace || '05:30');
      setNotes(existingPlan.description || '');

      if (existingPlan.strategy_details) {
        setWarmUp(existingPlan.strategy_details.warm_up || '');
        setSpeedSession(existingPlan.strategy_details.speed_session || '');
        setCooldown(existingPlan.strategy_details.cooldown || '');
      }

      if (existingPlan.actual_log) {
        setIsRun(existingPlan.actual_log.is_run);
        setActualDistance(existingPlan.actual_log.actual_distance.toString());
        setActualDuration(existingPlan.actual_log.actual_duration || '');
        setActualPace(existingPlan.actual_log.actual_avg_pace);
        setAvgHeartRate(existingPlan.actual_log.avg_heart_rate?.toString() || '');
        setSelectedShoeId(existingPlan.actual_log.shoe_id || (shoes[0]?.id || ''));
        setActualNotes(existingPlan.actual_log.actual_description || '');
        setActiveTab('actual');
      } else if (initialMode === 'actual') {
        // Pre-fill actual distance & pace from plan target
        setIsRun(true);
        setActualDistance(existingPlan.target_distance > 0 ? existingPlan.target_distance.toString() : '5.0');
        setActualPace(existingPlan.target_avg_pace !== '-' ? existingPlan.target_avg_pace : '05:30');
        setActiveTab('actual');
      } else {
        setActiveTab('plan');
      }
    } else {
      // Reset form
      setDate(new Date().toISOString().split('T')[0]);
      setTime('06:00');
      setTypeRun('Easy');
      setLocation('Gelora Bung Karno Outer Ring');
      setTargetDistance('5.0');
      setTargetPace('05:30');
      setActualDistance('5.0');
      setActualDuration('00:27:30');
      setActualPace('05:30');
      setAvgHeartRate('145');
      setNotes('');
      setActualNotes('');
      setWarmUp('');
      setSpeedSession('');
      setCooldown('');
      setIsRun(true);
      setActiveTab(initialMode);
    }
  }, [existingPlan, isOpen, initialMode]);

  // Auto calculate pace helper
  const calculatePaceFromDuration = (distKm: number, durationStr: string) => {
    if (!distKm || distKm <= 0 || !durationStr) return;
    const parts = durationStr.split(':').map(Number);
    let totalSeconds = 0;
    if (parts.length === 3) {
      totalSeconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    } else if (parts.length === 2) {
      totalSeconds = (parts[0] * 60) + parts[1];
    } else {
      return;
    }
    const secPerKm = Math.round(totalSeconds / distKm);
    const paceMin = Math.floor(secPerKm / 60);
    const paceSec = secPerKm % 60;
    const formatted = `${String(paceMin).padStart(2, '0')}:${String(paceSec).padStart(2, '0')}`;
    setActualPace(formatted);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const showStrategy = ['Tempo', 'Interval', 'Long Run'].includes(typeRun);
      const strategy_details = showStrategy ? {
        warm_up: warmUp,
        speed_session: speedSession,
        cooldown: cooldown
      } : undefined;

      // Rest Day handling
      const isRestDay = typeRun === 'Rest Day';
      const parsedTargetDistance = isRestDay ? 0 : (parseFloat(targetDistance) || 0);
      const effectiveTargetPace = isRestDay ? '-' : targetPace;

      if (activeTab === 'quick_log') {
        // Direct run recording with date, time, distance, duration, notes, shoe
        const parsedActualDistance = parseFloat(actualDistance) || 0;
        const actual_log: ActualLog = {
          is_run: isRun,
          actual_type_run: typeRun,
          actual_distance: parsedActualDistance,
          actual_duration: actualDuration,
          actual_avg_pace: actualPace,
          avg_heart_rate: avgHeartRate ? parseInt(avgHeartRate, 10) : undefined,
          shoe_id: selectedShoeId || undefined,
          actual_location: location,
          actual_description: actualNotes || notes,
          logged_at: new Date().toISOString()
        };

        if (existingPlan?.id) {
          await updatePlan(existingPlan.id, {
            date,
            time,
            type_run: typeRun,
            target_distance: parsedActualDistance,
            target_avg_pace: actualPace,
            target_location: location,
            description: notes,
            actual_log
          }, existingPlan);
        } else {
          await createPlan(uid, {
            date,
            time,
            type_run: typeRun,
            target_distance: parsedActualDistance,
            target_avg_pace: actualPace,
            target_location: location,
            description: notes,
            actual_log
          });
        }
      } else if (activeTab === 'plan') {
        // Create or update plan
        if (existingPlan?.id) {
          await updatePlan(existingPlan.id, {
            date,
            time,
            type_run: typeRun,
            target_distance: parsedTargetDistance,
            target_avg_pace: effectiveTargetPace,
            target_location: location,
            description: notes,
            strategy_details
          }, existingPlan);
        } else {
          await createPlan(uid, {
            date,
            time,
            type_run: typeRun,
            target_distance: parsedTargetDistance,
            target_avg_pace: effectiveTargetPace,
            target_location: location,
            description: notes,
            strategy_details,
            actual_log: null
          });
        }
      } else if (activeTab === 'actual') {
        // Log actual workout to existing or new plan
        const parsedActualDistance = isRun ? (parseFloat(actualDistance) || 0) : 0;
        const actual_log: ActualLog = {
          is_run: isRun,
          actual_type_run: typeRun,
          actual_distance: parsedActualDistance,
          actual_duration: actualDuration,
          actual_avg_pace: actualPace,
          avg_heart_rate: avgHeartRate ? parseInt(avgHeartRate, 10) : undefined,
          shoe_id: selectedShoeId || undefined,
          actual_location: location,
          actual_description: actualNotes,
          logged_at: new Date().toISOString()
        };

        if (existingPlan?.id) {
          await updatePlan(existingPlan.id, {
            actual_log
          }, existingPlan);
        } else {
          await createPlan(uid, {
            date,
            time,
            type_run: typeRun,
            target_distance: parsedActualDistance,
            target_avg_pace: actualPace,
            target_location: location,
            description: notes,
            actual_log
          });
        }
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving run activity:', err);
      setError(err.message || 'Failed to save run record to Firestore');
    } finally {
      setSubmitting(false);
    }
  };

  const isRestDay = typeRun === 'Rest Day';
  const showStrategyFields = ['Tempo', 'Interval', 'Long Run'].includes(typeRun) && activeTab === 'plan';

  return (
    <div 
      id="run-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="run-modal-container"
        className="relative w-full max-w-xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {existingPlan 
                  ? (activeTab === 'actual' ? 'Log Hasil Lari (Actual)' : 'Edit Jadwal Lari')
                  : 'Catat Aktivitas Lari'}
              </h2>
              <p className="text-xs text-slate-400">
                Data tersimpan otomatis ke database Firestore
              </p>
            </div>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        {!existingPlan && (
          <div className="grid grid-cols-2 p-1.5 mx-6 mt-4 bg-slate-800/80 rounded-2xl border border-slate-700/50">
            <button
              type="button"
              id="tab-quick-log"
              onClick={() => setActiveTab('quick_log')}
              className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'quick_log'
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Input Hasil Lari (Selesai)
            </button>
            <button
              type="button"
              id="tab-plan"
              onClick={() => setActiveTab('plan')}
              className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'plan'
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Buat Jadwal (Plan)
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tanggal Lari
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="date"
                  id="run-input-date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Waktu Mulai
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="time"
                  id="run-input-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Run Type selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tipe Lari (Type Run)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {RUN_TYPES.map((type) => {
                const selected = typeRun === type;
                const isRest = type === 'Rest Day';
                return (
                  <button
                    key={type}
                    type="button"
                    id={`select-run-type-${type.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setTypeRun(type)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all border ${
                      selected
                        ? (isRest 
                            ? 'bg-slate-700 text-slate-200 border-slate-600 font-bold' 
                            : 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20')
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
            {isRestDay && (
              <p className="text-xs text-slate-500 mt-1 italic">
                * Rest Day akan otomatis di-styling abu-abu pudar untuk istirahat & pemulihan otot.
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Lokasi Lari
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                id="run-input-location"
                placeholder="Contoh: Gelora Bung Karno, Sudirman Loop, Ragunan"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
              />
            </div>
          </div>

          {/* PLAN SPECIFIC FIELDS */}
          {activeTab === 'plan' && (
            <>
              {!isRestDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target Jarak (Km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      id="plan-target-distance"
                      required
                      value={targetDistance}
                      onChange={(e) => setTargetDistance(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target Avg Pace (min/km)
                    </label>
                    <input
                      type="text"
                      id="plan-target-pace"
                      placeholder="05:30"
                      value={targetPace}
                      onChange={(e) => setTargetPace(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Strategy Details for Tempo / Interval / Long Run */}
              {showStrategyFields && (
                <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs">
                    <Zap className="w-4 h-4" />
                    <span>Fitur Strategi Lari ({typeRun})</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Warm Up
                    </label>
                    <input
                      type="text"
                      id="strategy-warmup"
                      placeholder="Contoh: 1.5 km jog santai + ABC dynamic drills"
                      value={warmUp}
                      onChange={(e) => setWarmUp(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Speed Session / Pacing Main Set
                    </label>
                    <input
                      type="text"
                      id="strategy-speedsession"
                      placeholder="Contoh: 5 x 800m di pace 04:45 dengan 90s jog recovery"
                      value={speedSession}
                      onChange={(e) => setSpeedSession(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Cooldown
                    </label>
                    <input
                      type="text"
                      id="strategy-cooldown"
                      placeholder="Contoh: 1 km jalan santai + peregangan hamstring & betis"
                      value={cooldown}
                      onChange={(e) => setCooldown(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan / Rencana Latihan
                </label>
                <textarea
                  rows={2}
                  id="plan-description"
                  placeholder="Instruksi rute, target hidrasi, atau fokus form lari..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>
            </>
          )}

          {/* ACTUAL RUN SPECIFIC FIELDS */}
          {(activeTab === 'quick_log' || activeTab === 'actual') && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {/* Checkbox isRun */}
              <div className="flex items-center space-x-2 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                <input
                  type="checkbox"
                  id="actual-isrun-checkbox"
                  checked={isRun}
                  onChange={(e) => setIsRun(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <label htmlFor="actual-isrun-checkbox" className="text-xs font-semibold text-emerald-400 cursor-pointer">
                  Aktivitas berhasil dilaksanakan (isRun: True)
                </label>
              </div>

              {isRun && (
                <>
                  {/* Distance & Duration Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Jarak Aktual (Km) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="run-input-distance"
                        required
                        value={actualDistance}
                        onChange={(e) => {
                          setActualDistance(e.target.value);
                          calculatePaceFromDuration(parseFloat(e.target.value), actualDuration);
                        }}
                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Durasi (hh:mm:ss) *
                      </label>
                      <input
                        type="text"
                        id="run-input-duration"
                        placeholder="00:45:00"
                        required
                        value={actualDuration}
                        onChange={(e) => {
                          setActualDuration(e.target.value);
                          calculatePaceFromDuration(parseFloat(actualDistance), e.target.value);
                        }}
                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Pace & Heart Rate Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Pace Rata-rata (min/km)
                      </label>
                      <div className="relative">
                        <Activity className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          id="actual-pace-input"
                          placeholder="05:20"
                          value={actualPace}
                          onChange={(e) => setActualPace(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Detak Jantung (Avg bpm)
                      </label>
                      <div className="relative">
                        <Heart className="w-4 h-4 text-rose-500 absolute left-3 top-3" />
                        <input
                          type="number"
                          id="actual-hr-input"
                          placeholder="145"
                          value={avgHeartRate}
                          onChange={(e) => setAvgHeartRate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shoe Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Pilih Sepatu Lari (Shoe Mileage Tracking)</span>
                      <span className="text-[11px] text-cyan-400 font-normal">
                        Otomatis mengakumulasi km
                      </span>
                    </label>
                    <select
                      id="actual-shoe-select"
                      value={selectedShoeId}
                      onChange={(e) => setSelectedShoeId(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    >
                      <option value="">-- Tanpa Spesifik Sepatu --</option>
                      {shoes.map((shoe) => (
                        <option key={shoe.id} value={shoe.id}>
                          👟 {shoe.name} ({shoe.total_distance.toFixed(1)} km / {shoe.max_distance || 700} km)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Catatan & Evaluasi Lari (Notes)
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <textarea
                        rows={2}
                        id="run-input-notes"
                        placeholder="Bagaimana kondisi fisik, detak jantung, kelelahan kaki, atau cuaca hari ini?"
                        value={actualNotes}
                        onChange={(e) => setActualNotes(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              id="cancel-modal-btn"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              id="submit-run-btn"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Menyimpan ke Firestore...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {activeTab === 'plan' ? 'Simpan Jadwal Plan' : 'Simpan Data Lari'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
