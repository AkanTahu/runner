import React from 'react';
import { 
  Footprints, 
  Calendar, 
  BarChart3, 
  Sun, 
  Moon, 
  Settings as SettingsIcon, 
  LogOut, 
  LogIn,
  PackageCheck,
  Globe
} from 'lucide-react';
import { useAuth } from '../lib/authContext';

interface NavbarProps {
  activeTab: 'dashboard' | 'plans' | 'summary' | 'gears';
  setActiveTab: (tab: 'dashboard' | 'plans' | 'summary' | 'gears') => void;
  onOpenRunModal: () => void;
  onOpenSettings: () => void;
  onReopenSplash: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRunModal,
  onOpenSettings,
  onReopenSplash: _onReopenSplash
}) => {
  const { user, userProfile, theme, setTheme, language, setLanguage, t, signInWithGoogle, signInAsDemoUser, signOut } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'id' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity */}
          <div className="flex items-center space-x-3">
            <button 
              id="brand-logo-btn"
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center space-x-2.5 focus:outline-none group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Footprints className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="text-left hidden xs:block">
                <div className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                  RUN TRACKER<span className="text-cyan-500 dark:text-cyan-400">.</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Planner & Mileage Log
                </div>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1.5 ml-6">
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
            {/* Quick Language Toggle */}
            <button
              id="lang-quick-toggle-btn"
              onClick={toggleLanguage}
              title={`Switch language: current is ${language === 'en' ? 'English' : 'Bahasa Indonesia'}`}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span className="uppercase text-[11px]">{language}</span>
            </button>

            {/* Primary Log Run CTA Button */}
            <button
              id="top-log-run-btn"
              onClick={onOpenRunModal}
              className="flex items-center justify-center px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 shadow-md shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>{t('quick_log')}</span>
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
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:opacity-90 transition-opacity flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('sign_in_google')}</span>
                  <span className="sm:hidden">Google</span>
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

