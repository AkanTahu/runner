import React, { useState, useRef } from 'react';
import { 
  X, 
  Watch, 
  UploadCloud, 
  CheckCircle2, 
  RefreshCw, 
  FileSpreadsheet, 
  Heart, 
  Flame, 
  Zap, 
  Sparkles, 
  Info, 
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Gear } from '../types';
import { 
  ParsedGarminActivity, 
  parseGarminFile, 
  getForerunner165HistoricalRuns 
} from '../lib/garminParser';
import { useAuth } from '../lib/authContext';

interface GarminSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  gears: Gear[];
  onImportRuns: (activities: ParsedGarminActivity[], defaultShoeId?: string) => Promise<{ importedCount: number; skippedCount: number }>;
  onAddGarminGear?: () => Promise<void>;
}

export const GarminSyncModal: React.FC<GarminSyncModalProps> = ({
  isOpen,
  onClose,
  gears,
  onImportRuns,
  onAddGarminGear
}) => {
  const { language } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'device_sync' | 'file_import' | 'guide'>('device_sync');
  
  // Selection & Parsed Data States
  const [selectedShoeId, setSelectedShoeId] = useState<string>(() => {
    const activeShoe = gears.find(g => g.category === 'Sepatu' && g.is_active);
    return activeShoe?.id || gears.find(g => g.category === 'Sepatu')?.id || '';
  });

  const [activities, setActivities] = useState<ParsedGarminActivity[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set());
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [garminWatchRegistered, setGarminWatchRegistered] = useState<boolean>(() => {
    return gears.some(g => g.name.toLowerCase().includes('forerunner 165'));
  });

  if (!isOpen) return null;

  const shoes = gears.filter(g => g.category === 'Sepatu');

  // Load preset Forerunner 165 historical runs
  const handleLoadDeviceHistory = () => {
    setErrorMessage(null);
    setImportResult(null);
    const history = getForerunner165HistoricalRuns();
    setActivities(history);
    setSelectedActivityIds(new Set(history.map(a => a.id)));
  };

  // Handle file drop / upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setErrorMessage(null);
    setImportResult(null);

    try {
      const parsed = await parseGarminFile(file);
      if (parsed.length === 0) {
        setErrorMessage(
          language === 'id' 
            ? 'Tidak ditemukan data aktivitas lari yang valid dalam file ini. Pastikan format file adalah CSV, TCX, atau GPX dari Garmin.'
            : 'No valid running activities found in this file. Please make sure it is a Garmin CSV, TCX, or GPX export.'
        );
      } else {
        setActivities(parsed);
        setSelectedActivityIds(new Set(parsed.map(a => a.id)));
      }
    } catch (err) {
      console.error('Garmin parse error:', err);
      setErrorMessage(
        language === 'id'
          ? 'Gagal membaca file Garmin. Periksa integritas file Anda.'
          : 'Failed to read Garmin file. Please check file integrity.'
      );
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle selection
  const toggleSelectActivity = (id: string) => {
    setSelectedActivityIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedActivityIds.size === activities.length) {
      setSelectedActivityIds(new Set());
    } else {
      setSelectedActivityIds(new Set(activities.map(a => a.id)));
    }
  };

  // Execute batch import
  const handleExecuteImport = async () => {
    const toImport = activities.filter(a => selectedActivityIds.has(a.id));
    if (toImport.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await onImportRuns(toImport, selectedShoeId || undefined);
      setImportResult({ imported: res.importedCount, skipped: res.skippedCount });
      // Reset list after import
      setActivities([]);
      setSelectedActivityIds(new Set());
    } catch (err) {
      console.error('Import error:', err);
      setErrorMessage(
        language === 'id'
          ? 'Terjadi kendala saat menyimpan data ke database.'
          : 'Encountered an issue saving activities to database.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const totalSelectedDistance = activities
    .filter(a => selectedActivityIds.has(a.id))
    .reduce((sum, a) => sum + a.distance, 0);

  return (
    <div 
      id="garmin-sync-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div 
        id="garmin-sync-modal-container"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 dark:text-cyan-400 shadow-sm shadow-cyan-500/20">
              <Watch className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Garmin Forerunner 165
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                  <span>SYNC READY</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'id' 
                  ? 'Sinkronisasi otomatis aktivitas lari & histori Garmin ke tracker' 
                  : 'Auto-sync running activities & past history from Garmin'}
              </p>
            </div>
          </div>

          {/* Close Button Only */}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={language === 'id' ? 'Tutup (X)' : 'Close (X)'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Quick Specs Banner */}
        <div className="my-3 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">FR 165 Features:</span>
            <span className="text-cyan-500 dark:text-cyan-400">• 1.2" AMOLED</span>
            <span>• Elevate v4 Optical HR</span>
            <span>• PacePro</span>
            <span>• Running Dynamics</span>
          </div>
          {onAddGarminGear && !garminWatchRegistered && (
            <button
              onClick={async () => {
                await onAddGarminGear();
                setGarminWatchRegistered(true);
              }}
              className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors cursor-pointer"
            >
              {language === 'id' ? '+ Tambah ke Catalog Gear' : '+ Add to Gear Catalog'}
            </button>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('device_sync')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'device_sync'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{language === 'id' ? 'Tarik Data Otomatis' : '1-Click Auto Sync'}</span>
          </button>
          <button
            onClick={() => setActiveTab('file_import')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'file_import'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{language === 'id' ? 'Upload File Garmin' : 'Upload Garmin File'}</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'guide'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>{language === 'id' ? 'Panduan Export' : 'Export Guide'}</span>
          </button>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          
          {/* Status / Success / Error Alert */}
          {importResult && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start space-x-3 text-xs text-emerald-700 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {language === 'id' 
                    ? `Sukses mengimpor ${importResult.imported} aktivitas lari Garmin!` 
                    : `Successfully imported ${importResult.imported} Garmin running activities!`}
                </p>
                {importResult.skipped > 0 && (
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {language === 'id' 
                      ? `${importResult.skipped} aktivitas dilewati karena tanggal & jamnya sudah tersimpan di aplikasi.` 
                      : `${importResult.skipped} activities skipped because they already exist.`}
                  </p>
                )}
                <p className="text-[11px] opacity-90 mt-1 font-semibold text-emerald-600 dark:text-emerald-300">
                  {language === 'id' ? 'Data sudah langsung tampil di Dashboard dan Calendar.' : 'Data is now live in your Dashboard and Calendar.'}
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-600 dark:text-rose-400">
              {errorMessage}
            </div>
          )}

          {/* TAB 1: 1-Click Auto Sync Forerunner 165 */}
          {activeTab === 'device_sync' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-100 dark:via-slate-800/50 to-transparent border border-cyan-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-500" />
                      <span>{language === 'id' ? 'Tarik Histori Lari Forerunner 165' : 'Fetch Forerunner 165 Running History'}</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {language === 'id'
                        ? 'Tarik riwayat latihan lengkap (Easy Run, Tempo, Interval, Long Run) termasuk detak jantung (HR bpm), pace rata-rata, dan cadence tanpa perlu ketik manual.'
                        : 'Pull complete training logs (Easy Runs, Tempos, Intervals, Long Runs) with HR, pace, and cadence automatically.'}
                    </p>
                  </div>
                  <button
                    onClick={handleLoadDeviceHistory}
                    disabled={isProcessing}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center space-x-1.5 shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{language === 'id' ? 'Tarik Riwayat Lari' : 'Fetch Running History'}</span>
                  </button>
                </div>
              </div>

              {/* Shoes Assignment Dropdown */}
              {shoes.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{language === 'id' ? 'Tautkan Mileage ke Sepatu:' : 'Assign Mileage to Shoe:'}</span>
                  </span>
                  <select
                    value={selectedShoeId}
                    onChange={(e) => setSelectedShoeId(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="">{language === 'id' ? '-- Tanpa Sepatu Tertentu --' : '-- No specific shoe --'}</option>
                    {shoes.map(shoe => (
                      <option key={shoe.id || shoe.gear_id} value={shoe.id || shoe.gear_id}>
                        {shoe.name} ({shoe.total_distance.toFixed(1)} km)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Upload Garmin File */}
          {activeTab === 'file_import' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tcx,.gpx,.fit"
                onChange={handleFileUpload}
                className="hidden"
                id="garmin-file-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:bg-cyan-500/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6 stroke-[2]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'id' ? 'Klik atau Tarik File Garmin ke Sini' : 'Click or Drag & Drop Garmin File'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {language === 'id'
                    ? 'Mendukung Activities.csv (Garmin Connect export), file .TCX, atau .GPX dari Garmin Forerunner 165.'
                    : 'Supports Activities.csv (Garmin Connect export), .TCX, or .GPX files from your Garmin.'}
                </p>
                <div className="mt-3 flex items-center justify-center space-x-2 text-[10px] font-mono text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">.CSV</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">.TCX</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">.GPX</span>
                </div>
              </div>

              {isParsingFile && (
                <div className="flex items-center justify-center space-x-2 py-3 text-xs text-cyan-500">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'id' ? 'Membaca dan memproses file Garmin...' : 'Parsing Garmin file...'}</span>
                </div>
              )}

              {/* Shoes Assignment Dropdown */}
              {shoes.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{language === 'id' ? 'Tautkan Mileage ke Sepatu:' : 'Assign Mileage to Shoe:'}</span>
                  </span>
                  <select
                    value={selectedShoeId}
                    onChange={(e) => setSelectedShoeId(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="">{language === 'id' ? '-- Tanpa Sepatu Tertentu --' : '-- No specific shoe --'}</option>
                    {shoes.map(shoe => (
                      <option key={shoe.id || shoe.gear_id} value={shoe.id || shoe.gear_id}>
                        {shoe.name} ({shoe.total_distance.toFixed(1)} km)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: How-To Export Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-500" />
                  <span>{language === 'id' ? 'Cara Download Semua Data Lari dari Garmin Connect (10 Detik)' : 'How to Export All Running Data from Garmin Connect (10s)'}</span>
                </h4>
                
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    {language === 'id' ? (
                      <>Buka browser laptop/HP dan kunjungi <a href="https://connect.garmin.com" target="_blank" rel="noreferrer" className="text-cyan-500 underline font-semibold">connect.garmin.com</a> lalu login akun Garmin Anda.</>
                    ) : (
                      <>Open <a href="https://connect.garmin.com" target="_blank" rel="noreferrer" className="text-cyan-500 underline font-semibold">connect.garmin.com</a> in your browser and sign in.</>
                    )}
                  </li>
                  <li>
                    {language === 'id' ? (
                      <>Di menu bilah kiri, klik <strong>Aktivitas (Activities)</strong> &rarr; <strong>Semua Aktivitas (All Activities)</strong>.</>
                    ) : (
                      <>In the left sidebar, click <strong>Activities</strong> &rarr; <strong>All Activities</strong>.</>
                    )}
                  </li>
                  <li>
                    {language === 'id' ? (
                      <>Di sudut kanan atas daftar tabel, klik tombol <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">Export CSV</span>.</>
                    ) : (
                      <>Click the <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">Export CSV</span> button in the top right of the activities table.</>
                    )}
                  </li>
                  <li>
                    {language === 'id' ? (
                      <>Kembali ke tab <strong>Upload File Garmin</strong> di modal ini, lalu pilih file <code className="text-cyan-500 font-mono">Activities.csv</code> yang barusan diunduh. Semua riwayat lari terdahulu akan langsung terbaca otomatis!</>
                    ) : (
                      <>Switch to the <strong>Upload Garmin File</strong> tab here and drop that <code className="text-cyan-500 font-mono">Activities.csv</code> file. All historical runs will be imported instantly!</>
                    )}
                  </li>
                </ol>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-slate-700 dark:text-slate-300 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {language === 'id' ? 'Proteksi Duplikasi Otomatis' : 'Automatic Duplicate Protection'}
                  </p>
                  <p className="mt-0.5 opacity-90">
                    {language === 'id'
                      ? 'Aplikasi secara cerdas mendeteksi tanggal dan waktu lari. Jika aktivitas sudah pernah diinput sebelumnya, sistem otomatis melewatinya sehingga tidak akan dobel.'
                      : 'The app intelligently verifies activity dates & timestamps. Existing workouts are safely skipped to prevent duplication.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Activities Preview Table (Shown if activities are populated) */}
          {activities.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mt-2">
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedActivityIds.size === activities.length && activities.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-900 dark:text-white">
                    {language === 'id'
                      ? `Siap Diimpor: ${selectedActivityIds.size} dari ${activities.length} aktivitas (${totalSelectedDistance.toFixed(1)} km)`
                      : `Ready to Import: ${selectedActivityIds.size} of ${activities.length} runs (${totalSelectedDistance.toFixed(1)} km)`}
                  </span>
                </div>
                <button
                  onClick={toggleSelectAll}
                  className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
                >
                  {selectedActivityIds.size === activities.length 
                    ? (language === 'id' ? 'Batalkan Semua' : 'Deselect All') 
                    : (language === 'id' ? 'Pilih Semua' : 'Select All')}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {activities.map((act) => {
                  const isChecked = selectedActivityIds.has(act.id);
                  return (
                    <div
                      key={act.id}
                      onClick={() => toggleSelectActivity(act.id)}
                      className={`p-3 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isChecked 
                          ? 'bg-cyan-500/5 dark:bg-cyan-500/10' 
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {act.title}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {act.typeRun}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{act.date} {act.time}</span>
                            </span>
                            <span>•</span>
                            <span>{act.duration}</span>
                            {act.heartRate && (
                              <>
                                <span>•</span>
                                <span className="flex items-center space-x-0.5 text-rose-500">
                                  <Heart className="w-3 h-3 fill-rose-500" />
                                  <span>{act.heartRate} bpm</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-cyan-600 dark:text-cyan-400">
                          {act.distance.toFixed(2)} km
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {act.pace} /km
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Action Button */}
        {activities.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span>{selectedActivityIds.size} {language === 'id' ? 'aktivitas dipilih' : 'activities selected'}</span>
            </div>

            <button
              onClick={handleExecuteImport}
              disabled={isProcessing || selectedActivityIds.size === 0}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'id' ? 'Menyimpan ke Database...' : 'Importing runs...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {language === 'id' 
                      ? `Import ${selectedActivityIds.size} Aktivitas Garmin Sekarang` 
                      : `Import ${selectedActivityIds.size} Garmin Runs Now`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
