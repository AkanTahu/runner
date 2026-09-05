import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Sparkles, 
  Trophy, 
  User as UserIcon,
  Play,
  Save,
  Check
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { ThemeMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReopenSplash: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onReopenSplash
}) => {
  const { userProfile, updateUserSettings, theme, setTheme } = useAuth();

  const [quote, setQuote] = useState<string>(
    userProfile?.settings.motivation_quote || 
    "It never gets easier, you just go faster. Every mile is a step towards greatness."
  );
  const [runnerName, setRunnerName] = useState<string>(
    userProfile?.settings.runner_name || 'Banker & SI Student Runner'
  );
  const [weeklyTarget, setWeeklyTarget] = useState<string>(
    (userProfile?.settings.weekly_target_km || 30).toString()
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateUserSettings({
        motivation_quote: quote,
        runner_name: runnerName,
        weekly_target_km: parseFloat(weeklyTarget) || 30,
        theme_preference: theme
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Gagal menyimpan preferensi ke Firestore.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Pengaturan Aplikasi (Settings)
              </h2>
              <p className="text-xs text-slate-400">
                Personalisasi motivasi, tema, dan target lari mingguan
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          {/* Motivation Quote for Splash Screen */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quotes Motivasi Lari (Splash Screen Slide 1)</span>
            </label>
            <textarea
              rows={3}
              id="settings-quote-input"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Masukkan kata-kata penyemangat favoritmu..."
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              * Kalimat ini akan tampil dengan tipografi ekspresif pada greeting screen.
            </p>
          </div>

          {/* Runner Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nama / Panggilan Pelari</span>
            </label>
            <input
              type="text"
              id="settings-runner-name"
              value={runnerName}
              onChange={(e) => setRunnerName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Weekly Target Mileage */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <Trophy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Mileage Mingguan (Km)</span>
            </label>
            <input
              type="number"
              min="5"
              step="1"
              id="settings-weekly-target"
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Basis kalkulasi persentase pada Donut Chart Dashboard.
            </p>
          </div>

          {/* Theme Mode Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Pilihan Mode Tema
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition-all ${
                  theme === 'dark'
                    ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/40 text-white'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Dark Sleek</div>
                  <div className="text-[10px] text-slate-500">Slate & Cyan Interface</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition-all ${
                  theme === 'light'
                    ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/40 text-white'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Light Mode</div>
                  <div className="text-[10px] text-slate-500">Tema Terang</div>
                </div>
              </button>
            </div>
          </div>

          {/* Replay Splash Greeting */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Putar ulang Greeting Slideshow:
            </span>
            <button
              type="button"
              id="replay-splash-btn"
              onClick={() => {
                onClose();
                onReopenSplash();
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center space-x-1.5 transition-colors"
            >
              <Play className="w-3 h-3 text-cyan-400" />
              <span>Buka Splash Screen</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={saving}
              id="save-settings-btn"
              className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center space-x-1.5 disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersimpan!</span>
                </>
              ) : saving ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Pengaturan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
