import React, { useState, useRef, useEffect } from 'react';
import { Clock, Activity, Zap, X, ChevronDown } from 'lucide-react';

// ==========================================
// PACE PICKER COMPONENT
// ==========================================
interface PacePickerProps {
  id: string;
  value: string; // e.g. "05:30"
  onChange: (pace: string) => void;
  label: string;
  language: 'id' | 'en';
  disabled?: boolean;
  align?: 'left' | 'right';
}

const COMMON_PACE_PRESETS = [
  '04:00',
  '04:30',
  '05:00',
  '05:15',
  '05:30',
  '05:45',
  '06:00',
  '06:30',
  '07:00'
];

export const PacePicker: React.FC<PacePickerProps> = ({
  id,
  value,
  onChange,
  label,
  language,
  disabled = false,
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [localInput, setLocalInput] = useState<string>(value || '05:30');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocalInput(value || '05:30');
  }, [value]);

  // Normalize pace to numbers
  const parsePace = (val: string) => {
    if (!val || val === '-') return { min: 5, sec: 30 };
    const parts = val.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { min: Math.max(2, Math.min(20, parts[0])), sec: Math.max(0, Math.min(59, parts[1])) };
    }
    return { min: 5, sec: 30 };
  };

  const { min, sec } = parsePace(value);

  const handleMouseEnter = () => {
    if (disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 280); // Debounce to allow cursor movement into popover
  };

  const handlePresetClick = (preset: string) => {
    onChange(preset);
    setLocalInput(preset);
  };

  const handleAdjustSeconds = (delta: number) => {
    let totalSec = min * 60 + sec + delta;
    if (totalSec < 120) totalSec = 120; // min 2:00
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    onChange(formatted);
    setLocalInput(formatted);
  };

  const handleMinChange = (newMin: number) => {
    const formatted = `${String(newMin).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    onChange(formatted);
    setLocalInput(formatted);
  };

  const handleSecChange = (newSec: number) => {
    const formatted = `${String(min).padStart(2, '0')}:${String(newSec).padStart(2, '0')}`;
    onChange(formatted);
    setLocalInput(formatted);
  };

  // Custom text typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalInput(val);
    onChange(val);
  };

  const handleInputBlur = () => {
    // Format if user typed e.g. "5:30" or "530" or "5"
    let clean = localInput.trim();
    if (!clean) {
      clean = '05:30';
    } else if (clean.includes(':')) {
      const parts = clean.split(':');
      const m = parseInt(parts[0], 10) || 5;
      const s = parseInt(parts[1], 10) || 0;
      clean = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    } else if (/^\d+$/.test(clean)) {
      if (clean.length <= 2) {
        clean = `${clean.padStart(2, '0')}:00`;
      } else if (clean.length === 3) {
        clean = `0${clean[0]}:${clean.slice(1)}`;
      } else {
        clean = `${clean.slice(0, 2)}:${clean.slice(2, 4)}`;
      }
    }
    setLocalInput(clean);
    onChange(clean);
  };

  return (
    <div
      ref={containerRef}
      className="relative space-y-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-medium flex items-center space-x-0.5 cursor-pointer"
          title="Toggle Presets"
        >
          <Zap className="w-3 h-3 text-cyan-500" />
          <span>{language === 'id' ? 'Preset' : 'Quick'}</span>
        </button>
      </div>

      {/* Main Input: Clean text input, NEVER has AM/PM */}
      <div className="relative">
        <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400 absolute left-3 top-2.5 pointer-events-none" />
        <input
          type="text"
          inputMode="numeric"
          id={id}
          disabled={disabled}
          placeholder="05:30"
          value={localInput}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 pr-14 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-xs disabled:opacity-50"
        />
        <div className="absolute right-3 top-2 pointer-events-none text-xs text-slate-400 font-mono">
          /km
        </div>
      </div>

      {/* Floating Hover Popover ABOVE the input */}
      {isOpen && (
        <div
          id={`${id}-floating-popover`}
          className={`absolute bottom-full mb-2 ${
            align === 'right' ? 'right-0' : 'left-0'
          } w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-xl z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Zap className="w-3.5 h-3.5 text-cyan-500 fill-cyan-500" />
              <span>{language === 'id' ? 'Pilih Cepat Pace' : 'Quick Pace Presets'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preset Buttons Grid */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-mono text-slate-400">
              {language === 'id' ? 'Klik Preset (min/km):' : 'Click Preset (min/km):'}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {COMMON_PACE_PRESETS.map((p) => {
                const isSelected = value === p || localInput === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePresetClick(p)}
                    className={`py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-700 dark:hover:text-cyan-400'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* Quick Adjust Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {language === 'id' ? 'Atur Detik:' : 'Adjust Sec:'}
              </span>
              <div className="flex items-center space-x-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleAdjustSeconds(-15)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-bold text-[11px]"
                >
                  -15s
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustSeconds(-5)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-bold text-[11px]"
                >
                  -5s
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustSeconds(5)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-bold text-[11px]"
                >
                  +5s
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustSeconds(15)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-bold text-[11px]"
                >
                  +15s
                </button>
              </div>
            </div>

            {/* Direct Minute & Second Selectors */}
            <div className="pt-1.5 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="block text-[9px] uppercase font-mono text-slate-400 mb-0.5">
                  {language === 'id' ? 'Menit' : 'Minutes'}
                </span>
                <select
                  value={min}
                  onChange={(e) => handleMinChange(Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-[9px] uppercase font-mono text-slate-400 mb-0.5">
                  {language === 'id' ? 'Detik' : 'Seconds'}
                </span>
                <select
                  value={sec}
                  onChange={(e) => handleSecChange(Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((s) => (
                    <option key={s} value={s}>
                      {String(s).padStart(2, '0')} sec
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Little triangle arrow at bottom */}
          <div
            className={`absolute -bottom-1.5 ${
              align === 'right' ? 'right-6' : 'left-6'
            } w-3 h-3 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-700 rotate-45`}
          />
        </div>
      )}
    </div>
  );
};

// ==========================================
// DURATION PICKER COMPONENT
// ==========================================
interface DurationPickerProps {
  id: string;
  value: string; // e.g. "00:45:00"
  onChange: (duration: string) => void;
  label: string;
  language: 'id' | 'en';
  disabled?: boolean;
  align?: 'left' | 'right';
}

const COMMON_DURATION_PRESETS = [
  { label: '20m', value: '00:20:00' },
  { label: '30m', value: '00:30:00' },
  { label: '40m', value: '00:40:00' },
  { label: '45m', value: '00:45:00' },
  { label: '50m', value: '00:50:00' },
  { label: '1h 00m', value: '01:00:00' },
  { label: '1h 15m', value: '01:15:00' },
  { label: '1h 30m', value: '01:30:00' },
  { label: '2h 00m', value: '02:00:00' }
];

export const DurationPicker: React.FC<DurationPickerProps> = ({
  id,
  value,
  onChange,
  label,
  language,
  disabled = false,
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [localInput, setLocalInput] = useState<string>(value || '00:45:00');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocalInput(value || '00:45:00');
  }, [value]);

  // Normalize duration to numbers
  const parseDuration = (val: string) => {
    if (!val) return { hours: 0, minutes: 45, seconds: 0 };
    const parts = val.split(':').map(Number);
    if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
      return {
        hours: Math.max(0, Math.min(23, parts[0])),
        minutes: Math.max(0, Math.min(59, parts[1])),
        seconds: Math.max(0, Math.min(59, parts[2]))
      };
    } else if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
      return {
        hours: 0,
        minutes: Math.max(0, Math.min(59, parts[0])),
        seconds: Math.max(0, Math.min(59, parts[1]))
      };
    }
    return { hours: 0, minutes: 45, seconds: 0 };
  };

  const { hours, minutes, seconds } = parseDuration(value);

  const handleMouseEnter = () => {
    if (disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 280); // Debounce to allow cursor movement into popover
  };

  const handlePresetClick = (presetVal: string) => {
    onChange(presetVal);
    setLocalInput(presetVal);
  };

  const handleAdjustMinutes = (delta: number) => {
    let totalSec = hours * 3600 + minutes * 60 + seconds + delta * 60;
    if (totalSec < 0) totalSec = 0;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    onChange(formatted);
    setLocalInput(formatted);
  };

  const handleHoursChange = (newHours: number) => {
    const formatted = `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    onChange(formatted);
    setLocalInput(formatted);
  };

  const handleMinutesChange = (newMins: number) => {
    const formatted = `${String(hours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    onChange(formatted);
    setLocalInput(formatted);
  };

  const handleSecondsChange = (newSecs: number) => {
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(newSecs).padStart(2, '0')}`;
    onChange(formatted);
    setLocalInput(formatted);
  };

  // Custom text typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalInput(val);
    onChange(val);
  };

  const handleInputBlur = () => {
    // Format to HH:MM:SS
    let clean = localInput.trim();
    if (!clean) {
      clean = '00:45:00';
    } else if (clean.includes(':')) {
      const parts = clean.split(':').map((p) => parseInt(p, 10) || 0);
      if (parts.length === 2) {
        clean = `00:${String(parts[0]).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}`;
      } else if (parts.length === 3) {
        clean = `${String(parts[0]).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}:${String(parts[2]).padStart(2, '0')}`;
      }
    } else if (/^\d+$/.test(clean)) {
      const num = parseInt(clean, 10);
      if (clean.length <= 2) {
        // e.g. "45" -> 45 minutes
        clean = `00:${String(num).padStart(2, '0')}:00`;
      } else if (clean.length <= 4) {
        // e.g. "4500" -> 45:00
        clean = `00:${clean.slice(0, 2)}:${clean.slice(2, 4)}`;
      }
    }
    setLocalInput(clean);
    onChange(clean);
  };

  return (
    <div
      ref={containerRef}
      className="relative space-y-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-medium flex items-center space-x-0.5 cursor-pointer"
          title="Toggle Presets"
        >
          <Zap className="w-3 h-3 text-cyan-500" />
          <span>{language === 'id' ? 'Preset' : 'Quick'}</span>
        </button>
      </div>

      {/* Main Input: Clean text input, NEVER has AM/PM */}
      <div className="relative">
        <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400 absolute left-3 top-2.5 pointer-events-none" />
        <input
          type="text"
          inputMode="numeric"
          id={id}
          disabled={disabled}
          placeholder="00:45:00"
          value={localInput}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 pr-20 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-xs disabled:opacity-50"
        />
        <div className="absolute right-3 top-2 pointer-events-none text-xs text-slate-400 font-mono">
          hh:mm:ss
        </div>
      </div>

      {/* Floating Hover Popover ABOVE the input */}
      {isOpen && (
        <div
          id={`${id}-floating-popover`}
          className={`absolute bottom-full mb-2 ${
            align === 'right' ? 'right-0' : 'left-0'
          } w-72 sm:w-84 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-xl z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Zap className="w-3.5 h-3.5 text-cyan-500 fill-cyan-500" />
              <span>{language === 'id' ? 'Pilih Cepat Durasi' : 'Quick Duration Presets'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preset Buttons Grid */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-mono text-slate-400">
              {language === 'id' ? 'Klik Preset Durasi:' : 'Click Duration Preset:'}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {COMMON_DURATION_PRESETS.map((d) => {
                const isSelected = value === d.value || localInput === d.value;
                return (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => handlePresetClick(d.value)}
                    className={`py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-700 dark:hover:text-cyan-400'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Adjust Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {language === 'id' ? 'Atur Menit:' : 'Adjust Min:'}
              </span>
              <div className="flex items-center space-x-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleAdjustMinutes(-5)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-bold text-[11px]"
                >
                  -5m
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustMinutes(-1)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-bold text-[11px]"
                >
                  -1m
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustMinutes(1)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-bold text-[11px]"
                >
                  +1m
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustMinutes(5)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-bold text-[11px]"
                >
                  +5m
                </button>
              </div>
            </div>

            {/* Direct Hour, Minute, Second Selectors */}
            <div className="pt-1.5 grid grid-cols-3 gap-1.5 text-xs">
              <div>
                <span className="block text-[9px] uppercase font-mono text-slate-400 mb-0.5">
                  {language === 'id' ? 'Jam' : 'Hours'}
                </span>
                <select
                  value={hours}
                  onChange={(e) => handleHoursChange(Number(e.target.value))}
                  className="w-full px-1.5 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {Array.from({ length: 13 }, (_, i) => i).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')} hr
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-[9px] uppercase font-mono text-slate-400 mb-0.5">
                  {language === 'id' ? 'Menit' : 'Mins'}
                </span>
                <select
                  value={minutes}
                  onChange={(e) => handleMinutesChange(Number(e.target.value))}
                  className="w-full px-1.5 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')} m
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-[9px] uppercase font-mono text-slate-400 mb-0.5">
                  {language === 'id' ? 'Detik' : 'Secs'}
                </span>
                <select
                  value={seconds}
                  onChange={(e) => handleSecondsChange(Number(e.target.value))}
                  className="w-full px-1.5 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((s) => (
                    <option key={s} value={s}>
                      {String(s).padStart(2, '0')} s
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Little triangle arrow at bottom */}
          <div
            className={`absolute -bottom-1.5 ${
              align === 'right' ? 'right-6' : 'left-6'
            } w-3 h-3 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-700 rotate-45`}
          />
        </div>
      )}
    </div>
  );
};
