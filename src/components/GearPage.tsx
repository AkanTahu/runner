import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Footprints, 
  Watch, 
  Shirt, 
  AlertTriangle,
  X
} from 'lucide-react';
import { Gear, GearCategory } from '../types';
import { addGear, updateGear, deleteGear } from '../lib/gearService';
import { useAuth } from '../lib/authContext';

interface GearPageProps {
  gears: Gear[];
  uid: string;
}

export const GearPage: React.FC<GearPageProps> = ({ gears, uid }) => {
  const { t, language } = useAuth();
  const [activeCategory, setActiveCategory] = useState<GearCategory | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingGear, setEditingGear] = useState<Gear | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<GearCategory>('Sepatu');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [initialDistance, setInitialDistance] = useState<string>('0');
  const [maxDistance, setMaxDistance] = useState<string>('750');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const filteredGears = gears.filter(g => {
    if (activeCategory === 'all') return true;
    return g.category === activeCategory;
  });

  const handleOpenAdd = () => {
    setEditingGear(null);
    setName('');
    setCategory('Sepatu');
    setImageUrl('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80');
    setInitialDistance('0');
    setMaxDistance('750');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (gear: Gear) => {
    setEditingGear(gear);
    setName(gear.name);
    setCategory(gear.category);
    setImageUrl(gear.image_url);
    setInitialDistance(gear.total_distance.toString());
    setMaxDistance((gear.max_distance || 750).toString());
    setIsActive(gear.is_active);
    setIsModalOpen(true);
  };

  const handleDelete = async (gear: Gear) => {
    if (!gear.id) return;
    const confirmMsg = language === 'id' 
      ? `Hapus ${gear.name} dari daftar perlengkapan?` 
      : `Delete ${gear.name} from gear list?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteGear(gear.id);
    } catch (err) {
      console.error('Delete gear error:', err);
      alert('Failed to delete gear.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingGear?.id) {
        await updateGear(editingGear.id, {
          name,
          category,
          image_url: imageUrl,
          total_distance: parseFloat(initialDistance) || 0,
          max_distance: parseFloat(maxDistance) || 750,
          is_active: isActive
        });
      } else {
        await addGear(uid, {
          name,
          category,
          image_url: imageUrl,
          total_distance: parseFloat(initialDistance) || 0,
          max_distance: parseFloat(maxDistance) || 750,
          is_active: isActive
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save gear error:', err);
      alert('Failed to save gear.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (cat: GearCategory) => {
    switch (cat) {
      case 'Sepatu':
        return <Footprints className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'Jam':
        return <Watch className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'Baju':
        return <Shirt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const getCategoryLabel = (cat: GearCategory | 'all') => {
    if (cat === 'all') return t('category_all');
    if (cat === 'Sepatu') return t('category_shoes');
    if (cat === 'Jam') return t('category_watches');
    if (cat === 'Baju') return t('category_apparel');
    return cat;
  };

  return (
    <div id="gear-page-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">
            {t('gear_header')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('gear_subtitle')}
          </p>
        </div>

        <button
          id="add-gear-btn"
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ {t('add_gear_btn')}</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(['all', 'Sepatu', 'Jam', 'Baju'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Showcase Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGears.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl bg-white dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 shadow-xs">
            <Footprints className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('empty_gear_title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {t('empty_gear_desc')}
            </p>
          </div>
        ) : (
          filteredGears.map((gear) => {
            const maxDist = gear.max_distance || 750;
            const usagePercent = Math.min(100, Math.round((gear.total_distance / maxDist) * 100));
            const isShoe = gear.category === 'Sepatu';
            const isNearRetirement = isShoe && usagePercent >= 85;

            return (
              <div
                key={gear.id}
                id={`gear-card-${gear.id}`}
                className="group relative p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-700/80 shadow-xs transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Top actions & category */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {getCategoryIcon(gear.category)}
                    <span>{getCategoryLabel(gear.category)}</span>
                  </div>

                  <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(gear)}
                      title={t('edit')}
                      className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(gear)}
                      title={t('delete')}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Floating Product Image with Soft Radial Glow Backdrop */}
                <div className="relative my-6 flex items-center justify-center h-44">
                  {/* Soft circular background */}
                  <div className="absolute w-36 h-36 rounded-full bg-cyan-500/10 blur-xl group-hover:scale-110 transition-transform" />
                  
                  <img
                    src={gear.image_url}
                    alt={gear.name}
                    referrerPolicy="no-referrer"
                    className="relative z-10 max-h-36 max-w-[85%] object-contain drop-shadow-xl group-hover:-translate-y-1 transition-transform duration-300"
                  />
                </div>

                {/* Shoe Info & Mileage Tracking Indicator */}
                <div className="text-center space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {gear.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {gear.is_active 
                        ? (language === 'id' ? 'Status: Aktif Digunakan' : 'Status: In Active Rotation') 
                        : (language === 'id' ? 'Pensiun / Arsip' : 'Retired / Archived')}
                    </p>
                  </div>

                  {isShoe && (
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {gear.total_distance.toFixed(1)} km / {maxDist} km
                        </span>
                        <span className={`font-bold text-[11px] ${
                          isNearRetirement ? 'text-rose-500 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'
                        }`}>
                          {usagePercent}%
                        </span>
                      </div>

                      {/* Thin progress bar for shoe mileage */}
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isNearRetirement 
                              ? 'bg-rose-500' 
                              : 'bg-cyan-500'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>

                      {isNearRetirement && (
                        <div className="flex items-center space-x-1 text-[10px] text-rose-500 dark:text-rose-400 pt-0.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{t('shoe_warning')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit Gear */}
      {isModalOpen && (
        <div 
          id="gear-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingGear ? (language === 'id' ? 'Edit Perlengkapan' : 'Edit Gear') : (language === 'id' ? 'Tambah Perlengkapan Baru' : 'Add New Gear')}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('gear_category')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GearCategory)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer"
                >
                  <option value="Sepatu">{language === 'id' ? 'Sepatu (Shoe Mileage Tracked)' : 'Shoes (Shoe Mileage Tracked)'}</option>
                  <option value="Jam">{language === 'id' ? 'Jam (Smartwatch)' : 'Watch (Smartwatch)'}</option>
                  <option value="Baju">{language === 'id' ? 'Baju (Running Apparel)' : 'Apparel (Running Apparel)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('gear_name')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'id' ? 'Contoh: Nike ZoomX Vaporfly Next% 3' : 'E.g., Nike ZoomX Vaporfly Next% 3'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('gear_image_url')}
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('initial_mileage')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={initialDistance}
                    onChange={(e) => setInitialDistance(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  />
                </div>

                {category === 'Sepatu' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('max_lifespan')}
                    </label>
                    <input
                      type="number"
                      min="100"
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="gear-active-checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-cyan-500 cursor-pointer"
                />
                <label htmlFor="gear-active-checkbox" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  {t('gear_active_status')}
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? t('saving') : (editingGear ? t('save') : (language === 'id' ? 'Simpan Perlengkapan' : 'Save Gear'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

