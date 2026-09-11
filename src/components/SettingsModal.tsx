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
  Check,
  Globe,
  Trash2,
  Database,
  Clock,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { Language } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReopenSplash: () => void;
  plansCount?: number;
  gearsCount?: number;
  onClearAllData?: () => Promise<void>;
  onSeedDemoData?: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onReopenSplash,
  plansCount = 0,
  gearsCount = 0,
  onClearAllData,
  onSeedDemoData
}) => {
  const { 
    user, 
    userProfile, 
    updateUserSettings, 
    theme, 
    setTheme, 
    language, 
    setLanguage, 
    t,
    sessionExpiresAt,
    extendSession
  } = useAuth();
  const [sessionExtendedMsg, setSessionExtendedMsg] = useState<boolean>(false);

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
  const [selectedLang, setSelectedLang] = useState<Language>(
    userProfile?.settings.language_preference || language || 'en'
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [dataActionLoading, setDataActionLoading] = useState<boolean>(false);
  const [dataActionMsg, setDataActionMsg] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState<boolean>(false);
  const [confirmingDemo, setConfirmingDemo] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleClearData = async () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    setConfirmingClear(false);
    setDataActionLoading(true);
    try {
      if (onClearAllData) {
        await onClearAllData();
      }
      setDataActionMsg(language === 'id' ? 'Semua data berhasil dikosongkan!' : 'All data successfully cleared!');
      setTimeout(() => setDataActionMsg(null), 3000);
    } catch (err) {
      console.error('Failed to clear data:', err);
      setDataActionMsg(language === 'id' ? 'Gagal mengosongkan data.' : 'Failed to clear data.');
      setTimeout(() => setDataActionMsg(null), 3000);
    } finally {
      setDataActionLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    if (!confirmingDemo) {
      setConfirmingDemo(true);
      return;
    }
    setConfirmingDemo(false);
    setDataActionLoading(true);
    try {
      if (onSeedDemoData) {
        await onSeedDemoData();
      }
      setDataActionMsg(language === 'id' ? 'Data demo berhasil dimuat!' : 'Demo data loaded successfully!');
      setTimeout(() => setDataActionMsg(null), 3000);
    } catch (err) {
      console.error('Failed to seed demo data:', err);
      setDataActionMsg(language === 'id' ? 'Gagal memuat data demo.' : 'Failed to load demo data.');
      setTimeout(() => setDataActionMsg(null), 3000);
    } finally {
      setDataActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      setLanguage(selectedLang);
      await updateUserSettings({
        motivation_quote: quote,
        runner_name: runnerName,
        weekly_target_km: parseFloat(weeklyTarget) || 30,
        theme_preference: theme,
        language_preference: selectedLang
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 dark:text-cyan-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {t('settings_title')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings_subtitle')}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={language === 'id' ? 'Tutup (X)' : 'Close (X)'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          {/* Language Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>{t('setting_language_label')}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="lang-btn-en"
                onClick={() => {
                  setSelectedLang('en');
                  setLanguage('en');
                }}
                className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition-all ${
                  selectedLang === 'en'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 ring-1 ring-cyan-500/40 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                  EN
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">English (Default)</div>
                  <div className="text-[10px] text-slate-500">United States / Global</div>
                </div>
              </button>

              <button
                type="button"
                id="lang-btn-id"
                onClick={() => {
                  setSelectedLang('id');
                  setLanguage('id');
                }}
                className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition-all ${
                  selectedLang === 'id'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 ring-1 ring-cyan-500/40 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                  ID
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Bahasa Indonesia</div>
                  <div className="text-[10px] text-slate-500">Indonesia</div>
                </div>
              </button>
            </div>
          </div>

          {/* Motivation Quote */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>{t('setting_quote_label')}</span>
            </label>
            <textarea
              rows={3}
              id="settings-quote-input"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder={t('setting_quote_placeholder')}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              * {t('setting_quote_help')}
            </p>
          </div>

          {/* Runner Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1.5">
              <UserIcon className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>{t('setting_name_label')}</span>
            </label>
            <input
              type="text"
              id="settings-runner-name"
              value={runnerName}
              onChange={(e) => setRunnerName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Weekly Target Mileage */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1.5">
              <Trophy className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>{t('setting_target_label')}</span>
            </label>
            <input
              type="number"
              min="5"
              step="1"
              id="settings-weekly-target"
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {t('setting_target_help')}
            </p>
          </div>

          {/* Theme Mode Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('setting_theme_label')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="theme-btn-dark"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition-all ${
                  theme === 'dark'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 ring-1 ring-cyan-500/40 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{t('theme_dark_name')}</div>
                  <div className="text-[10px] text-slate-500">{t('theme_dark_desc')}</div>
                </div>
              </button>

              <button
                type="button"
                id="theme-btn-light"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition-all ${
                  theme === 'light'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 ring-1 ring-cyan-500/40 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{t('theme_light_name')}</div>
                  <div className="text-[10px] text-slate-500">{t('theme_light_desc')}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'id' ? 'Manajemen Data & Cloud' : 'Data & Cloud Management'}
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {user ? (
                    language === 'id' 
                      ? `Tersinkron dengan Cloud (${plansCount} lari, ${gearsCount} perlengkapan)`
                      : `Synced to Cloud (${plansCount} runs, ${gearsCount} gears)`
                  ) : (
                    language === 'id' 
                      ? `Penyimpanan Lokal (${plansCount} lari, ${gearsCount} perlengkapan)`
                      : `Local Storage (${plansCount} runs, ${gearsCount} gears)`
                  )}
                </p>
              </div>
            </div>

            {dataActionMsg && (
              <div className="mb-2.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{dataActionMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="clear-all-data-btn"
                disabled={dataActionLoading || (plansCount === 0 && gearsCount === 0)}
                onClick={handleClearData}
                className={`p-2.5 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                  confirmingClear 
                    ? 'border-red-500 bg-red-500 text-white shadow-md' 
                    : 'border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/30'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-bold">
                    {confirmingClear 
                      ? (language === 'id' ? 'Yakin Hapus Semua?' : 'Confirm Clear?') 
                      : (language === 'id' ? 'Kosongkan Data' : 'Clear All Data')}
                  </span>
                </div>
                <p className={`text-[10px] mt-0.5 ${confirmingClear ? 'text-red-100' : 'text-red-500/80 dark:text-red-400/70'}`}>
                  {confirmingClear 
                    ? (language === 'id' ? 'Klik sekali lagi untuk konfirmasi' : 'Click again to confirm') 
                    : (language === 'id' ? 'Hapus semua lari & gear' : 'Delete all runs & gear')}
                </p>
              </button>

              <button
                type="button"
                id="load-demo-data-btn"
                disabled={dataActionLoading}
                onClick={handleSeedDemo}
                className={`p-2.5 rounded-xl border text-left transition-all disabled:opacity-40 cursor-pointer ${
                  confirmingDemo
                    ? 'border-cyan-500 bg-cyan-500 text-slate-950 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Database className={`w-3.5 h-3.5 shrink-0 ${confirmingDemo ? 'text-slate-950' : 'text-cyan-500'}`} />
                  <span className="text-xs font-bold">
                    {confirmingDemo
                      ? (language === 'id' ? 'Yakin Muat Demo?' : 'Confirm Load Demo?')
                      : (language === 'id' ? 'Muat Data Demo' : 'Load Demo Data')}
                  </span>
                </div>
                <p className={`text-[10px] mt-0.5 ${confirmingDemo ? 'text-slate-900 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                  {confirmingDemo
                    ? (language === 'id' ? 'Klik sekali lagi untuk konfirmasi' : 'Click again to confirm')
                    : (language === 'id' ? 'Tambahkan contoh data' : 'Add sample starter data')}
                </p>
              </button>
            </div>
          </div>

          {/* Login Session Management (1 Week Session) */}
          {user && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="p-3 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-500/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('login_session')}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                          {Math.max(1, Math.ceil(((sessionExpiresAt || Date.now() + 7 * 24 * 3600 * 1000) - Date.now()) / (1000 * 60 * 60 * 24)))} {language === 'id' ? 'hari lagi' : 'days left'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {t('login_session_desc')}
                      </p>
                      {sessionExpiresAt && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-cyan-500" />
                          <span>
                            {t('session_active_until')}: {new Date(sessionExpiresAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    id="extend-session-btn"
                    onClick={() => {
                      extendSession();
                      setSessionExtendedMsg(true);
                      setTimeout(() => setSessionExtendedMsg(false), 3000);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-cyan-500/30 bg-white dark:bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-600 dark:text-cyan-400 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
                    title={t('extend_session')}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">{t('extend_session')}</span>
                  </button>
                </div>

                {sessionExtendedMsg && (
                  <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center space-x-1.5 animate-in fade-in duration-200">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('session_extended')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Replay Splash Greeting */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {t('replay_splash_label')}
            </span>
            <button
              type="button"
              id="replay-splash-btn"
              onClick={() => {
                onClose();
                onReopenSplash();
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
              <span>{t('open_splash_btn')}</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              {t('close')}
            </button>
            <button
              type="submit"
              disabled={saving}
              id="save-settings-btn"
              className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('saved')}</span>
                </>
              ) : saving ? (
                <span>{t('saving')}</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{t('save_settings')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

