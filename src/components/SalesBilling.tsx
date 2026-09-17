import React, { useState, useMemo, useCallback } from 'react';
import { FruitItem, Party, SaleBill, BillItem, UnitType } from '../types';
import {
  handleDevanagariChange,
  handleDevanagariBlur,
  handleDevanagariKeyDown,
  transliterateSentence,
  forceTransliterate,
  autoTranslateFruit,
} from '../utils/nepaliTransliterate';
import { COMMON_FRUIT_PRESETS, AVAILABLE_UNITS, FruitPreset } from '../utils/fruitPresets';
import { EasyDatePicker } from './EasyDatePicker';
import { haptic } from '../utils/haptics';
import {
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
  Search,
  CheckCircle2,
  Users,
  UserPlus,
  UserCheck,
  History,
  X,
  Boxes,
  FileText,
  Flame,
  Wallet,
  Calendar,
  Check,
  Grid3X3,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SalesBillingProps {
  fruits: FruitItem[];
  parties: Party[];
  onSaveBill: (bill: SaleBill) => void;
  onViewInvoice: (bill: SaleBill) => void;
  onAddParty?: (party: Party) => void;
  recentBills: SaleBill[];
}

export const SalesBilling: React.FC<SalesBillingProps> = ({
  fruits,
  parties,
  onSaveBill,
  onViewInvoice,
  onAddParty,
  recentBills,
}) => {
  // ---------------------------------------------------------------------------
  // 1. Party / Customer Selection State (Simple & Fast for Owner)
  // ---------------------------------------------------------------------------
  const [partyMode, setPartyMode] = useState<'existing' | 'new' | 'walkin'>(
    parties.length > 0 ? 'existing' : 'walkin'
  );
  const [selectedPartyId, setSelectedPartyId] = useState<string>(parties[0]?.id || '');
  const [partySearch, setPartySearch] = useState<string>('');

  // New Party input fields
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyAddress, setNewPartyAddress] = useState('');

  // Walk-in customer input fields
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinAddress, setWalkinAddress] = useState('');

  // ---------------------------------------------------------------------------
  // 2. Fruit Search & Filtering State
  // ---------------------------------------------------------------------------
  const [fruitSearch, setFruitSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('सबै');

  // ---------------------------------------------------------------------------
  // 3. Bill Items (Quantity without kg or boxes)
  // ---------------------------------------------------------------------------
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  // ---------------------------------------------------------------------------
  // 4. Money Given & Checkout State
  // ---------------------------------------------------------------------------
  const [moneyGivenInput, setMoneyGivenInput] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [billDateBs, setBillDateBs] = useState<string>('२०८१-०६-०३');
  const [showBillDatePicker, setShowBillDatePicker] = useState<boolean>(false);
  const [fruitGridTab, setFruitGridTab] = useState<'all' | 'presets' | 'stock'>('all');
  const [isFruitGridExpanded, setIsFruitGridExpanded] = useState<boolean>(false);

  // Persistent 1-click popularity tracking (auto-arranges 1-click fruits based on user clicks)
  const [fruitClickCounts, setFruitClickCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('satyawati_fruit_clicks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const recordFruitClick = useCallback((fruitName: string) => {
    const norm = fruitName.trim().toLowerCase();
    setFruitClickCounts((prev) => {
      const next = { ...prev, [norm]: (prev[norm] || 0) + 1 };
      try {
        localStorage.setItem('satyawati_fruit_clicks', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Drawer for recent bills
  const [showRecentBillsDrawer, setShowRecentBillsDrawer] = useState(false);

  // ---------------------------------------------------------------------------
  // Search bar state for recent bills / old invoices
  // ---------------------------------------------------------------------------
  const [billSearch, setBillSearch] = useState<string>('');

  // Filtered Recent Bills (matches bill number, customer/party name in English or Devanagari, phone, or date)
  const filteredRecentBills = useMemo(() => {
    if (!billSearch.trim()) return recentBills;
    const q = billSearch.toLowerCase().trim();
    const qDev = transliterateSentence(q).toLowerCase();

    return recentBills.filter((b) => {
      const num = b.billNumber.toLowerCase();
      const cust = (b.customerName || '').toLowerCase();
      const phone = (b.customerPhone || '').toLowerCase();
      const dateBs = (b.dateBs || '').toLowerCase();
      const dateAd = (b.dateAd || '').toLowerCase();

      return (
        num.includes(q) ||
        cust.includes(q) ||
        cust.includes(qDev) ||
        phone.includes(q) ||
        dateBs.includes(q) ||
        dateAd.includes(q)
      );
    });
  }, [recentBills, billSearch]);

  // ---------------------------------------------------------------------------
  // Dynamic Fruit Billing Preference / Popularity Engine
  // Shuffles frequently billed fruits right to the top/earliest positions!
  // ---------------------------------------------------------------------------
  const fruitPreferenceStats = useMemo(() => {
    const stats: Record<string, { billCount: number; totalSold: number }> = {};
    for (const bill of recentBills) {
      for (const item of bill.items) {
        if (!stats[item.fruitId]) {
          stats[item.fruitId] = { billCount: 0, totalSold: 0 };
        }
        stats[item.fruitId].billCount += 1;
        stats[item.fruitId].totalSold += item.quantity || 0;
      }
    }
    return stats;
  }, [recentBills]);

  // Filtered Parties (matches both English query and transliterated Devanagari)
  const filteredParties = useMemo(() => {
    if (!partySearch.trim()) return parties;
    const q = partySearch.toLowerCase().trim();
    const qDev = transliterateSentence(q).toLowerCase();
    return parties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(qDev) ||
        p.phone.includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(qDev)
    );
  }, [parties, partySearch]);

  const selectedParty = parties.find((p) => p.id === selectedPartyId);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(fruits.map((f) => f.category));
    return ['सबै', ...Array.from(set)];
  }, [fruits]);

  // Filtered & Shuffled Fruits list (matches English, Nepali, transliteration and translation)
  const filteredFruits = useMemo(() => {
    const q = fruitSearch.toLowerCase().trim();
    const qDev = transliterateSentence(q).toLowerCase();
    const translated = autoTranslateFruit(q);
    const transNp = translated.nepaliName.toLowerCase();
    const transEn = translated.englishName.toLowerCase();

    let list = fruits.filter((f) => {
      const matchesCat = selectedCategory === 'सबै' || f.category === selectedCategory;
      const fnNp = f.nameNepali.toLowerCase();
      const fnEn = f.nameEnglish.toLowerCase();
      const fCat = f.category.toLowerCase();

      const matchesSearch =
        !q ||
        fnNp.includes(q) ||
        fnNp.includes(qDev) ||
        (transNp && fnNp.includes(transNp)) ||
        fnEn.includes(q) ||
        (transEn && fnEn.includes(transEn)) ||
        fCat.includes(q) ||
        fCat.includes(qDev);

      return matchesCat && matchesSearch;
    });

    // Professionally arrange the fruits automatically:
    // 1. If searching, prioritize items that start with search query
    // 2. Prioritize available in-stock items over zero-stock items
    // 3. Prioritize high-demand / most billed items first for rapid 1-click billing
    // 4. Natural Devanagari locale ordering
    list = [...list].sort((a, b) => {
      if (q) {
        const aStarts =
          a.nameNepali.toLowerCase().startsWith(q) ||
          a.nameEnglish.toLowerCase().startsWith(q) ||
          a.nameNepali.toLowerCase().startsWith(qDev);
        const bStarts =
          b.nameNepali.toLowerCase().startsWith(q) ||
          b.nameEnglish.toLowerCase().startsWith(q) ||
          b.nameNepali.toLowerCase().startsWith(qDev);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
      }

      // Prioritize available in-stock items
      const aInStock = a.stockQuantity > 0 ? 1 : 0;
      const bInStock = b.stockQuantity > 0 ? 1 : 0;
      if (bInStock !== aInStock) {
        return bInStock - aInStock;
      }

      // Prioritize high-demand / popular wholesale fruits
      const statsA = fruitPreferenceStats[a.id] || { billCount: 0, totalSold: 0 };
      const statsB = fruitPreferenceStats[b.id] || { billCount: 0, totalSold: 0 };
      if (statsB.billCount !== statsA.billCount) {
        return statsB.billCount - statsA.billCount;
      }
      if (statsB.totalSold !== statsA.totalSold) {
        return statsB.totalSold - statsA.totalSold;
      }

      return a.nameNepali.localeCompare(b.nameNepali, 'ne');
    });

    return list;
  }, [fruits, selectedCategory, fruitSearch, fruitPreferenceStats]);

  // ---------------------------------------------------------------------------
  // 1-Click Popularity Engine (Auto-arranges 1-click fruit section by most clicked/billed)
  // ---------------------------------------------------------------------------
  const getFruitPopularityScore = useCallback(
    (nameNepali: string) => {
      const norm = nameNepali.trim().toLowerCase();
      const clicks = fruitClickCounts[norm] || 0;
      let billHits = 0;
      for (const bill of recentBills) {
        for (const it of bill.items) {
          if (it.fruitName.trim().toLowerCase() === norm) {
            billHits += it.quantity || 1;
          }
        }
      }
      return clicks * 3 + billHits;
    },
    [fruitClickCounts, recentBills]
  );

  // Filter presets based on search query (matches Nepali name, English name, or roman transliteration)
  // And AUTO-ARRANGE strictly for this 1-click section by most clicked/used fruits!
  const filteredPresets = useMemo(() => {
    let list = COMMON_FRUIT_PRESETS;
    if (fruitSearch.trim()) {
      const q = fruitSearch.trim().toLowerCase();
      const qDev = transliterateSentence(q).toLowerCase();
      list = COMMON_FRUIT_PRESETS.filter((p) => {
        const np = p.nameNepali.toLowerCase();
        const en = p.nameEnglish.toLowerCase();
        return np.includes(q) || en.includes(q) || np.includes(qDev);
      });
    }

    return [...list].sort((a, b) => {
      const scoreA = getFruitPopularityScore(a.nameNepali);
      const scoreB = getFruitPopularityScore(b.nameNepali);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return COMMON_FRUIT_PRESETS.indexOf(a) - COMMON_FRUIT_PRESETS.indexOf(b);
    });
  }, [fruitSearch, getFruitPopularityScore]);

  // Extra fruits from inventory that are not already in common presets (also auto-arranged by popularity)
  const extraStockFruits = useMemo(() => {
    const presetNames = new Set(
      COMMON_FRUIT_PRESETS.map((p) => p.nameNepali.trim().toLowerCase())
    );
    const extras = filteredFruits.filter(
      (f) => !presetNames.has(f.nameNepali.trim().toLowerCase())
    );
    return [...extras].sort((a, b) => {
      const scoreA = getFruitPopularityScore(a.nameNepali);
      const scoreB = getFruitPopularityScore(b.nameNepali);
      return scoreB - scoreA;
    });
  }, [filteredFruits, getFruitPopularityScore]);

  // Sliced fruits for "View More" compact mobile display (default top 9 items = 3 rows of 3)
  const displayedPresets = useMemo(() => {
    if (fruitSearch.trim() || isFruitGridExpanded) {
      return filteredPresets;
    }
    return filteredPresets.slice(0, 9);
  }, [filteredPresets, fruitSearch, isFruitGridExpanded]);

  const displayedStockFruits = useMemo(() => {
    if (fruitSearch.trim() || isFruitGridExpanded) {
      return extraStockFruits;
    }
    if (fruitGridTab === 'stock') {
      return extraStockFruits.slice(0, 9);
    }
    if (displayedPresets.length >= 9) {
      return [];
    }
    return extraStockFruits.slice(0, Math.max(0, 9 - displayedPresets.length));
  }, [extraStockFruits, fruitGridTab, displayedPresets.length, fruitSearch, isFruitGridExpanded]);

  // Total and displayed count for View More toggle
  const totalFruitsInGrid =
    fruitGridTab === 'presets'
      ? filteredPresets.length
      : fruitGridTab === 'stock'
      ? extraStockFruits.length
      : filteredPresets.length + extraStockFruits.length;

  const displayedFruitsInGrid =
    fruitGridTab === 'presets'
      ? displayedPresets.length
      : fruitGridTab === 'stock'
      ? displayedStockFruits.length
      : displayedPresets.length + displayedStockFruits.length;

  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------
  const subtotal = billItems.reduce((acc, item) => acc + item.total, 0);
  const totalAmount = Math.max(0, subtotal - discount);

  // If moneyGiven is empty, default to totalAmount
  const parsedMoneyGiven =
    moneyGivenInput === '' ? totalAmount : Math.max(0, Number(moneyGivenInput) || 0);
  const changeToReturn = Math.max(0, parsedMoneyGiven - totalAmount);
  const dueAmount = Math.max(0, totalAmount - parsedMoneyGiven);
  const paidAmount = Math.min(totalAmount, parsedMoneyGiven);

  const paymentType: 'नगद' | 'उधारो' | 'आंशिक' =
    dueAmount === 0 ? 'नगद' : paidAmount === 0 ? 'उधारो' : 'आंशिक';

  // ---------------------------------------------------------------------------
  // Cart Actions: Simple 1-click fruit addition with popularity tracking
  // ---------------------------------------------------------------------------
  const handleAddFruit = (fruit: FruitItem) => {
    haptic.selection();
    recordFruitClick(fruit.nameNepali);
    const existingIndex = billItems.findIndex(
      (it) => it.fruitId === fruit.id || it.fruitName.trim().toLowerCase() === fruit.nameNepali.trim().toLowerCase()
    );
    if (existingIndex >= 0) {
      const updated = [...billItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].rate;
      setBillItems(updated);
    } else {
      const defaultRate = fruit.sellingPrice && fruit.sellingPrice > 0 ? fruit.sellingPrice : 1;
      setBillItems([
        ...billItems,
        {
          fruitId: fruit.id,
          fruitName: fruit.nameNepali,
          fruitNameEnglish: fruit.nameEnglish,
          unit: fruit.unit || 'क्यारेट',
          quantity: 1,
          rate: defaultRate,
          total: 1 * defaultRate,
        },
      ]);
    }
  };

  const handleAddPresetFruit = (preset: FruitPreset) => {
    haptic.selection();
    recordFruitClick(preset.nameNepali);
    const existingFruit = fruits.find(
      (f) => f.nameNepali.trim().toLowerCase() === preset.nameNepali.trim().toLowerCase()
    );
    if (existingFruit) {
      handleAddFruit(existingFruit);
      return;
    }

    const existingIndex = billItems.findIndex(
      (it) => it.fruitName.trim().toLowerCase() === preset.nameNepali.trim().toLowerCase()
    );
    if (existingIndex >= 0) {
      const updated = [...billItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].rate;
      setBillItems(updated);
    } else {
      setBillItems([
        ...billItems,
        {
          fruitId: `preset-${preset.nameNepali}-${Date.now()}`,
          fruitName: preset.nameNepali,
          fruitNameEnglish: preset.nameEnglish,
          unit: preset.defaultUnit,
          quantity: 1,
          rate: 1,
          total: 1,
        },
      ]);
    }
  };

  const handleUpdateUnit = (index: number, newUnit: UnitType) => {
    haptic.light();
    const updated = [...billItems];
    updated[index].unit = newUnit;
    setBillItems(updated);
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    const updated = [...billItems];
    const qty = Math.max(0, newQty);
    updated[index].quantity = qty;
    updated[index].total = qty * updated[index].rate;
    setBillItems(updated);
  };

  const handleBlurQuantity = (index: number) => {
    const updated = [...billItems];
    if (!updated[index].quantity || updated[index].quantity <= 0) {
      updated[index].quantity = 1;
      updated[index].total = 1 * updated[index].rate;
      setBillItems(updated);
    }
  };

  const handleQuickAddQuantity = (index: number, addAmount: number) => {
    haptic.light();
    const updated = [...billItems];
    const current = updated[index].quantity || 0;
    const newQty = current + addAmount;
    updated[index].quantity = newQty;
    updated[index].total = newQty * updated[index].rate;
    setBillItems(updated);
  };

  const handleUpdateRate = (index: number, newRate: number) => {
    const updated = [...billItems];
    const r = Math.max(0, newRate);
    updated[index].rate = r;
    updated[index].total = updated[index].quantity * r;
    setBillItems(updated);
  };

  const handleBlurRate = (index: number) => {
    const updated = [...billItems];
    if (typeof updated[index].rate !== 'number' || updated[index].rate < 0) {
      const origFruit = fruits.find((f) => f.id === updated[index].fruitId);
      updated[index].rate = origFruit?.sellingPrice && origFruit.sellingPrice > 0 ? origFruit.sellingPrice : 1;
      updated[index].total = updated[index].quantity * updated[index].rate;
      setBillItems(updated);
    }
  };

  const handleRemoveItem = (index: number) => {
    haptic.medium();
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const handleClearBill = () => {
    haptic.warning();
    setBillItems([]);
    setMoneyGivenInput('');
    setDiscount(0);
    setNotes('');
  };

  // ---------------------------------------------------------------------------
  // Complete & Print Bill
  // ---------------------------------------------------------------------------
  const handlePrintBill = () => {
    if (billItems.length === 0) return;

    // Trigger distinctive tactile success vibration for saving bill
    haptic.success();

    let customerName = 'खुद्रा ग्राहक (Walk-in)';
    let customerPhone = '';
    let customerAddress = 'बुटवल';
    let customerId: string | undefined = undefined;

    if (partyMode === 'existing') {
      if (selectedParty) {
        customerName = selectedParty.name;
        customerPhone = selectedParty.phone;
        customerAddress = selectedParty.address;
        customerId = selectedParty.id;
      }
    } else if (partyMode === 'new') {
      const trimmed = newPartyName.trim();
      if (!trimmed) return;
      customerName = forceTransliterate(trimmed);
      customerPhone = newPartyPhone.trim();
      customerAddress = forceTransliterate(newPartyAddress.trim() || 'बुटवल');
      const newPartyId = `party-${Date.now()}`;
      customerId = newPartyId;

      if (onAddParty) {
        onAddParty({
          id: newPartyId,
          name: customerName,
          phone: customerPhone || 'सम्पर्क उपलब्ध छैन',
          address: customerAddress,
          type: 'खुद्रे_ग्राहक',
          balance: 0,
        });
      }
    } else {
      customerName = walkinName.trim() ? forceTransliterate(walkinName.trim()) : 'खुद्रा ग्राहक (Walk-in)';
      customerPhone = walkinPhone.trim();
      customerAddress = walkinAddress.trim() ? forceTransliterate(walkinAddress.trim()) : 'बुटवल';
    }

    const billNumber = `ST-BL-${String(recentBills.length + 1).padStart(4, '0')}`;

    const newBill: SaleBill = {
      id: `bill-${Date.now()}`,
      billNumber,
      dateBs: billDateBs || '२०८१-०६-०३',
      dateAd: new Date().toISOString().split('T')[0],
      customerName,
      customerPhone,
      customerAddress,
      customerId,
      items: billItems,
      subtotal,
      discount,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentType,
      status: 'सम्पन्न',
      notes: notes.trim() ? forceTransliterate(notes.trim()) : undefined,
    };

    onSaveBill(newBill);
    onViewInvoice(newBill);

    // Reset bill fields
    setBillItems([]);
    setMoneyGivenInput('');
    setDiscount(0);
    setNotes('');
    if (partyMode === 'new') {
      setNewPartyName('');
      setNewPartyPhone('');
      setNewPartyAddress('');
      setPartyMode('existing');
    } else if (partyMode === 'walkin') {
      setWalkinName('');
      setWalkinPhone('');
      setWalkinAddress('');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* ----------------------------------------------------------------- */}
      {/* Top Header Bar: Fast Actions & Recent Bills Search                */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-2xl bg-white border border-stone-200/90 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-bold flex-shrink-0">
              <Receipt size={18} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#1C1C1E] flex items-center gap-2">
                <span>थोक बिक्री बिल (Sales Billing)</span>
              </h1>
              <p className="text-[11px] text-[#8E8E93]">
                मालिक द्रुत बिलिङ प्रणाली: १. पार्टी छान्नुहोस् → २. फलफूल थिच्नुहोस् → ३. प्रिन्ट गर्नुहोस्
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {billItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearBill}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                खाली गर्नुहोस्
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setShowBillDatePicker(!showBillDatePicker);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                showBillDatePicker
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200/90'
              }`}
              title="बिलको मिति परिवर्तन गर्न थिच्नुहोस्"
            >
              <Calendar size={13} className={showBillDatePicker ? 'text-white' : 'text-amber-600'} />
              <span>बिल मिति: {billDateBs}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRecentBillsDrawer(true)}
              className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-[#1C1C1E] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <History size={14} className="text-[#007AFF]" />
              <span>पछिल्ला बिलहरू ({recentBills.length})</span>
            </button>
          </div>
        </div>

        {/* Expandable Easy Date Picker for Bill Date */}
        {showBillDatePicker && (
          <div className="p-3 bg-white rounded-2xl border border-amber-300 shadow-md animate-in fade-in duration-150 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-800">
                बिल जारी गर्ने मिति (Invoice Issue Date)
              </span>
              <button
                type="button"
                onClick={() => setShowBillDatePicker(false)}
                className="text-[11px] text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
              >
                बन्द गर्नुहोस् (Close)
              </button>
            </div>
            <EasyDatePicker
              value={billDateBs}
              onChange={(d) => {
                setBillDateBs(d);
              }}
              label="बिक्री मिति (वि.सं.)"
              required
            />
          </div>
        )}

        {/* Top Search Bar to Filter Recent Bills by Party Name or Bill Number */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={billSearch}
              onChange={(e) => handleDevanagariChange(e, setBillSearch)}
              onKeyDown={(e) => handleDevanagariKeyDown(e, billSearch, setBillSearch)}
              onBlur={() => handleDevanagariBlur(billSearch, setBillSearch)}
              placeholder="पुरानो बिल खोज्नुहोस्: बिल नं. (ST-001) वा पार्टीको नाम (राम, श्याम, बुटवल)..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-stone-50 hover:bg-stone-100/80 focus:bg-white border border-stone-200 text-xs text-[#1C1C1E] placeholder:text-stone-400 focus:outline-none focus:border-[#007AFF] shadow-2xs transition-all"
            />
            <div className="absolute right-2.5 flex items-center gap-1.5">
              {billSearch && (
                <button
                  type="button"
                  onClick={() => setBillSearch('')}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 cursor-pointer"
                  title="हटाउनुहोस्"
                >
                  <X size={14} />
                </button>
              )}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-200/70 text-stone-600 font-mono">
                {filteredRecentBills.length} बिल
              </span>
            </div>
          </div>

          {/* Instant Search Results Panel when searching */}
          {billSearch.trim() && (
            <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-xl space-y-2 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between px-1 pb-1 border-b border-stone-100 text-[11px] text-stone-500 font-medium">
                <span>खोजी नतिजा ({filteredRecentBills.length} फेला परे):</span>
                <button
                  type="button"
                  onClick={() => setShowRecentBillsDrawer(true)}
                  className="text-[#007AFF] hover:underline font-bold cursor-pointer"
                >
                  विस्तृत सूचीमा हेर्नुहोस् →
                </button>
              </div>

              {filteredRecentBills.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  "{billSearch}" सँग मिल्ने कुनै बिल फेला परेन।
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredRecentBills.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onViewInvoice(b)}
                      className="p-2.5 rounded-xl bg-stone-50 hover:bg-blue-50/70 border border-stone-200/80 hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between gap-1.5 group shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#007AFF] font-mono group-hover:underline flex items-center gap-1">
                          <Receipt size={12} />
                          {b.billNumber}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {b.dateBs}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-900 truncate max-w-[140px]">
                          {b.customerName}
                        </span>
                        <span className="font-mono font-bold text-stone-900">
                          रु. {b.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-stone-200/60">
                        <span className="text-stone-500">{b.items.length} आइटम</span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            b.dueAmount === 0
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {b.dueAmount === 0 ? 'चुक्ता' : `बाँकी: रु. ${b.dueAmount.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Step 1: Customer / Party Selection                                */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-2xl bg-white border border-stone-200/90 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
              १
            </span>
            <h2 className="text-sm font-bold text-[#1C1C1E]">
              पार्टी वा ग्राहक छनोट (Customer / Party)
            </h2>
          </div>

          {/* Simple Mode Selector */}
          <div className="grid grid-cols-3 sm:flex sm:items-center p-1 rounded-xl bg-stone-100 border border-stone-200/80 w-full md:w-auto shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setPartyMode('existing')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap text-center ${
                partyMode === 'existing'
                  ? 'bg-white text-[#007AFF] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users size={13} className="shrink-0" />
              <span>दर्ता पार्टी <span className="hidden sm:inline text-[10px] font-normal opacity-70">(Party)</span></span>
            </button>
            <button
              type="button"
              onClick={() => setPartyMode('new')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap text-center ${
                partyMode === 'new'
                  ? 'bg-white text-[#007AFF] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserPlus size={13} className="shrink-0" />
              <span>नयाँ पार्टी <span className="hidden sm:inline text-[10px] font-normal opacity-70">(New)</span></span>
            </button>
            <button
              type="button"
              onClick={() => setPartyMode('walkin')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap text-center ${
                partyMode === 'walkin'
                  ? 'bg-white text-[#007AFF] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck size={13} className="shrink-0" />
              <span>खुद्रा ग्राहक <span className="hidden sm:inline text-[10px] font-normal opacity-70">(Walk-in)</span></span>
            </button>
          </div>
        </div>

        {/* Registered Party Selection */}
        {partyMode === 'existing' && (
          <div className="space-y-2.5">
            {parties.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>हाल कुनै पार्टी दर्ता भएको छैन। नयाँ पार्टी थप्न दायाँ बटन थिच्नुहोस्।</span>
                <button
                  type="button"
                  onClick={() => setPartyMode('new')}
                  className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px]"
                >
                  + पार्टी थप्नुहोस्
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                <div className="md:col-span-5 relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={partySearch}
                    onChange={(e) => handleDevanagariChange(e, setPartySearch)}
                    onKeyDown={(e) => handleDevanagariKeyDown(e, partySearch, setPartySearch)}
                    onBlur={() => handleDevanagariBlur(partySearch, setPartySearch)}
                    placeholder="पार्टी नाम वा फोन खोज्नुहोस्..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-[#1C1C1E] focus:bg-white focus:outline-none focus:border-[#007AFF]"
                  />
                </div>

                <div className="md:col-span-7">
                  <select
                    value={selectedPartyId}
                    onChange={(e) => setSelectedPartyId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm font-medium text-[#1C1C1E] focus:bg-white focus:outline-none focus:border-[#007AFF]"
                  >
                    {filteredParties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.address} (फोन: {p.phone}) | {p.balance >= 0 ? `बाँकी लिनु: रु. ${p.balance.toLocaleString('en-IN')}` : `तिर्नु: रु. ${Math.abs(p.balance).toLocaleString('en-IN')}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Selected Party Summary Bar */}
            {selectedParty && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[#007AFF]">{selectedParty.name}</span>
                  <span className="text-stone-400">|</span>
                  <span className="text-stone-600">📞 {selectedParty.phone}</span>
                  <span className="text-stone-400">|</span>
                  <span className="text-stone-600">📍 {selectedParty.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-500">खाता बक्यौता:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                      selectedParty.balance > 0
                        ? 'bg-amber-100 text-amber-800'
                        : selectedParty.balance < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedParty.balance >= 0
                      ? `लिन बाँकी: रु. ${selectedParty.balance.toLocaleString('en-IN')}`
                      : `अग्रिम: रु. ${Math.abs(selectedParty.balance).toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add New Party Fields */}
        {partyMode === 'new' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                पार्टीको नाम (Party Name) *
              </label>
              <input
                type="text"
                value={newPartyName}
                onChange={(e) => handleDevanagariChange(e, setNewPartyName)}
                onKeyDown={(e) => handleDevanagariKeyDown(e, newPartyName, setNewPartyName)}
                onBlur={() => handleDevanagariBlur(newPartyName, setNewPartyName)}
                placeholder="जस्तै: जनक किराना एण्ड फ्रुट सेन्टर"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                मोबाइल नम्बर (Phone)
              </label>
              <input
                type="text"
                value={newPartyPhone}
                onChange={(e) => setNewPartyPhone(e.target.value)}
                placeholder="९८४७००००००"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ठेगाना (Address)
              </label>
              <input
                type="text"
                value={newPartyAddress}
                onChange={(e) => handleDevanagariChange(e, setNewPartyAddress)}
                onKeyDown={(e) => handleDevanagariKeyDown(e, newPartyAddress, setNewPartyAddress)}
                onBlur={() => handleDevanagariBlur(newPartyAddress, setNewPartyAddress)}
                placeholder="बुटवल हाटबजार / भैरहवा"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
              />
            </div>
          </div>
        )}

        {/* Walk-in Customer Fields */}
        {partyMode === 'walkin' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ग्राहकको नाम (Customer Name)
                </label>
                <input
                  type="text"
                  value={walkinName}
                  onChange={(e) => handleDevanagariChange(e, setWalkinName)}
                  onKeyDown={(e) => handleDevanagariKeyDown(e, walkinName, setWalkinName)}
                  onBlur={() => handleDevanagariBlur(walkinName, setWalkinName)}
                  placeholder="सामान्य खुद्रा ग्राहक (वैकल्पिक)"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-[#1C1C1E] focus:bg-white focus:outline-none focus:border-[#007AFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  सम्पर्क नम्बर (Phone - optional)
                </label>
                <input
                  type="text"
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  placeholder="९८४७००००००"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-[#1C1C1E] focus:bg-white focus:outline-none focus:border-[#007AFF] font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ठेगाना / स्थान (Address)
                </label>
                <input
                  type="text"
                  value={walkinAddress}
                  onChange={(e) => handleDevanagariChange(e, setWalkinAddress)}
                  onKeyDown={(e) => handleDevanagariKeyDown(e, walkinAddress, setWalkinAddress)}
                  onBlur={() => handleDevanagariBlur(walkinAddress, setWalkinAddress)}
                  placeholder="बुटवल / स्थानीय"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-[#1C1C1E] focus:bg-white focus:outline-none focus:border-[#007AFF]"
                />
              </div>
            </div>

            {/* Walk-in Customer Info Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs">
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="font-bold flex items-center gap-1.5">
                  <UserCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>{walkinName.trim() || 'सामान्य खुद्रा ग्राहक (Walk-in Customer)'}</span>
                </span>
                <span className="text-emerald-300">|</span>
                <span className="text-emerald-700 text-[11px]">
                  📍 {walkinAddress.trim() || 'बुटवल'} {walkinPhone ? `• 📞 ${walkinPhone}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-white/90 px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                <span>नगद / QR बिक्री</span>
                <span className="text-emerald-400">•</span>
                <span className="text-emerald-600 font-semibold">उधारो खाता आवश्यक नपर्ने</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Step 2: Fruit Picker (Auto-Shuffles Most Popular / Preferred First)*/}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-2xl bg-white border border-stone-200/90 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Header with Preference Shuffling Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-[11px] font-bold">
              २
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#1C1C1E]">
                फलफूल छनोट (Fruit Catalog)
              </h2>
              <p className="text-[11px] text-[#8E8E93]">
                १-क्लिकमा बिलमा थप्नुहोस् • उपलब्ध तथा अधिक माग भएका फलफूलहरू स्वतः अगाडि व्यवस्थित छन्
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <Boxes size={14} className="text-stone-400" />
            <span>उपलब्ध: <strong className="text-stone-800 font-mono">{filteredFruits.length}</strong> फलफूल</span>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={fruitSearch}
                onChange={(e) => handleDevanagariChange(e, setFruitSearch)}
                onKeyDown={(e) => handleDevanagariKeyDown(e, fruitSearch, setFruitSearch)}
                onBlur={() => handleDevanagariBlur(fruitSearch, setFruitSearch)}
                placeholder="फलफूल खोज्नुहोस् (syau, kivi, स्याउ)..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-[#1C1C1E] focus:bg-white focus:outline-none focus:border-[#007AFF]"
              />
              {fruitSearch && (
                <button
                  type="button"
                  onClick={() => setFruitSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#007AFF] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* =============================================================== */}
          {/* ⚡ 1-Click Fruit Grid (Big Fruit Logos, Easy Tap, Grid View)     */}
          {/* =============================================================== */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1">
                    <Sparkles size={14} className="text-amber-500 fill-amber-500" />
                    <span>⚡ १-क्लिकमा फल थप्नुहोस् (1-Click Fruit Grid)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                    {filteredPresets.length} फलफूल
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  लोगोमा १ पटक थिच्नुहोस्, सिधै बिलमा संख्या (+१) थपिन्छ
                </p>
              </div>

              {/* View filter tabs */}
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setFruitGridTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    fruitGridTab === 'all'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  सबै फल
                </button>
                <button
                  type="button"
                  onClick={() => setFruitGridTab('presets')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    fruitGridTab === 'presets'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  मुख्य फल ({filteredPresets.length})
                </button>
                {extraStockFruits.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFruitGridTab('stock')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      fruitGridTab === 'stock'
                        ? 'bg-white text-stone-900 shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    थप स्टक ({extraStockFruits.length})
                  </button>
                )}
              </div>
            </div>

            {/* The 3-Column Mobile Fruit Grid (3 per row, next three down - No inner scroll) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-gradient-to-b from-stone-50/90 to-amber-50/30 border border-stone-200/90 shadow-2xs">
              {/* Presets Fruits (Guava Small, Guava Big, Kiwi, Papaya, Dragon Fruit, Apple, Banana, Coconut, Black/Green Grapes, etc.) */}
              {fruitGridTab !== 'stock' &&
                displayedPresets.map((preset) => {
                  const inCartItem = billItems.find(
                    (it) => it.fruitName.trim().toLowerCase() === preset.nameNepali.trim().toLowerCase()
                  );
                  const inCartCount = inCartItem?.quantity || 0;

                  // Check if this preset fruit exists in inventory stock for live price/stock
                  const stockFruit = fruits.find(
                    (f) => f.nameNepali.trim().toLowerCase() === preset.nameNepali.trim().toLowerCase()
                  );
                  const displayRate =
                    stockFruit?.sellingPrice && stockFruit.sellingPrice > 0
                      ? stockFruit.sellingPrice
                      : null;

                  return (
                    <button
                      key={preset.nameNepali}
                      type="button"
                      onClick={() => handleAddPresetFruit(preset)}
                      className={`relative p-2 rounded-xl border text-center flex flex-col items-center justify-between transition-all cursor-pointer active:scale-95 group select-none min-h-[94px] shadow-2xs ${
                        inCartCount > 0
                          ? 'bg-amber-50/95 border-amber-500 shadow-xs ring-2 ring-amber-400/60'
                          : 'bg-white hover:bg-amber-50/50 border-stone-200/90 hover:border-amber-400 hover:shadow-xs'
                      }`}
                      title={`१-क्लिकमा ${preset.nameNepali} बिलमा थप्नुहोस्`}
                    >
                      {/* Top-Right Counter Badge when in cart */}
                      {inCartCount > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-600 text-white font-mono font-bold text-[10px] shadow-xs flex items-center gap-0.5 animate-in zoom-in-75 z-10">
                          <Check size={10} className="stroke-[3]" />
                          <span>{inCartCount}</span>
                        </span>
                      )}

                      {/* Fruit Logo / Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-2xs transition-transform group-hover:scale-105 mb-1 ${
                          inCartCount > 0
                            ? 'bg-amber-100/90 border border-amber-300'
                            : 'bg-stone-50 group-hover:bg-amber-100/50 border border-stone-100'
                        }`}
                      >
                        {preset.emoji}
                      </div>

                      {/* Fruit Names */}
                      <div className="w-full text-center space-y-0.5">
                        <span className="block font-bold text-xs text-stone-900 leading-tight truncate">
                          {preset.nameNepali}
                        </span>
                        <span className="block text-[9px] text-stone-500 font-medium truncate">
                          {preset.nameEnglish.split('/')[0].trim()}
                        </span>
                      </div>

                      {/* Unit or Price Badge */}
                      <div className="mt-1 w-full flex items-center justify-center">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold truncate ${
                            inCartCount > 0
                              ? 'bg-amber-200/90 text-amber-950 font-bold'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {displayRate ? `रु.${displayRate}` : preset.defaultUnit}
                        </span>
                      </div>
                    </button>
                  );
                })}

              {/* Extra Stock Items (Custom Fruits added by owner in stock) */}
              {(fruitGridTab === 'all' || fruitGridTab === 'stock') &&
                displayedStockFruits.map((fruit) => {
                  const inCartItem = billItems.find(
                    (it) => it.fruitId === fruit.id || it.fruitName.trim().toLowerCase() === fruit.nameNepali.trim().toLowerCase()
                  );
                  const inCartCount = inCartItem?.quantity || 0;
                  const displayRate = fruit.sellingPrice && fruit.sellingPrice > 0 ? fruit.sellingPrice : 1;

                  return (
                    <button
                      key={fruit.id}
                      type="button"
                      onClick={() => handleAddFruit(fruit)}
                      className={`relative p-2 rounded-xl border text-center flex flex-col items-center justify-between transition-all cursor-pointer active:scale-95 group select-none min-h-[94px] shadow-2xs ${
                        inCartCount > 0
                          ? 'bg-amber-50/95 border-amber-500 shadow-xs ring-2 ring-amber-400/60'
                          : 'bg-white hover:bg-amber-50/50 border-stone-200/90 hover:border-amber-400 hover:shadow-xs'
                      }`}
                      title={`${fruit.nameNepali} - रु. ${displayRate} | स्टक: ${fruit.stockQuantity}`}
                    >
                      {inCartCount > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-600 text-white font-mono font-bold text-[10px] shadow-xs flex items-center gap-0.5 animate-in zoom-in-75 z-10">
                          <Check size={10} className="stroke-[3]" />
                          <span>{inCartCount}</span>
                        </span>
                      )}

                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-2xs transition-transform group-hover:scale-105 mb-1 ${
                          inCartCount > 0
                            ? 'bg-amber-100/90 border border-amber-300'
                            : 'bg-stone-50 group-hover:bg-amber-100/50 border border-stone-100'
                        }`}
                      >
                        {fruit.imageEmoji}
                      </div>

                      <div className="w-full text-center space-y-0.5">
                        <span className="block font-bold text-xs text-stone-900 leading-tight truncate">
                          {fruit.nameNepali}
                        </span>
                        <span className="block text-[9px] text-stone-500 font-medium truncate">
                          {fruit.nameEnglish ? fruit.nameEnglish.split('/')[0].trim() : fruit.category}
                        </span>
                      </div>

                      <div className="mt-1 w-full flex items-center justify-center">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold truncate ${
                            inCartCount > 0
                              ? 'bg-amber-200/90 text-amber-950 font-bold'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          रु.{displayRate}
                        </span>
                      </div>
                    </button>
                  );
                })}

              {/* Empty state if search returned no fruits */}
              {displayedFruitsInGrid === 0 && (fruitGridTab === 'presets' || extraStockFruits.length === 0) && (
                <div className="col-span-full py-8 px-4 text-center space-y-2 bg-white rounded-2xl border border-stone-200">
                  <span className="text-3xl block">🔍</span>
                  <p className="text-xs font-semibold text-stone-700">
                    "{fruitSearch}" नाम गरेको कुनै फलफूल भेटिएन।
                  </p>
                  <button
                    type="button"
                    onClick={() => setFruitSearch('')}
                    className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    खोज खाली गर्नुहोस् (Show All Fruits)
                  </button>
                </div>
              )}
            </div>

            {/* View More / Show Less Button for compact mobile scroll */}
            {!fruitSearch.trim() && totalFruitsInGrid > 9 && (
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setIsFruitGridExpanded((prev) => !prev);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-100/80 hover:bg-amber-100 active:bg-amber-200/80 text-amber-950 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-amber-300/80 shadow-2xs active:scale-[0.99]"
                >
                  {isFruitGridExpanded ? (
                    <>
                      <ChevronUp size={16} className="stroke-[2.5]" />
                      <span>थोरै देखाउनुहोस् (Show Less)</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} className="stroke-[2.5]" />
                      <span>
                        थप फलफूल हेर्नुहोस् (View More — {totalFruitsInGrid - displayedFruitsInGrid} थप फल)
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Bill Items List (Direct Numeric Typing, Fast & Responsive)      */}
        {/* --------------------------------------------------------------- */}
        <div className="pt-3 border-t border-stone-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-stone-900">
              📋 बिलमा थपिएका फलफूलहरू ({billItems.length})
            </h3>
            <span className="text-[11px] text-stone-500">
              * परिमाण बक्समा आफ्नो संख्या सिधै टाइप गर्नुहोस्
            </span>
          </div>

          <div className="space-y-2">
            {billItems.length === 0 ? (
              <div className="py-6 px-4 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center space-y-1">
                <p className="text-xs font-bold text-[#1C1C1E]">
                  कुनै फलफूल थपिएको छैन
                </p>
                <p className="text-[11px] text-[#8E8E93]">
                  माथिको फलफूल बटनहरूमा क्लिक गरी सिधै बिलमा राख्नुहोस्
                </p>
              </div>
            ) : (
              billItems.map((item, index) => (
                <div
                  key={`${item.fruitId}-${index}`}
                  className="p-3 rounded-xl bg-stone-50/80 border border-stone-200 flex flex-wrap items-center justify-between gap-3"
                >
                  {/* Fruit Name & Sub-details */}
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#1C1C1E]">
                        {item.fruitName}
                      </h4>
                      {item.fruitNameEnglish && (
                        <span className="text-[10px] text-stone-500 block">
                          {item.fruitNameEnglish}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity, Unit & Rate Controls */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity > 1) {
                            handleUpdateQuantity(index, item.quantity - 1);
                          } else {
                            handleRemoveItem(index);
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 hover:bg-stone-200 flex items-center justify-center font-bold active:scale-95 cursor-pointer"
                        title="१ ले घटाउनुहोस्"
                      >
                        <Minus size={12} />
                      </button>

                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateQuantity(index, val === '' ? 0 : parseFloat(val) || 0);
                        }}
                        onBlur={() => handleBlurQuantity(index)}
                        placeholder="परिमाण"
                        className="w-16 sm:w-20 px-1 py-0.5 text-center font-mono font-bold text-sm sm:text-base text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                      />

                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(index, (item.quantity || 0) + 1)}
                        className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 hover:bg-stone-200 flex items-center justify-center font-bold active:scale-95 cursor-pointer"
                        title="१ ले थप्नुहोस्"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Unit Selector Dropdown: No / Carat / Box / Any */}
                    <select
                      value={item.unit}
                      onChange={(e) => handleUpdateUnit(index, e.target.value as UnitType)}
                      className="px-2 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#007AFF] shadow-2xs cursor-pointer"
                      title="इकाइ (क्यारेट, कार्टुन, गोटा, बोरा आदि छान्नुहोस्)"
                    >
                      {AVAILABLE_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>

                    {/* Quick Wholesale Add Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAddQuantity(index, 10)}
                        className="px-2 py-1 rounded-lg bg-white border border-stone-200 hover:bg-blue-50 hover:text-[#007AFF] text-[11px] font-bold font-mono text-stone-700 cursor-pointer"
                        title="+१० संख्या थप्नुहोस्"
                      >
                        +१०
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAddQuantity(index, 50)}
                        className="px-2 py-1 rounded-lg bg-white border border-stone-200 hover:bg-blue-50 hover:text-[#007AFF] text-[11px] font-bold font-mono text-stone-700 cursor-pointer"
                        title="+५० संख्या थप्नुहोस्"
                      >
                        +५०
                      </button>
                    </div>

                    {/* Price of 1 Input (१ को दर) */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-semibold text-stone-500 whitespace-nowrap">
                        १ को दर रु.
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate === 0 ? '' : item.rate}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateRate(index, val === '' ? 0 : parseFloat(val) || 0);
                        }}
                        onBlur={() => handleBlurRate(index)}
                        placeholder="१ को दर"
                        className="w-20 px-2 py-1 rounded-lg bg-white border border-stone-200 text-right font-mono font-bold text-xs sm:text-sm text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                      />
                    </div>

                    {/* Item Total (Calculated: Quantity * Price of 1) */}
                    <div className="min-w-[85px] text-right">
                      <span className="text-[10px] text-stone-400 block font-medium leading-none">
                        जम्मा रकम
                      </span>
                      <span className="text-sm sm:text-base font-bold text-[#007AFF] font-mono leading-tight">
                        रु. {item.total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="हटाउनुहोस्"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Step 3: Fast Cash Checkout & Instant Print                      */}
        {/* --------------------------------------------------------------- */}
        <div className="pt-4 border-t border-stone-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Total & Discount */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-600 font-medium">जम्मा रकम:</span>
                <span className="text-base font-bold text-stone-900 font-mono">
                  रु. {subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-600 font-medium">छुट रकम (Discount):</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="०"
                  className="w-24 px-2 py-1 rounded-lg bg-white border border-stone-200 text-right font-mono text-xs focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">
                    कुल तिर्नुपर्ने (Total Payable):
                  </span>
                  <span className="text-2xl font-bold text-[#007AFF] font-mono tracking-tight block">
                    रु. {totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                {discount > 0 && (
                  <span className="text-xs font-bold text-[#34C759] bg-[#34C759]/10 px-2.5 py-1 rounded-xl">
                    छुट: रु. {discount}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Cash Received & Realtime Change/Due */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Wallet size={14} className="text-[#007AFF]" />
                  <span>पार्टीबाट जम्मा गरेको रकम (जम्मा गरेको):</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMoneyGivenInput(String(totalAmount))}
                  className="text-xs font-bold text-[#007AFF] hover:underline cursor-pointer"
                >
                  बराबर (Full Paid)
                </button>
              </div>

              {/* Cash Input */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-500 font-mono">
                  रु.
                </span>
                <input
                  type="number"
                  value={moneyGivenInput}
                  onChange={(e) => setMoneyGivenInput(e.target.value)}
                  placeholder={String(totalAmount)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-mono font-bold text-base focus:outline-none focus:border-[#007AFF] text-right"
                />
              </div>

              {/* Quick Cash Chips */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[500, 1000, 2000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setMoneyGivenInput(String(amt))}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-[#007AFF] border border-stone-200 text-xs font-mono font-semibold text-stone-700 transition-colors cursor-pointer"
                  >
                    रु.{amt}
                  </button>
                ))}
              </div>

              {/* Change or Due */}
              <div className="pt-2 border-t border-stone-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-stone-600">
                  <span>पार्टीले जम्मा गरेको:</span>
                  <span className="font-mono font-bold text-stone-900">
                    रु. {parsedMoneyGiven.toLocaleString('en-IN')}
                  </span>
                </div>

                {changeToReturn > 0 ? (
                  <div className="flex items-center justify-between text-[#34C759] font-bold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      <span>फिर्ता दिनुपर्ने रकम (Change):</span>
                    </span>
                    <span className="text-sm font-mono">
                      रु. {changeToReturn.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : dueAmount > 0 ? (
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-orange-600 font-bold">
                      <span>बाँकी उधारो (Remaining Due):</span>
                      <span className="text-sm font-mono">
                        रु. {dueAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500">
                      * यो बाँकी उधारो पार्टीको लेजर खातामा स्वतः दर्ता हुनेछ।
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[#34C759] font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>भुक्तानी अवस्था:</span>
                    </span>
                    <span>पूर्ण चुक्ता (Full Paid)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              कैफियत (Bill Remarks / Note)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => handleDevanagariChange(e, setNotes)}
              onKeyDown={(e) => handleDevanagariKeyDown(e, notes, setNotes)}
              onBlur={() => handleDevanagariBlur(notes, setNotes)}
              placeholder="जस्तै: नगद बुझेको, बिहान डेलिभरी हुने"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
            />
          </div>

          {/* Big, Fast 1-Click Print & Save Bill Button */}
          <button
            type="button"
            disabled={billItems.length === 0}
            onClick={handlePrintBill}
            className="w-full py-3.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base tracking-wide shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer size={18} />
            <span>बिल काट्नुहोस् र प्रिन्ट गर्नुहोस् (Print & Save Bill)</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Slide-over Modal for Recent Bills                                 */}
      {/* ----------------------------------------------------------------- */}
      {showRecentBillsDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-[#007AFF]" />
                <div>
                  <h3 className="text-base font-bold text-[#1C1C1E]">
                    जारी गरिएका बिलहरू (Invoices)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    कुल {recentBills.length} मध्ये {filteredRecentBills.length} बिल देखाइएको छ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecentBillsDrawer(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Filter Input inside Drawer */}
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={billSearch}
                onChange={(e) => handleDevanagariChange(e, setBillSearch)}
                onKeyDown={(e) => handleDevanagariKeyDown(e, billSearch, setBillSearch)}
                onBlur={() => handleDevanagariBlur(billSearch, setBillSearch)}
                placeholder="बिल नं. वा पार्टी नाम खोज्नुहोस्..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 focus:bg-white border border-stone-200 text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
              />
              {billSearch && (
                <button
                  type="button"
                  onClick={() => setBillSearch('')}
                  className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
              {filteredRecentBills.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  {billSearch ? `"${billSearch}" सँग मिल्ने कुनै बिल भेटिएन।` : 'हालसम्म कुनै बिल जारी गरिएको छैन।'}
                </div>
              ) : (
                filteredRecentBills.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setShowRecentBillsDrawer(false);
                      onViewInvoice(b);
                    }}
                    className="p-3 rounded-xl bg-stone-50 hover:bg-blue-50/50 border border-stone-200 hover:border-blue-300 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#007AFF] font-mono group-hover:underline">
                        {b.billNumber}
                      </span>
                      <span className="text-[11px] text-stone-500 font-mono">
                        {b.dateBs}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-bold text-[#1C1C1E] truncate max-w-[180px]" title={b.customerName}>
                        {b.customerName}
                      </span>
                      <span className="font-mono font-bold text-[#1C1C1E] shrink-0">
                        रु. {b.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-200/60">
                      <div className="flex items-center gap-2 text-stone-500">
                        <span>सामान: {b.items.length} थान</span>
                        <span>•</span>
                        <span className="text-[#007AFF] font-medium flex items-center gap-1 group-hover:underline">
                          <Printer size={12} />
                          <span>प्रिन्ट / हेर्नुहोस्</span>
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.dueAmount === 0
                            ? 'bg-[#34C759]/10 text-[#34C759]'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {b.dueAmount === 0
                          ? 'चुक्ता (Paid)'
                          : `उधारो: रु. ${b.dueAmount.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
