import React, { useState } from 'react';
import { FruitItem, UnitType } from '../types';
import {
  handleDevanagariChange,
  handleDevanagariKeyDown,
  handleDevanagariBlur,
  transliterateSentence,
  forceTransliterate,
  autoTranslateFruit,
} from '../utils/nepaliTransliterate';
import { COMMON_FRUIT_PRESETS, AVAILABLE_UNITS, FruitPreset } from '../utils/fruitPresets';
import { Boxes, Plus, Search, Trash2, CheckCircle2, Layers, ArrowUpRight } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface StockManagerProps {
  fruits: FruitItem[];
  onUpdateStock: (fruitId: string, delta: number) => void;
  onAddFruit: (fruit: FruitItem) => void;
  onSetStockQuantity?: (fruitId: string, quantity: number) => void;
  onDeleteFruit?: (fruitId: string) => void;
}

export const StockManager: React.FC<StockManagerProps> = ({
  fruits,
  onUpdateStock,
  onAddFruit,
  onSetStockQuantity,
  onDeleteFruit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for adding new fruit (Only Name, Unit, Initial Number - NO price, NO origin)
  const [selectedPreset, setSelectedPreset] = useState<FruitPreset | null>(null);
  const [nameNepali, setNameNepali] = useState('');
  const [nameEnglish, setNameEnglish] = useState('');
  const [unit, setUnit] = useState<UnitType>('क्यारेट');
  const [stockNumber, setStockNumber] = useState<number>(50);
  const [emoji, setEmoji] = useState('🍎');

  // Direct editing of stock number inside card
  const [editingFruitId, setEditingFruitId] = useState<string | null>(null);
  const [tempQty, setTempQty] = useState<string>('');

  const filteredFruits = fruits.filter((f) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const termDev = transliterateSentence(term).toLowerCase();
    const translated = autoTranslateFruit(term);
    const transNp = translated.nepaliName.toLowerCase();
    const transEn = translated.englishName.toLowerCase();

    const fnNp = (f.nameNepali || '').toLowerCase();
    const fnEn = (f.nameEnglish || '').toLowerCase();

    return (
      fnNp.includes(term) ||
      fnNp.includes(termDev) ||
      (transNp && fnNp.includes(transNp)) ||
      fnEn.includes(term) ||
      (transEn && fnEn.includes(transEn))
    );
  });

  const totalStockItemsCount = fruits.reduce((acc, f) => acc + (f.stockQuantity || 0), 0);

  // Quick 1-click add from preset list
  const handleQuickAddPreset = (preset: FruitPreset) => {
    haptic.medium();
    const existing = fruits.find(
      (f) =>
        f.nameNepali.trim().toLowerCase() === preset.nameNepali.trim().toLowerCase() ||
        (f.nameEnglish && f.nameEnglish.toLowerCase().includes(preset.nameNepali.toLowerCase()))
    );

    if (existing) {
      // Just increase stock by 50 or inform user
      onUpdateStock(existing.id, 50);
      return;
    }

    const newItem: FruitItem = {
      id: `fruit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nameNepali: preset.nameNepali,
      nameEnglish: preset.nameEnglish,
      category: preset.nameNepali,
      stockQuantity: 50, // default starting number
      unit: preset.defaultUnit,
      imageEmoji: preset.emoji,
      lastUpdated: '२०८१-०६-०३',
      costPrice: 0,
      sellingPrice: 1,
    };

    onAddFruit(newItem);
  };

  // Open modal with preselected fruit
  const handleSelectPresetForModal = (preset: FruitPreset) => {
    setSelectedPreset(preset);
    setNameNepali(preset.nameNepali);
    setNameEnglish(preset.nameEnglish);
    setEmoji(preset.emoji);
    setUnit(preset.defaultUnit);
  };

  const handleAddNewFruit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalNepali = forceTransliterate(nameNepali.trim());
    let finalEnglish = nameEnglish.trim();

    if (!finalNepali && finalEnglish) {
      const translated = autoTranslateFruit(finalEnglish);
      finalNepali = translated.nepaliName;
    }
    if (!finalEnglish && finalNepali) {
      const translated = autoTranslateFruit(finalNepali);
      finalEnglish = translated.englishName;
    }
    if (!finalNepali) return;

    const newItem: FruitItem = {
      id: `fruit-${Date.now()}`,
      nameNepali: finalNepali,
      nameEnglish: finalEnglish || finalNepali,
      category: finalNepali,
      stockQuantity: Math.max(0, Number(stockNumber) || 0),
      unit: unit,
      imageEmoji: emoji || '🍎',
      lastUpdated: '२०८१-०६-०३',
      costPrice: 0,
      sellingPrice: 1,
    };

    onAddFruit(newItem);
    haptic.success();
    setIsAddModalOpen(false);

    // Reset form
    setSelectedPreset(null);
    setNameNepali('');
    setNameEnglish('');
    setStockNumber(50);
    setEmoji('🍎');
  };

  const handleDirectQuantitySave = (fruitId: string) => {
    const val = parseInt(tempQty, 10);
    if (!isNaN(val) && val >= 0) {
      if (onSetStockQuantity) {
        onSetStockQuantity(fruitId, val);
      } else {
        const current = fruits.find((f) => f.id === fruitId)?.stockQuantity || 0;
        onUpdateStock(fruitId, val - current);
      }
      haptic.light();
    }
    setEditingFruitId(null);
    setTempQty('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* ----------------------------------------------------------------- */}
      {/* Top Overview Bar: Fruit Varieties & Total Numbers in Stock        */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="rounded-2xl bg-white border border-stone-200/90 shadow-xs p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium block">
              दर्ता भएका फलफूल प्रकार (Fruit Varieties)
            </span>
            <span className="text-2xl font-bold text-stone-900 mt-0.5 block">
              {fruits.length} प्रकार
            </span>
            <span className="text-[11px] text-stone-400">
              नरिवल, स्याउ, केरा लगायत थोक मण्डी सूची
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#007AFF] flex items-center justify-center border border-blue-100">
            <Boxes size={22} />
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-stone-200/90 shadow-xs p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium block">
              जम्मा मौज्दात संख्या (Total Stock Numbers)
            </span>
            <span className="text-2xl font-bold text-[#34C759] font-mono mt-0.5 block">
              {totalStockItemsCount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-stone-400">
              सबै फलफूलको कुल मौज्दात परिमाण
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#34C759] flex items-center justify-center border border-emerald-100">
            <Layers size={22} />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Fast 1-Click Fruit Presets Bar (Nariyal, Syau, Kela, etc.)        */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-2xl bg-white border border-stone-200/90 shadow-xs p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-800">
              ⚡ द्रुत फलफूल सूची (Quick 1-Click Fruit Presets)
            </span>
            <span className="text-[10px] text-stone-400 hidden sm:inline">
              (कुनै पनि फलफूलमा क्लिक गरी सिधै स्टक सूचीमा राख्नुहोस्)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedPreset(null);
              setNameNepali('');
              setNameEnglish('');
              setEmoji('🍎');
              setUnit('क्यारेट');
              setStockNumber(50);
              setIsAddModalOpen(true);
            }}
            className="text-xs font-bold text-[#007AFF] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>+ आफ्नै नयाँ फलफूल लेख्नुहोस्</span>
          </button>
        </div>

        {/* Scrollable list of common fruit items (Nariyal, Syau, Kela...) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
          {COMMON_FRUIT_PRESETS.map((preset) => {
            const alreadyInStock = fruits.some(
              (f) => f.nameNepali.trim().toLowerCase() === preset.nameNepali.trim().toLowerCase()
            );

            return (
              <button
                key={preset.nameNepali}
                type="button"
                onClick={() => {
                  if (alreadyInStock) {
                    onUpdateStock(
                      fruits.find(
                        (f) => f.nameNepali.trim().toLowerCase() === preset.nameNepali.trim().toLowerCase()
                      )!.id,
                      50
                    );
                    haptic.light();
                  } else {
                    handleQuickAddPreset(preset);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer active:scale-95 border ${
                  alreadyInStock
                    ? 'bg-blue-50 text-[#007AFF] border-blue-200 shadow-2xs hover:bg-blue-100'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 hover:border-[#007AFF]'
                }`}
                title={
                  alreadyInStock
                    ? `${preset.nameNepali} स्टकमा छ (+५० थप्न क्लिक गर्नुहोस्)`
                    : `${preset.nameNepali} नयाँ फलफूलको रूपमा स्टकमा थप्नुहोस्`
                }
              >
                <span className="text-base">{preset.emoji}</span>
                <span>{preset.nameNepali}</span>
                {alreadyInStock ? (
                  <span className="text-[10px] text-[#007AFF] font-mono font-bold">+५०</span>
                ) : (
                  <span className="text-[10px] text-stone-400 font-normal">({preset.defaultUnit})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Search & Add Action Header                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleDevanagariChange(e, setSearchTerm)}
            onKeyDown={(e) => handleDevanagariKeyDown(e, searchTerm, setSearchTerm)}
            onBlur={() => handleDevanagariBlur(searchTerm, setSearchTerm)}
            placeholder="स्टकमा खोज्नुहोस् (nariyal, syau, kela, नरिवल, स्याउ)..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#007AFF] shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedPreset(null);
            setNameNepali('');
            setNameEnglish('');
            setEmoji('🍎');
            setUnit('क्यारेट');
            setStockNumber(50);
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>+ नयाँ फलफूल थप्नुहोस् (Add Fruit Item)</span>
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Fruit Stocks Grid (Direct Number Adjustment, No Price/Origin)     */}
      {/* ----------------------------------------------------------------- */}
      {filteredFruits.length === 0 ? (
        <div className="rounded-2xl bg-white border border-stone-200 p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-3xl border border-amber-100">
            🥥
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-stone-900">
              स्टकमा कुनै फलफूल छैन (No Fruits in Stock)
            </h3>
            <p className="text-xs text-stone-500">
              माथिको द्रुत सूचीबाट नरिवल, स्याउ, केरा आदिमा क्लिक गर्नुहोस् वा नयाँ फलफूल दर्ता गर्नुहोस्।
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {COMMON_FRUIT_PRESETS.slice(0, 4).map((p) => (
              <button
                key={p.nameNepali}
                type="button"
                onClick={() => handleQuickAddPreset(p)}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#007AFF] text-xs font-semibold flex items-center gap-1 border border-blue-200 cursor-pointer"
              >
                <span>{p.emoji}</span>
                <span>{p.nameNepali} +</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredFruits.map((fruit) => {
            const isEditingThis = editingFruitId === fruit.id;

            return (
              <div
                key={fruit.id}
                className="rounded-2xl bg-white border border-stone-200/90 shadow-xs p-4 flex flex-col justify-between space-y-3.5 hover:border-[#007AFF]/50 transition-all group"
              >
                {/* Header: Emoji, Name, Unit, Delete */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl group-hover:scale-110 transition-transform select-none">
                        {fruit.imageEmoji || '🍎'}
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-tight">
                          {fruit.nameNepali}
                        </h3>
                        {fruit.nameEnglish && (
                          <p className="text-[11px] text-stone-400 font-sans mt-0.5">
                            {fruit.nameEnglish}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                        {fruit.unit}
                      </span>
                      {onDeleteFruit && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`के तपाईं '${fruit.nameNepali}' स्टकबाट हटाउन चाहनुहुन्छ?`)) {
                              onDeleteFruit(fruit.id);
                              haptic.warning();
                            }
                          }}
                          className="p-1 text-stone-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="हटाउनुहोस्"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Big Stock Number Display / Direct Input */}
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-500 font-medium">मौज्दात संख्या:</span>
                    {isEditingThis ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDirectQuantitySave(fruit.id)}
                          className="px-2 py-0.5 rounded-md bg-[#007AFF] text-white text-[10px] font-bold cursor-pointer"
                        >
                          ठीक छ
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFruitId(null)}
                          className="px-1.5 py-0.5 rounded-md text-stone-400 hover:text-stone-600 text-[10px] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFruitId(fruit.id);
                          setTempQty(String(fruit.stockQuantity));
                        }}
                        className="text-[10px] text-[#007AFF] hover:underline cursor-pointer"
                      >
                        संख्या फेर्नुहोस् ✎
                      </button>
                    )}
                  </div>

                  {isEditingThis ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={tempQty}
                        autoFocus
                        onChange={(e) => setTempQty(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleDirectQuantitySave(fruit.id);
                        }}
                        className="w-full px-2.5 py-1 rounded-lg bg-white border border-[#007AFF] font-mono font-bold text-lg text-stone-900 text-center focus:outline-none"
                      />
                      <span className="text-xs font-semibold text-stone-600 shrink-0">
                        {fruit.unit}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-2xl font-bold text-stone-900 tracking-tight">
                        {fruit.stockQuantity}
                      </span>
                      <span className="text-xs font-semibold text-stone-500">
                        {fruit.unit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Increment & Decrement Buttons */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        haptic.light();
                        onUpdateStock(fruit.id, -10);
                      }}
                      className="flex-1 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold font-mono transition-colors active:scale-95 cursor-pointer"
                      title="१० संख्या घटाउनुहोस्"
                    >
                      -१०
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.light();
                        onUpdateStock(fruit.id, 10);
                      }}
                      className="flex-1 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#007AFF] border border-blue-200 text-xs font-bold font-mono transition-colors active:scale-95 cursor-pointer"
                      title="१० संख्या थप्नुहोस्"
                    >
                      +१०
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.medium();
                        onUpdateStock(fruit.id, 50);
                      }}
                      className="flex-1 py-1 rounded-lg bg-[#007AFF] hover:bg-[#007AFF]/90 text-white text-xs font-bold font-mono transition-colors active:scale-95 cursor-pointer"
                      title="५० संख्या थप्नुहोस्"
                    >
                      +५०
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.medium();
                        onUpdateStock(fruit.id, 100);
                      }}
                      className="flex-1 py-1 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold font-mono transition-colors active:scale-95 cursor-pointer"
                      title="१०० संख्या थप्नुहोस्"
                    >
                      +१००
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Simplified Add Fruit Modal (No Cost Price, No Selling, No Origin) */}
      {/* ----------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-stone-200 p-5 sm:p-6 shadow-xl space-y-4 text-stone-900 my-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#007AFF] flex items-center justify-center border border-blue-100 font-bold">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900">
                    नयाँ फलफूल थप्नुहोस् (Add Fruit Item)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    फलफूलको नाम, एकाइ र सुरुवाती संख्या मात्र छान्नुहोस्
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets Selection inside modal */}
            <div className="space-y-1.5">
              <label className="block text-stone-600 text-xs font-semibold">
                १-क्लिकमा फलफूल छान्नुहोस् (Or Pick from List):
              </label>
              <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto p-1 border border-stone-100 rounded-xl bg-stone-50/50">
                {COMMON_FRUIT_PRESETS.map((preset) => {
                  const isSelected = nameNepali === preset.nameNepali;
                  return (
                    <button
                      key={preset.nameNepali}
                      type="button"
                      onClick={() => handleSelectPresetForModal(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#007AFF] text-white shadow-2xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:border-[#007AFF]'
                      }`}
                    >
                      <span>{preset.emoji}</span>
                      <span>{preset.nameNepali}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleAddNewFruit} className="space-y-3.5 text-xs">
              {/* Fruit Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    फलफूलको नाम (Nepali Name) *
                  </label>
                  <input
                    type="text"
                    value={nameNepali}
                    onChange={(e) => {
                      handleDevanagariChange(e, setNameNepali);
                      if (!nameEnglish.trim()) {
                        const tr = autoTranslateFruit(e.target.value);
                        if (tr.englishName && tr.englishName !== e.target.value) {
                          setNameEnglish(tr.englishName);
                        }
                      }
                    }}
                    onKeyDown={(e) => handleDevanagariKeyDown(e, nameNepali, setNameNepali)}
                    onBlur={() => {
                      handleDevanagariBlur(nameNepali, setNameNepali);
                      if (!nameEnglish.trim() && nameNepali.trim()) {
                        const tr = autoTranslateFruit(nameNepali);
                        if (tr.englishName) setNameEnglish(tr.englishName);
                      }
                    }}
                    placeholder="जस्तै: नरिवल, स्याउ, केरा"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-[#007AFF]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    अंग्रेजी नाम (English Name - optional)
                  </label>
                  <input
                    type="text"
                    value={nameEnglish}
                    onChange={(e) => setNameEnglish(e.target.value)}
                    placeholder="e.g. Coconut, Apple, Banana"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-[#007AFF] font-sans"
                  />
                </div>
              </div>

              {/* Unit, Initial Number & Emoji */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">
                    इकाइ (Unit)
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as UnitType)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-[#007AFF]"
                  >
                    {AVAILABLE_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">
                    सुरुवाती संख्या (Stock)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stockNumber}
                    onChange={(e) => setStockNumber(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-mono text-center font-bold focus:outline-none focus:border-[#007AFF]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">
                    इमोजी (Emoji)
                  </label>
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 text-center text-lg focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              {/* Helpful notice */}
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-stone-600">
                💡 <strong className="text-[#007AFF]">कुनै मूल्य वा उत्पत्तिको झन्झट छैन:</strong> मालिक वा स्टाफले बिल काट्दा १ को दर तोकेर सीधै बिल बनाउन सक्नुहुन्छ।
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold transition-colors cursor-pointer"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  स्टकमा दर्ता गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
