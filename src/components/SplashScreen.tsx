import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronRight, Activity, Sparkles } from 'lucide-react';
import { Plan } from '../types';
import { useAuth } from '../lib/authContext';

interface SplashScreenProps {
  onComplete: () => void;
  motivationQuote?: string;
  plans: Plan[];
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  motivationQuote = "It never gets easier, you just go faster. Every mile is a step towards greatness.",
  plans
}) => {
  const { t, language } = useAuth();
  const [currentSlide, setCurrentSlide] = useState<number>(1);

  // Calculate quick summary for this week
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const completedRunsThisWeek = plans.filter(p => {
    if (!p.actual_log?.is_run) return false;
    const d = new Date(p.date);
    return d >= sevenDaysAgo && d <= today;
  });

  const totalWeeklyMileage = completedRunsThisWeek.reduce((sum, p) => sum + (p.actual_log?.actual_distance || 0), 0);
  const totalWeeklyRuns = completedRunsThisWeek.length;

  return (
    <div id="splash-screen-container" className="fixed inset-0 z-50 flex flex-col justify-between bg-black text-white select-none overflow-hidden">
      {/* Background cinematic runner photo with deep dark overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1920&q=80"
          alt="Runner in motion"
          className="w-full h-full object-cover object-center opacity-40 scale-105 filter contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between p-6 sm:p-8 max-w-6xl w-full mx-auto">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-cyan-500/20">
            PRT
          </div>
          <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            EST. 2026 // SLEEK RUNNER
          </span>
        </div>

        <button
          id="skip-splash-btn"
          onClick={onComplete}
          className="text-xs font-medium tracking-wide text-slate-400 hover:text-cyan-400 transition-colors uppercase py-1.5 px-3.5 border border-slate-800 rounded-full hover:border-cyan-500/40 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
        >
          {language === 'id' ? 'Lewati (Skip)' : 'Skip'}
        </button>
      </div>

      {/* Slide Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 sm:px-12 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {currentSlide === 1 ? (
            <motion.div
              key="slide-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-6"
            >
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs tracking-wider uppercase font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Motivasi Lari Harian' : 'Daily Running Motivation'}</span>
              </div>

              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white uppercase leading-none">
                RUNNERS<span className="text-cyan-400">.</span>
              </h1>

              <p className="text-lg sm:text-2xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto italic">
                "{motivationQuote}"
              </p>

              <div className="text-xs tracking-widest text-slate-500 uppercase font-mono">
                {language === 'id' ? 'Pencatatan Konsistensi & Performa Lari Pribadi' : 'Personal Running Consistency & Performance Tracker'}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="slide-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-8 w-full"
            >
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs tracking-wider uppercase font-semibold">
                <Activity className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Ringkasan Mingguan' : 'Weekly Snapshot'}</span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase text-white">
                  {language === 'id' ? (
                    <>RINGKASAN <span className="text-cyan-400">MINGGU INI</span></>
                  ) : (
                    <>THIS WEEK <span className="text-cyan-400">SNAPSHOT</span></>
                  )}
                </h2>
                <p className="text-sm text-slate-400 mt-2">
                  {language === 'id' ? 'Progres akumulasi 7 hari terakhir' : 'Accumulated progress over the last 7 days'}
                </p>
              </div>

              {/* Quick metrics cards */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md text-left">
                  <div className="text-xs font-mono text-slate-400 uppercase">{t('stat_total_distance')}</div>
                  <div className="text-3xl font-black text-cyan-400 mt-1">
                    {totalWeeklyMileage.toFixed(1)} <span className="text-sm font-normal text-slate-400">km</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {language === 'id' ? 'Minggu berjalan' : 'Current week'}
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md text-left">
                  <div className="text-xs font-mono text-slate-400 uppercase">{t('stat_total_runs')}</div>
                  <div className="text-3xl font-black text-cyan-300 mt-1">
                    {totalWeeklyRuns} <span className="text-sm font-normal text-slate-400">{language === 'id' ? 'sesi' : 'runs'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {language === 'id' ? 'Konsistensi terlatih' : 'Runs completed'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="relative z-10 p-6 sm:p-8 max-w-4xl w-full mx-auto flex items-center justify-between">
        {/* Pagination Dots */}
        <div className="flex items-center space-x-2">
          <span 
            className={`h-2 rounded-full transition-all duration-300 ${
              currentSlide === 1 ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'
            }`}
          />
          <span 
            className={`h-2 rounded-full transition-all duration-300 ${
              currentSlide === 2 ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'
            }`}
          />
        </div>

        {/* Action Button */}
        {currentSlide === 1 ? (
          <button
            id="splash-next-slide-btn"
            onClick={() => setCurrentSlide(2)}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition-transform hover:scale-105 shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
          >
            <span>{language === 'id' ? 'Lanjut Ringkasan' : 'Next Summary'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            id="splash-get-started-btn"
            onClick={onComplete}
            className="flex items-center space-x-2 px-7 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition-transform hover:scale-105 shadow-lg shadow-cyan-500/25 active:scale-95 cursor-pointer"
          >
            <span>{language === 'id' ? 'Masuk Dashboard' : 'Open Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

