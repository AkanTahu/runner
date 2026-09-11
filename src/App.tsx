import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { Navbar } from './components/Navbar';
import { SplashScreen } from './components/SplashScreen';
import { Dashboard } from './components/Dashboard';
import { PlanPage } from './components/PlanPage';
import { SummaryPage } from './components/SummaryPage';
import { GearPage } from './components/GearPage';
import { RunModal } from './components/RunModal';
import { SettingsModal } from './components/SettingsModal';
import { Plan, Gear } from './types';
import { subscribePlans, clearAllPlans, seedDefaultPlansIfEmpty } from './lib/planService';
import { subscribeGears, clearAllGears, seedDefaultGearsIfEmpty } from './lib/gearService';
import { Loader2, Footprints } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, userProfile, loading, signInWithGoogle, t, language } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'plans' | 'summary' | 'gears'>('dashboard');
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // Only show splash once per browser session, but allow reopening anytime
    const hasSeenSplash = sessionStorage.getItem('has_seen_splash_screen');
    return !hasSeenSplash;
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [gears, setGears] = useState<Gear[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Modal states
  const [isRunModalOpen, setIsRunModalOpen] = useState<boolean>(false);
  const [runModalMode, setRunModalMode] = useState<'quick_log' | 'plan' | 'actual'>('quick_log');
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<Plan | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [modalDefaultSessionLabel, setModalDefaultSessionLabel] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const effectiveUid = user?.uid || 'guest_runner_personal';

  // Data Fetching: subscribe to real-time data safely (Firestore when logged in, local when in guest mode)
  useEffect(() => {
    if (loading) return;

    let unsubPlans: (() => void) | undefined;
    let unsubGears: (() => void) | undefined;

    try {
      if (user) {
        unsubGears = subscribeGears(user.uid, (gearItems) => {
          setGears(gearItems);
        });

        unsubPlans = subscribePlans(user.uid, (planItems) => {
          setPlans(planItems);
          setDataLoading(false);
        });
      } else {
        // Guest mode - loads instantly from local storage with starter presets
        unsubGears = subscribeGears('guest_runner_personal', (gearItems) => {
          setGears(gearItems);
        });

        unsubPlans = subscribePlans('guest_runner_personal', (planItems) => {
          setPlans(planItems);
          setDataLoading(false);
        });
      }
    } catch (err) {
      console.warn('Real-time subscription error:', err);
      setDataLoading(false);
    }

    return () => {
      if (unsubPlans) unsubPlans();
      if (unsubGears) unsubGears();
    };
  }, [user, loading]);

  const handleFinishSplash = () => {
    sessionStorage.setItem('has_seen_splash_screen', 'true');
    setShowSplash(false);
  };

  const handleOpenQuickLog = (defaultDate?: unknown, defaultSessionLabel?: unknown) => {
    setSelectedPlanForModal(null);
    setModalDefaultDate(typeof defaultDate === 'string' ? defaultDate : undefined);
    setModalDefaultSessionLabel(typeof defaultSessionLabel === 'string' ? defaultSessionLabel : undefined);
    setRunModalMode('quick_log');
    setIsRunModalOpen(true);
  };

  const handleOpenCreatePlan = (defaultDate?: unknown, defaultSessionLabel?: unknown) => {
    setSelectedPlanForModal(null);
    setModalDefaultDate(typeof defaultDate === 'string' ? defaultDate : undefined);
    setModalDefaultSessionLabel(typeof defaultSessionLabel === 'string' ? defaultSessionLabel : undefined);
    setRunModalMode('plan');
    setIsRunModalOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlanForModal(plan);
    setModalDefaultDate(plan.date);
    setModalDefaultSessionLabel(plan.session_label);
    setRunModalMode('plan');
    setIsRunModalOpen(true);
  };

  const handleLogActual = (plan: Plan) => {
    setSelectedPlanForModal(plan);
    setModalDefaultDate(plan.date);
    setModalDefaultSessionLabel(plan.session_label);
    setRunModalMode('actual');
    setIsRunModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10 animate-pulse">
          <Footprints className="w-6 h-6" />
        </div>
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
          {language === 'id' ? 'Memuat Personal Running Tracker...' : 'Loading Personal Running Tracker...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans antialiased transition-colors selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* 1. Splash Screen / Greeting Presentation */}
      {showSplash && (
        <SplashScreen
          plans={plans}
          motivationQuote={userProfile?.settings.motivation_quote}
          onComplete={handleFinishSplash}
        />
      )}

      {/* 2. Top Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRunModal={handleOpenQuickLog}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReopenSplash={() => setShowSplash(true)}
      />

      {/* 3. Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user && (
          <div id="guest-mode-banner" className="mb-6 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <span>
                <strong className="font-semibold text-cyan-700 dark:text-cyan-400">
                  {language === 'id' ? 'Mode Tamu (Penyimpanan Lokal):' : 'Guest Mode (Local Storage):'}
                </strong>{' '}
                {language === 'id' 
                  ? 'Aktivitas dan gear tersimpan di perangkat ini. Masuk dengan Google untuk sinkronisasi cloud real-time.' 
                  : 'Activities and gear are saved locally on this browser. Sign in with Google to sync across devices.'}
              </span>
            </div>
            <button
              id="guest-banner-login-btn"
              onClick={() => signInWithGoogle()}
              className="shrink-0 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold tracking-wide transition shadow-sm cursor-pointer"
            >
              {language === 'id' ? 'Masuk Google' : 'Sign in with Google'}
            </button>
          </div>
        )}

        {dataLoading && plans.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            <p className="text-xs font-mono text-slate-400">
              {language === 'id' ? 'Sinkronisasi data...' : 'Synchronizing data...'}
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                plans={plans}
                gears={gears}
                userSettings={userProfile?.settings}
                onOpenCreatePlan={handleOpenCreatePlan}
                onLogActual={handleLogActual}
                onOpenQuickRunModal={handleOpenQuickLog}
                onGoToPlans={() => setActiveTab('plans')}
                onGoToGears={() => setActiveTab('gears')}
              />
            )}

            {activeTab === 'plans' && (
              <PlanPage
                plans={plans}
                gears={gears}
                onOpenCreatePlan={handleOpenCreatePlan}
                onOpenQuickRunModal={handleOpenQuickLog}
                onEditPlan={handleEditPlan}
                onLogActual={handleLogActual}
              />
            )}

            {activeTab === 'summary' && (
              <SummaryPage
                plans={plans}
                gears={gears}
              />
            )}

            {activeTab === 'gears' && (
              <GearPage
                gears={gears}
                uid={effectiveUid}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <RunModal
        isOpen={isRunModalOpen}
        onClose={() => {
          setIsRunModalOpen(false);
          setSelectedPlanForModal(null);
          setModalDefaultDate(undefined);
          setModalDefaultSessionLabel(undefined);
        }}
        uid={effectiveUid}
        gears={gears}
        existingPlan={selectedPlanForModal}
        initialMode={runModalMode}
        defaultDate={modalDefaultDate}
        defaultSessionLabel={modalDefaultSessionLabel}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onReopenSplash={() => setShowSplash(true)}
        plansCount={plans.length}
        gearsCount={gears.length}
        onClearAllData={async () => {
          await clearAllPlans(effectiveUid);
          await clearAllGears(effectiveUid);
        }}
        onSeedDemoData={async () => {
          await seedDefaultGearsIfEmpty(effectiveUid, 0);
          await seedDefaultPlansIfEmpty(effectiveUid, 0, gears);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
