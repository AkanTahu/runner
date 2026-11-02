import React from 'react';
import { 
  Footprints, 
  Calendar, 
  BarChart3, 
  Sun, 
  Moon, 
  Settings as SettingsIcon, 
  LogOut, 
  PackageCheck,
  Watch
} from 'lucide-react';
import { useAuth } from '../lib/authContext';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

interface NavbarProps {
  activeTab: 'dashboard' | 'plans' | 'summary' | 'gears';
  setActiveTab: (tab: 'dashboard' | 'plans' | 'summary' | 'gears') => void;
  onOpenRunModal?: () => void;
  onOpenGarminSync: () => void;
  onOpenSettings: () => void;
  onReopenSplash: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRunModal: _onOpenRunModal,
  onOpenGarminSync,
  onOpenSettings,
  onReopenSplash: _onReopenSplash
}) => {
  const { user, userProfile, theme, setTheme, language, t, signInWithGoogle, signInAsDemoUser, signOut } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Navigation Links */}
          <div className="flex items-center">
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1.5">
              <button
                id="nav-tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/40 border border-transparent font-medium'
                }`}
              >
                {t('dashboard')}
              </button>

              <button
                id="nav-tab-plans"
                onClick={() => setActiveTab('plans')}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  activeTab === 'plans'
                    ? 'bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/40 border border-transparent font-medium'
                }`}
              >
                {t('plans')}
              </button>

              <button
                id="nav-tab-summary"
                onClick={() => setActiveTab('summary')}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  activeTab === 'summary'
                    ? 'bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/40 border border-transparent font-medium'
                }`}
              >
                {t('summary')}
              </button>

              <button
                id="nav-tab-gears"
                onClick={() => setActiveTab('gears')}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  activeTab === 'gears'
                    ? 'bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/40 border border-transparent font-medium'
                }`}
              >
                {t('gears')}
              </button>
            </nav>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            {/* Garmin Forerunner 165 Integration Button */}
            <button
              id="garmin-sync-btn"
              onClick={() => onOpenGarminSync()}
              title={language === 'id' ? 'Integrasi Garmin Forerunner 165 (Auto-Sync & Import)' : 'Garmin Forerunner 165 Integration (Auto-Sync & Import)'}
              className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 group"
            >
              <Watch className="w-3.5 h-3.5 text-cyan-500 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Garmin Sync</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-cyan-500 text-slate-950 font-black">
                FR 165
              </span>
            </button>

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Settings Modal Button */}
            <button
              id="open-settings-btn"
              onClick={onOpenSettings}
              aria-label="Settings"
              title={t('settings')}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div 
                  className="relative group cursor-pointer" 
                  onClick={onOpenSettings} 
                  title={language === 'id' ? 'Sesi login aktif (1 minggu) - Klik untuk info' : 'Login session active (1 week) - Click for info'}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Runner'}
                      className="w-8 h-8 rounded-full border border-cyan-500/40 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold flex items-center justify-center border border-cyan-500/30">
                      {(userProfile?.settings.runner_name || user.displayName || 'R').charAt(0)}
                    </div>
                  )}
                  {/* Subtle 7-day session indicator dot */}
                  <span 
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" 
                    title={language === 'id' ? 'Sesi login aktif 1 minggu' : '1-week session active'} 
                  />
                </div>
                <button
                  id="sign-out-btn"
                  onClick={signOut}
                  title={t('sign_out')}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                <button
                  id="google-signin-btn"
                  onClick={signInWithGoogle}
                  title={t('sign_in_google')}
                  aria-label={t('sign_in_google')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                >
                  <GoogleIcon className="w-4 h-4" />
                </button>
                <button
                  id="demo-signin-btn"
                  onClick={signInAsDemoUser}
                  title="Coba Akun Demo"
                  className="px-2.5 py-1.5 text-[11px] font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Demo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 dark:border-slate-800/80 py-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-2">
        <button
          id="mobile-tab-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold rounded-lg ${
            activeTab === 'dashboard'
              ? 'text-cyan-600 dark:text-cyan-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Footprints className="w-4 h-4 mb-0.5" />
          {t('dashboard')}
        </button>

        <button
          id="mobile-tab-plans"
          onClick={() => setActiveTab('plans')}
          className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold rounded-lg ${
            activeTab === 'plans'
              ? 'text-cyan-600 dark:text-cyan-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          {t('plans')}
        </button>

        <button
          id="mobile-tab-summary"
          onClick={() => setActiveTab('summary')}
          className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold rounded-lg ${
            activeTab === 'summary'
              ? 'text-cyan-600 dark:text-cyan-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          {t('summary')}
        </button>

        <button
          id="mobile-tab-gears"
          onClick={() => setActiveTab('gears')}
          className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold rounded-lg ${
            activeTab === 'gears'
              ? 'text-cyan-600 dark:text-cyan-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <PackageCheck className="w-4 h-4 mb-0.5" />
          {t('gears')}
        </button>
      </div>
    </header>
  );
};

