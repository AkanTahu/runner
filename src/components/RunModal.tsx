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
  FileText
} from 'lucide-react';
import { Plan, ActualLog, RunType, Gear } from '../types';
import { createPlan, updatePlan } from '../lib/planService';
import { useAuth } from '../lib/authContext';
import { PacePicker, DurationPicker } from './PaceDurationPicker';

interface RunModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  gears: Gear[];
  existingPlan?: Plan | null;
  initialMode?: 'quick_log' | 'plan' | 'actual';
  defaultDate?: string;
  defaultTime?: string;
  defaultSessionLabel?: string;
}

const RUN_TYPES: RunType[] = ['Recovery', 'Easy', 'Tempo', 'Interval', 'Long Run', 'Rest Day'];

export const RunModal: React.FC<RunModalProps> = ({
  isOpen,
  onClose,
  uid,
  gears,
  existingPlan,
  initialMode = 'quick_log',
  defaultDate,
  defaultTime,
  defaultSessionLabel
}) => {
  const { t, language } = useAuth();
  const [activeTab, setActiveTab] = useState<'quick_log' | 'plan' | 'actual'>(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common fields
  const [date, setDate] = useState<string>(defaultDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(defaultTime || '06:00');
  const [sessionLabel, setSessionLabel] = useState<string>(defaultSessionLabel || '');
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
      setSessionLabel(existingPlan.session_label || '');
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
        setIsRun(true);
        setActualDistance(existingPlan.target_distance > 0 ? existingPlan.target_distance.toString() : '5.0');
        setActualPace(existingPlan.target_avg_pace !== '-' ? existingPlan.target_avg_pace : '05:30');
        setActiveTab('actual');
      } else {
        setActiveTab('plan');
      }
    } else {
      // Reset form
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setTime(defaultTime || '06:00');
      setSessionLabel(defaultSessionLabel || '');
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
  }, [existingPlan, isOpen, initialMode, defaultDate, defaultTime, defaultSessionLabel]);

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

        const trimmedLabel = sessionLabel ? sessionLabel.trim() : undefined;

        if (existingPlan?.id) {
          await updatePlan(existingPlan.id, {
            date,
            time,
            session_label: trimmedLabel,
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
            session_label: trimmedLabel,
            type_run: typeRun,
            target_distance: parsedActualDistance,
            target_avg_pace: actualPace,
            target_location: location,
            description: notes,
            actual_log
          });
        }
      } else if (activeTab === 'plan') {
        const trimmedLabel = sessionLabel ? sessionLabel.trim() : undefined;
        if (existingPlan?.id) {
          await updatePlan(existingPlan.id, {
            date,
            time,
            session_label: trimmedLabel,
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
            session_label: trimmedLabel,
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
        const parsedActualDistance = isRun ? (parseFloat(actualDistance) || 0) : 0;
        const trimmedLabel = sessionLabel ? sessionLabel.trim() : undefined;
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
            date,
            time,
            session_label: trimmedLabel,
            actual_log
          }, existingPlan);
        } else {
          await createPlan(uid, {
            date,
            time,
            session_label: trimmedLabel,
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
      setError(err.message || 'Failed to save run record');
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
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {existingPlan 
                  ? (activeTab === 'actual' ? (language === 'id' ? 'Log Hasil Lari (Aktual)' : 'Log Completed Run (Actual)') : (language === 'id' ? 'Edit Jadwal Lari' : 'Edit Running Plan'))
                  : (language === 'id' ? 'Catat Aktivitas Lari' : 'Record Running Activity')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'id' ? 'Tersimpan otomatis ke database' : 'Automatically saved to database'}
              </p>
            </div>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        {!existingPlan && (
          <div className="grid grid-cols-2 p-1.5 mx-6 mt-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/50">
            <button
              type="button"
              id="tab-quick-log"
              onClick={() => setActiveTab('quick_log')}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'quick_log'
                  ? 'bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {language === 'id' ? 'Input Hasil Lari (Selesai)' : 'Log Completed Run'}
            </button>
            <button
              type="button"
              id="tab-plan"
              onClick={() => setActiveTab('plan')}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'plan'
                  ? 'bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {language === 'id' ? 'Buat Jadwal (Plan)' : 'Create Plan'}
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'id' ? 'Tanggal Lari' : 'Run Date'}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                <input
                  type="date"
                  id="run-input-date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'id' ? 'Waktu Mulai' : 'Start Time'}
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                <input
                  type="time"
                  id="run-input-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Session Label & Multi-session helper */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('session_label_input')}
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {language === 'id' ? 'Multi-sesi harian' : 'Multi-session daily'}
              </span>
            </div>

            {/* Quick chips to fill session name & suggested time */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: t('morning_preset'), name: language === 'id' ? 'Sesi Pagi' : 'Morning Session', presetTime: '06:00' },
                { label: t('afternoon_preset'), name: language === 'id' ? 'Sesi Siang' : 'Afternoon Session', presetTime: '12:00' },
                { label: t('evening_preset'), name: language === 'id' ? 'Sesi Sore' : 'Evening Session', presetTime: '16:30' },
                { label: t('night_preset'), name: language === 'id' ? 'Sesi Malam' : 'Night Session', presetTime: '19:30' },
                { label: t('session_preset_1'), name: language === 'id' ? 'Sesi 1' : 'Session 1', presetTime: '06:00' },
                { label: t('session_preset_2'), name: language === 'id' ? 'Sesi 2' : 'Session 2', presetTime: '17:00' },
              ].map(preset => {
                const isSelected = sessionLabel === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSessionLabel('');
                      } else {
                        setSessionLabel(preset.name);
                        setTime(preset.presetTime);
                      }
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-500 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              id="run-input-session-label"
              value={sessionLabel}
              onChange={(e) => setSessionLabel(e.target.value)}
              placeholder={t('session_label_hint')}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Run Type selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'id' ? 'Tipe Lari (Run Type)' : 'Run Type'}
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
                    className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      selected
                        ? (isRest 
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-400 dark:border-slate-600 font-bold' 
                            : 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20')
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
            {isRestDay && (
              <p className="text-xs text-slate-500 mt-1 italic">
                {language === 'id' 
                  ? '* Rest Day akan otomatis diformat untuk istirahat & pemulihan otot.' 
                  : '* Rest Day is automatically formatted for muscle rest & recovery.'}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'id' ? 'Lokasi Lari' : 'Run Location'}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                id="run-input-location"
                placeholder={language === 'id' ? 'Contoh: Gelora Bung Karno, Sudirman Loop, Ragunan' : 'E.g., Central Park Loop, Track Stadium'}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
              />
            </div>
          </div>

          {/* PLAN SPECIFIC FIELDS */}
          {activeTab === 'plan' && (
            <>
              {!isRestDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'id' ? 'Target Jarak (Km)' : 'Target Distance (Km)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      id="plan-target-distance"
                      required
                      value={targetDistance}
                      onChange={(e) => setTargetDistance(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    />
                  </div>
                  <div>
                    <PacePicker
                      id="plan-target-pace"
                      label={language === 'id' ? 'Target Avg Pace' : 'Target Avg Pace'}
                      value={targetPace}
                      onChange={(newPace) => setTargetPace(newPace)}
                      language={language}
                      align="right"
                    />
                  </div>
                </div>
              )}

              {/* Strategy Details for Tempo / Interval / Long Run */}
              {showStrategyFields && (
                <div className="p-4 bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 font-semibold text-xs">
                    <Zap className="w-4 h-4" />
                    <span>{language === 'id' ? `Fitur Strategi Lari (${typeRun})` : `Strategy Details (${typeRun})`}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Warm Up
                    </label>
                    <input
                      type="text"
                      id="strategy-warmup"
                      placeholder={language === 'id' ? 'Contoh: 1.5 km jog santai + drills' : 'E.g., 1.5 km easy jog + dynamic drills'}
                      value={warmUp}
                      onChange={(e) => setWarmUp(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Speed Session / Main Set
                    </label>
                    <input
                      type="text"
                      id="strategy-speedsession"
                      placeholder={language === 'id' ? 'Contoh: 5 x 800m di pace 04:45' : 'E.g., 5 x 800m at 04:45 pace'}
                      value={speedSession}
                      onChange={(e) => setSpeedSession(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Cooldown
                    </label>
                    <input
                      type="text"
                      id="strategy-cooldown"
                      placeholder={language === 'id' ? 'Contoh: 1 km jalan santai + peregangan' : 'E.g., 1 km easy jog + static stretch'}
                      value={cooldown}
                      onChange={(e) => setCooldown(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'id' ? 'Catatan / Rencana Latihan' : 'Plan Notes & Instructions'}
                </label>
                <textarea
                  rows={2}
                  id="plan-description"
                  placeholder={language === 'id' ? 'Instruksi rute, target hidrasi, atau fokus form lari...' : 'Route instructions, hydration, cadence focus...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>
            </>
          )}

          {/* ACTUAL RUN SPECIFIC FIELDS */}
          {(activeTab === 'quick_log' || activeTab === 'actual') && (
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              {/* Checkbox isRun */}
              <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
                <input
                  type="checkbox"
                  id="actual-isrun-checkbox"
                  checked={isRun}
                  onChange={(e) => setIsRun(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="actual-isrun-checkbox" className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer">
                  {language === 'id' ? 'Lari Selesai' : 'Run Completed'}
                </label>
              </div>

              {isRun && (
                <>
                  {/* Distance & Duration Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'id' ? 'Jarak Aktual (Km) *' : 'Actual Distance (Km) *'}
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
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      />
                    </div>
                    <div>
                      <DurationPicker
                        id="run-input-duration"
                        label={language === 'id' ? 'Durasi (hh:mm:ss) *' : 'Duration (hh:mm:ss) *'}
                        value={actualDuration}
                        onChange={(newDuration) => {
                          setActualDuration(newDuration);
                          calculatePaceFromDuration(parseFloat(actualDistance), newDuration);
                        }}
                        language={language}
                      />
                    </div>
                  </div>

                  {/* Pace & Heart Rate Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <PacePicker
                        id="actual-pace-input"
                        label={language === 'id' ? 'Pace Rata-rata' : 'Avg Pace'}
                        value={actualPace}
                        onChange={(newPace) => setActualPace(newPace)}
                        language={language}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'id' ? 'Detak Jantung (Avg bpm)' : 'Heart Rate (Avg bpm)'}
                      </label>
                      <div className="relative">
                        <Heart className="w-4 h-4 text-rose-500 absolute left-3 top-3" />
                        <input
                          type="number"
                          id="actual-hr-input"
                          placeholder="145"
                          value={avgHeartRate}
                          onChange={(e) => setAvgHeartRate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shoe Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>{language === 'id' ? 'Pilih Sepatu Lari' : 'Select Running Shoes'}</span>
                      <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-normal">
                        {language === 'id' ? 'Otomatis mengakumulasi km' : 'Auto accumulates mileage'}
                      </span>
                    </label>
                    <select
                      id="actual-shoe-select"
                      value={selectedShoeId}
                      onChange={(e) => setSelectedShoeId(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer"
                    >
                      <option value="">{language === 'id' ? '-- Tanpa Spesifik Sepatu --' : '-- No specific shoe --'}</option>
                      {shoes.map((shoe) => (
                        <option key={shoe.id} value={shoe.id}>
                          👟 {shoe.name} ({shoe.total_distance.toFixed(1)} km / {shoe.max_distance || 700} km)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'id' ? 'Catatan & Evaluasi Lari' : 'Run Notes & Reflection'}
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                      <textarea
                        rows={2}
                        id="run-input-notes"
                        placeholder={language === 'id' ? 'Bagaimana kondisi fisik, detak jantung, atau cuaca hari ini?' : 'How did you feel? Weather, fatigue, energy level...'}
                        value={actualNotes}
                        onChange={(e) => setActualNotes(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              id="cancel-modal-btn"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              id="submit-run-btn"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span>{t('saving')}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {activeTab === 'plan' ? (language === 'id' ? 'Simpan Jadwal Plan' : 'Save Plan') : (language === 'id' ? 'Simpan Data Lari' : 'Save Run Log')}
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

