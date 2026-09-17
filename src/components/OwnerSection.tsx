import React, { useState } from 'react';
import {
  FruitItem,
  SaleBill,
  StockArrival,
  DailyExpense,
  BusinessSettings,
  Party,
  ArrivalItem,
} from '../types';
import {
  handleDevanagariChange,
  handleDevanagariKeyDown,
  handleDevanagariBlur,
  forceTransliterate,
} from '../utils/nepaliTransliterate';
import { EasyDatePicker } from './EasyDatePicker';
import { haptic } from '../utils/haptics';
import {
  ShieldCheck,
  TrendingUp,
  Truck,
  DollarSign,
  Plus,
  Calendar,
  Layers,
  Settings,
  AlertCircle,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Mail,
  Upload,
  Database,
} from 'lucide-react';

interface OwnerSectionProps {
  fruits: FruitItem[];
  bills: SaleBill[];
  stockArrivals: StockArrival[];
  expenses: DailyExpense[];
  settings: BusinessSettings;
  parties: Party[];
  onAddStockArrival: (arrival: StockArrival, updateFruitStock: boolean) => void;
  onAddExpense: (expense: DailyExpense) => void;
  onUpdateSettings: (newSettings: BusinessSettings) => void;
  onOpenBackupModal?: () => void;
}

export const OwnerSection: React.FC<OwnerSectionProps> = ({
  fruits,
  bills,
  stockArrivals,
  expenses,
  settings,
  parties,
  onAddStockArrival,
  onAddExpense,
  onUpdateSettings,
  onOpenBackupModal,
}) => {
  // Active sub-tab in Owner section
  const [activeSubTab, setActiveSubTab] = useState<'arrival' | 'pnl' | 'expenses' | 'settings'>('arrival');

  // Gadi Arrival Entry Form State (Driver Name & Cumulated multi-fruit truck arrival)
  const [driverName, setDriverName] = useState('');
  const [arrivalDateBs, setArrivalDateBs] = useState('२०८१-०६-०३');
  const [supplierName, setSupplierName] = useState('');
  const [arrivalItems, setArrivalItems] = useState<ArrivalItem[]>([]);
  const [transportationCost, setTransportationCost] = useState<number>(0);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [arrivalPaidAmount, setArrivalPaidAmount] = useState<number>(0);
  const [arrivalNotes, setArrivalNotes] = useState('');
  const [arrivalSuccessMsg, setArrivalSuccessMsg] = useState('');
  const [arrivalSearchTerm, setArrivalSearchTerm] = useState('');

  // Daily Expense Entry Form State
  const [expCategory, setExpCategory] = useState<DailyExpense['category']>('अन्य_खर्च');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDateBs, setExpDateBs] = useState('२०८१-०६-०३');
  const [expNotes, setExpNotes] = useState('');

  // Settings State initialized from props
  const [shopName, setShopName] = useState(settings.shopName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [panNumber, setPanNumber] = useState(settings.panNumber);
  const [billTerms, setBillTerms] = useState(settings.billTerms);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Helpers for multi-fruit arrival
  const handleAddFruitToArrival = (fruitId: string) => {
    const f = fruits.find((x) => x.id === fruitId);
    if (!f) return;
    const defaultCostRate = f.costPrice && f.costPrice > 0 ? f.costPrice : 0;
    const existingIndex = arrivalItems.findIndex((it) => it.fruitId === fruitId);
    if (existingIndex >= 0) {
      const updated = [...arrivalItems];
      updated[existingIndex].quantity += 100;
      updated[existingIndex].totalCost = updated[existingIndex].quantity * updated[existingIndex].costRate;
      setArrivalItems(updated);
    } else {
      setArrivalItems([
        ...arrivalItems,
        {
          fruitId: f.id,
          fruitName: f.nameNepali,
          fruitNameEnglish: f.nameEnglish,
          unit: f.unit,
          quantity: 100,
          costRate: defaultCostRate,
          totalCost: 100 * defaultCostRate,
        },
      ]);
    }
  };

  const handleUpdateArrivalItem = (index: number, field: 'quantity' | 'costRate', value: number) => {
    const updated = [...arrivalItems];
    const item = { ...updated[index] };
    if (field === 'quantity') item.quantity = Math.max(1, value);
    if (field === 'costRate') item.costRate = Math.max(0, value);
    item.totalCost = item.quantity * item.costRate;
    updated[index] = item;
    setArrivalItems(updated);
  };

  const handleRemoveArrivalItem = (index: number) => {
    if (arrivalItems.length <= 1) return;
    setArrivalItems(arrivalItems.filter((_, i) => i !== index));
  };

  const arrivalGoodsCost = arrivalItems.reduce((acc, it) => acc + it.totalCost, 0);
  const arrivalTotalQuantity = arrivalItems.reduce((acc, it) => acc + it.quantity, 0);
  const arrivalGrandTotal = arrivalGoodsCost + transportationCost + laborCost;
  const arrivalDue = Math.max(0, arrivalGrandTotal - arrivalPaidAmount);

  // Submit Gadi Arrival
  const handleSaveStockArrival = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || arrivalItems.length === 0) return;

    const namesList = arrivalItems.map((it) => it.fruitName).join(', ');
    const primaryFruit = arrivalItems[0];

    const newArrival: StockArrival = {
      id: `arrival-${Date.now()}`,
      dateBs: arrivalDateBs,
      driverName: forceTransliterate(driverName.trim()),
      vehicleNumber: forceTransliterate(driverName.trim()), // for backwards compatibility
      supplierName: supplierName.trim() ? forceTransliterate(supplierName.trim()) : 'किसान / सप्लायर',
      items: arrivalItems.map((it) => ({ ...it })),
      fruitId: primaryFruit.fruitId,
      fruitName: arrivalItems.length > 1 ? `${namesList} (गाडी दाखिला)` : primaryFruit.fruitName,
      fruitNameEnglish: primaryFruit.fruitNameEnglish,
      unit: primaryFruit.unit,
      quantity: arrivalTotalQuantity,
      costRate: arrivalItems.length === 1 ? primaryFruit.costRate : 0,
      totalCost: arrivalGoodsCost,
      transportationCost: transportationCost > 0 ? transportationCost : undefined,
      laborCost: laborCost > 0 ? laborCost : undefined,
      grandTotalCost: arrivalGrandTotal,
      paidAmount: arrivalPaidAmount,
      dueAmount: arrivalDue,
      notes: arrivalNotes.trim() ? forceTransliterate(arrivalNotes.trim()) : undefined,
    };

    // Save arrival and auto-update fruit stock in inventory for all fruits!
    onAddStockArrival(newArrival, true);

    // If labor or transportation costs were entered, automatically record as expenditure!
    if (laborCost > 0) {
      onAddExpense({
        id: `exp-${Date.now()}-labor`,
        dateBs: arrivalDateBs,
        category: 'लेबर_ज्याला',
        amount: laborCost,
        notes: `चालक ${driverName.trim()} को गाडी अनलोडिङ लेबर ज्याला (${namesList})`,
      });
    }

    if (transportationCost > 0) {
      onAddExpense({
        id: `exp-${Date.now()}-bhada`,
        dateBs: arrivalDateBs,
        category: 'ढुवानी_भाडा',
        amount: transportationCost,
        notes: `चालक ${driverName.trim()} लाई गाडी ढुवानी भाडा (${namesList})`,
      });
    }

    setArrivalSuccessMsg(
      `चालक ${driverName} को ${arrivalItems.length} प्रकारका फलफूल (${namesList}) स्टकमा सफलतापूर्वक दाखिला भयो!`
    );
    haptic.success();
    setTimeout(() => setArrivalSuccessMsg(''), 6000);

    // Reset arrival form
    setDriverName('');
    setTransportationCost(0);
    setLaborCost(0);
    setArrivalPaidAmount(0);
    setArrivalNotes('');
    setArrivalItems([]);
  };

  // Submit Expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) return;

    const newExpense: DailyExpense = {
      id: `exp-${Date.now()}`,
      dateBs: expDateBs,
      category: expCategory,
      amount: expAmount,
      notes: expNotes.trim() ? forceTransliterate(expNotes.trim()) : 'दैनिक खर्च',
    };

    onAddExpense(newExpense);
    haptic.success();
    setExpAmount(0);
    setExpNotes('');
  };

  // Submit Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      shopName: forceTransliterate(shopName.trim()),
      ownerName: forceTransliterate(ownerName.trim()),
      tagline: forceTransliterate(tagline.trim()),
      address: forceTransliterate(address.trim()),
      phone: phone.trim(),
      panNumber: panNumber.trim(),
      billTerms: forceTransliterate(billTerms.trim()),
    });
    haptic.success();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // -------------------------------------------------------------
  // PROFIT & LOSS CALCULATIONS
  // -------------------------------------------------------------
  // 1. Total Sales Revenue
  const totalSalesRevenue = bills.reduce((acc, b) => acc + b.totalAmount, 0);

  // 2. Cost of Goods Sold (COGS) based on sold items
  let totalCostOfGoodsSold = 0;
  const itemProfitMap: {
    [fruitId: string]: {
      fruitNameNepali: string;
      fruitNameEnglish: string;
      unit: string;
      quantitySold: number;
      revenue: number;
      cost: number;
      profit: number;
      buyingRate: number;
      sellingRate: number;
    };
  } = {};

  // Initialize with fruit items
  fruits.forEach((f) => {
    itemProfitMap[f.id] = {
      fruitNameNepali: f.nameNepali,
      fruitNameEnglish: f.nameEnglish,
      unit: f.unit,
      quantitySold: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      buyingRate: f.costPrice || 0,
      sellingRate: f.sellingPrice || 1,
    };
  });

  // Calculate sold items
  bills.forEach((bill) => {
    bill.items.forEach((item) => {
      const fruit = fruits.find((f) => f.id === item.fruitId);
      const buyingRate = fruit?.costPrice && fruit.costPrice > 0 ? fruit.costPrice : (item.rate > 0 ? item.rate * 0.8 : 0);
      const itemCost = item.quantity * buyingRate;
      const itemRevenue = item.total;
      const itemProfit = itemRevenue - itemCost;

      totalCostOfGoodsSold += itemCost;

      if (!itemProfitMap[item.fruitId]) {
        itemProfitMap[item.fruitId] = {
          fruitNameNepali: item.fruitName,
          fruitNameEnglish: item.fruitNameEnglish || item.fruitName,
          unit: item.unit,
          quantitySold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          buyingRate: buyingRate,
          sellingRate: item.rate,
        };
      }

      itemProfitMap[item.fruitId].quantitySold += item.quantity;
      itemProfitMap[item.fruitId].revenue += itemRevenue;
      itemProfitMap[item.fruitId].cost += itemCost;
      itemProfitMap[item.fruitId].profit += itemProfit;
    });
  });

  // 3. Gross Profit
  const grossProfit = totalSalesRevenue - totalCostOfGoodsSold;

  // 4. Total Operating Expenses
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  // 5. Net Profit
  const netProfit = grossProfit - totalExpenses;
  const netMarginPercent = totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0;

  const filteredArrivals = stockArrivals.filter((a) => {
    const term = arrivalSearchTerm.toLowerCase();
    return (
      (a.driverName && a.driverName.toLowerCase().includes(term)) ||
      (a.vehicleNumber && a.vehicleNumber.toLowerCase().includes(term)) ||
      (a.fruitName && a.fruitName.toLowerCase().includes(term)) ||
      (a.fruitNameEnglish && a.fruitNameEnglish.toLowerCase().includes(term)) ||
      (a.supplierName && a.supplierName.toLowerCase().includes(term)) ||
      a.dateBs.includes(term)
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Top Banner with Devi Photo and Owner Branding */}
      <div className="rounded-[24px] ios-glass-panel p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-[20px] bg-white p-1 ring-1 ring-black/5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] shrink-0">
            <img
              src="/maa_durga_idol.jpg"
              alt="श्री सत्यवती माता"
              style={{ objectPosition: 'center 10%' }}
              className="w-full h-full object-cover rounded-[16px]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#FF9500] bg-[#FF9500]/10 px-2.5 py-0.5 rounded-full border border-[#FF9500]/20">
                ।। श्री सत्यवती माता प्रसन्न ।।
              </span>
              <span className="text-xs font-semibold text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-full border border-[#007AFF]/20">सञ्चालक गोप्य कक्ष</span>
            </div>
            <h2 className="text-xl font-bold text-[#1C1C1E] font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Mukta',sans-serif] mt-0.5">
              {settings.shopName} - नाफा-नोक्सान, गाडी दाखिला र खर्च विश्लेषण
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              {settings.ownerName} • खरिद दर, गाडी चालक विवरण, नाफा मार्जिन र दैनिक लेबर-भाडा नियन्त्रण
            </p>
          </div>
        </div>

        {/* Sub-Navigation Pills (Apple Segmented Style) */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-black/[0.05] border border-black/[0.04]">
          <button
            type="button"
            onClick={() => setActiveSubTab('arrival')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'arrival'
                ? 'bg-white text-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.04]'
                : 'text-[#3C3C43]/70 hover:text-[#1C1C1E]'
            }`}
          >
            <Truck size={14} className={activeSubTab === 'arrival' ? 'text-[#007AFF]' : 'text-[#8E8E93]'} />
            <span>गाडी आगमन तथा खरिद (Gadi Inward)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('pnl')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'pnl'
                ? 'bg-white text-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.04]'
                : 'text-[#3C3C43]/70 hover:text-[#1C1C1E]'
            }`}
          >
            <TrendingUp size={14} className={activeSubTab === 'pnl' ? 'text-[#34C759]' : 'text-[#8E8E93]'} />
            <span>नाफा-नोक्सान (Profit & Loss)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('expenses')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'expenses'
                ? 'bg-white text-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.04]'
                : 'text-[#3C3C43]/70 hover:text-[#1C1C1E]'
            }`}
          >
            <DollarSign size={14} className={activeSubTab === 'expenses' ? 'text-[#FF9500]' : 'text-[#8E8E93]'} />
            <span>दैनिक खर्चहरू (Expenditures)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-white text-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.04]'
                : 'text-[#3C3C43]/70 hover:text-[#1C1C1E]'
            }`}
          >
            <Settings size={14} className={activeSubTab === 'settings' ? 'text-[#5856D6]' : 'text-[#8E8E93]'} />
            <span>फर्म सेटिङ (Settings)</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 1. GADI ARRIVAL & STOCK PURCHASE ENTRY TAB                         */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'arrival' && (
        <div className="space-y-6">
          {arrivalSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>{arrivalSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Columns: Gadi Arrival Input Form */}
            <div className="lg:col-span-5 rounded-[24px] ios-glass-card p-5 sm:p-6 space-y-4">
              <div className="border-b border-black/[0.06] pb-3">
                <h3 className="text-base font-bold text-stone-900 font-['Outfit'] flex items-center gap-2">
                  <Truck size={18} className="text-[#007AFF]" />
                  <span>नयाँ गाडी आगमन तथा खरिद दर प्रविष्टि</span>
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  गाडी नम्बर, खरिद दर, परिमाण र ढुवानी-लेबर ज्याला दर्ता गर्नुहोस्
                </p>
              </div>

              <form onSubmit={handleSaveStockArrival} className="space-y-3.5 text-xs">
                {/* Driver Name & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      गाडी चालकको नाम (Driver's Name) *
                    </label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="जस्तै: राम बहादुर थापा (चालकको नाम)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200/80 text-stone-900 focus:outline-none focus:border-[#007AFF] shadow-sm"
                      required
                    />
                  </div>
                </div>

                {/* Easy Date Picker for Truck Arrival */}
                <EasyDatePicker
                  value={arrivalDateBs}
                  onChange={setArrivalDateBs}
                  label="आगमन मिति (वि.सं.)"
                  required
                />

                {/* Supplier Name */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    सप्लायर / किसानको नाम (Supplier Party)
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => handleDevanagariChange(e, setSupplierName)}
                    onKeyDown={(e) => handleDevanagariKeyDown(e, supplierName, setSupplierName)}
                    onBlur={() => handleDevanagariBlur(supplierName, setSupplierName)}
                    placeholder="जस्तै: नारायण एग्रो वा मुस्ताङ एग्रो"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200/80 text-stone-900 focus:outline-none focus:border-[#007AFF] shadow-sm"
                  />
                </div>

                {/* Multi-fruit Cumulated Inward Section */}
                <div className="pt-2 border-t border-black/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                        <span>🚛 गाडीमा आएका फलफूलहरूको सूची (Cumulated Fruits)</span>
                      </span>
                      <p className="text-[10px] text-stone-500">
                        एउटै गाडीमा धेरै प्रकारका फलफूल (नरिवल, स्याउ, अंगुर आदि) एकैपटक दाखिला गर्नुहोस्
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF]">
                      {arrivalItems.length} फलफूल
                    </span>
                  </div>

                  {/* Add Fruit to Truck Row */}
                  {fruits.length === 0 ? (
                    <div className="p-3 text-center text-xs text-amber-800 bg-amber-50 rounded-xl border border-amber-200/80">
                      स्टकमा कुनै फलफूल छैन। पहिले 'स्टक व्यवस्थापक' ट्याबबाट फलफूल थप्नुहोस्।
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50/90 border border-stone-200/70">
                      <select
                        id="truck-fruit-select"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-900 text-xs focus:outline-none"
                        defaultValue={fruits[0]?.id || ''}
                      >
                        {fruits.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.imageEmoji} {f.nameNepali} ({f.nameEnglish}) - स्टक: {f.stockQuantity}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const sel = document.getElementById('truck-fruit-select') as HTMLSelectElement;
                          if (sel && sel.value) handleAddFruitToArrival(sel.value);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Plus size={14} />
                        <span>गाडीमा थप्नुहोस्</span>
                      </button>
                    </div>
                  )}

                  {/* Arrival Items Table */}
                  <div className="space-y-2 max-h-[260px] overflow-y-auto no-scrollbar pr-0.5">
                    {arrivalItems.map((item, idx) => (
                      <div
                        key={`${item.fruitId}-${idx}`}
                        className="p-2.5 rounded-xl bg-white border border-stone-200/90 shadow-xs flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 text-xs">
                            {item.fruitName} {item.fruitNameEnglish ? `(${item.fruitNameEnglish})` : ''}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-stone-700">
                              रु. {item.totalCost.toLocaleString('en-IN')}
                            </span>
                            {arrivalItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveArrivalItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                title="हटाउनुहोस्"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-stone-500 mb-0.5">
                              परिमाण ({item.unit})
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity || ''}
                              onChange={(e) =>
                                handleUpdateArrivalItem(idx, 'quantity', Number(e.target.value) || 0)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-900 font-mono text-right text-xs focus:bg-white focus:outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-stone-500 mb-0.5">
                              खरिद दर (रु.)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={item.costRate || ''}
                              onChange={(e) =>
                                handleUpdateArrivalItem(idx, 'costRate', Number(e.target.value) || 0)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-900 font-mono text-right text-xs focus:bg-white focus:outline-none"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal of Goods Cost */}
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-600 font-sans">फलफूल खरिद जम्मा (Goods Total):</span>
                  <span className="font-bold text-stone-900 text-sm">
                    रु. {arrivalGoodsCost.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Transportation / Bhada & Labor Expenses */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 mb-1">गाडी भाडा / ढुवानी (रु.)</label>
                    <input
                      type="number"
                      value={transportationCost || ''}
                      onChange={(e) => setTransportationCost(Number(e.target.value) || 0)}
                      placeholder="०"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200/80 text-stone-900 font-mono text-right focus:outline-none shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1">लेबर अनलोडिङ ज्याला (रु.)</label>
                    <input
                      type="number"
                      value={laborCost || ''}
                      onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
                      placeholder="०"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200/80 text-stone-900 font-mono text-right focus:outline-none shadow-sm"
                    />
                  </div>
                </div>

                {/* Grand Total & Paid */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-stone-600 mb-1">गाडीको कुल लागत (रु.)</label>
                    <div className="w-full px-3 py-2 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-900 font-mono font-bold text-right text-xs">
                      रु. {arrivalGrandTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1">सप्लायरलाई बुझाएको रकम (रु.)</label>
                    <input
                      type="number"
                      value={arrivalPaidAmount || ''}
                      onChange={(e) => setArrivalPaidAmount(Number(e.target.value) || 0)}
                      placeholder="०"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200/80 text-stone-900 font-mono text-right focus:outline-none shadow-sm"
                    />
                  </div>
                </div>

                {arrivalDue > 0 && (
                  <div className="p-2 rounded-lg bg-red-50 text-red-700 text-[11px] font-medium flex justify-between">
                    <span>सप्लायरलाई तिर्न बाँकी उधारो:</span>
                    <span className="font-mono font-bold">रु. {arrivalDue.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-stone-600 mb-1">कैफियत (Remarks)</label>
                  <input
                    type="text"
                    value={arrivalNotes}
                    onChange={(e) => handleDevanagariChange(e, setArrivalNotes)}
                    onKeyDown={(e) => handleDevanagariKeyDown(e, arrivalNotes, setArrivalNotes)}
                    onBlur={() => handleDevanagariBlur(arrivalNotes, setArrivalNotes)}
                    placeholder="जस्तै: १० चक्के ट्रक, संयुक्त ताजा लट"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200/80 text-stone-900 focus:outline-none shadow-sm"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-bold text-xs tracking-wide shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  <span>गाडी आगमन सुरक्षित गरी स्टकमा थप्नुहोस्</span>
                </button>
              </form>
            </div>

            {/* Right 7 Columns: Gadi Arrival Inward History Table */}
            <div className="lg:col-span-7 rounded-[24px] ios-glass-card p-5 sm:p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 font-['Outfit']">
                      गाडी आगमन तथा खरिद इतिहास (Stock Inward History)
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      गाडी चालक अनुसार मिश्रित फलफूल खरिद दर, परिमाण र सप्लायर हिसाब
                    </p>
                  </div>
                  <input
                    type="text"
                    value={arrivalSearchTerm}
                    onChange={(e) => setArrivalSearchTerm(e.target.value)}
                    placeholder="चालकको नाम वा फलफूल खोज्नुहोस्..."
                    className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs focus:outline-none shadow-sm sm:w-48"
                  />
                </div>

                <div className="mt-3 overflow-x-auto no-scrollbar border border-stone-200/80 rounded-2xl max-h-[480px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-100/90 text-stone-700 font-semibold sticky top-0 border-b border-stone-200">
                      <tr>
                        <th className="p-2.5">मिति</th>
                        <th className="p-2.5">गाडी चालक (Driver)</th>
                        <th className="p-2.5">दाखिला फलफूलहरू (Fruits List)</th>
                        <th className="p-2.5 text-right">कुल परिमाण</th>
                        <th className="p-2.5 text-right">कुल रकम</th>
                        <th className="p-2.5 text-center">भाडा/लेबर</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono">
                      {filteredArrivals.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-xs text-stone-400 font-sans">
                            कुनै गाडी दाखिला रेकर्ड भेटिएन।
                          </td>
                        </tr>
                      ) : (
                        filteredArrivals.map((arrival) => (
                          <tr key={arrival.id} className="hover:bg-stone-50/80 transition-colors">
                            <td className="p-2.5 font-sans text-stone-600">{arrival.dateBs}</td>
                            <td className="p-2.5 font-bold text-[#007AFF]">
                              {arrival.driverName || arrival.vehicleNumber || 'गाडी चालक'}
                              <span className="block text-[10px] text-stone-500 font-normal font-sans">
                                {arrival.supplierName}
                              </span>
                            </td>
                          <td className="p-2.5 font-sans">
                            {arrival.items && arrival.items.length > 0 ? (
                              <div className="space-y-1">
                                {arrival.items.map((it, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                    <span className="font-semibold text-stone-900">{it.fruitName}</span>
                                    <span className="text-stone-500">
                                      ({it.quantity} {it.unit} @ रु.{it.costRate})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div>
                                <span className="font-bold text-stone-900 block">
                                  {arrival.fruitName}
                                </span>
                                {arrival.costRate > 0 && (
                                  <span className="text-[10px] text-stone-500 block">
                                    दर: रु. {arrival.costRate}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-right text-stone-900 font-bold">
                            {arrival.quantity} {arrival.unit}
                          </td>
                          <td className="p-2.5 text-right font-bold text-stone-900">
                            रु. {(arrival.grandTotalCost || arrival.totalCost).toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-center text-[10px] font-sans">
                            {arrival.transportationCost || arrival.laborCost ? (
                              <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                                भाडा: रु.{arrival.transportationCost || 0} / लेबर: रु.{arrival.laborCost || 0}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 2. PROFIT & LOSS ANALYSIS (PNL) TAB                                */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'pnl' && (
        <div className="space-y-6">
          {/* Key Financial Health Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sales Revenue */}
            <div className="rounded-[22px] ios-glass-card p-5">
              <span className="text-xs text-[#8E8E93] font-medium block">
                कुल थोक बिक्री आम्दानी (Total Revenue)
              </span>
              <span className="text-2xl font-bold text-[#1C1C1E] font-mono mt-1 block">
                रु. {totalSalesRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[#8E8E93]">जारी गरिएका सबै बिलहरूको जोड</span>
            </div>

            {/* Cost of Goods Sold */}
            <div className="rounded-[22px] ios-glass-card p-5">
              <span className="text-xs text-[#8E8E93] font-medium block">
                बिक्री भएको माल खरिद लागत (Cost of Goods)
              </span>
              <span className="text-2xl font-bold text-stone-700 font-mono mt-1 block">
                रु. {totalCostOfGoodsSold.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[#8E8E93]">खरिद दर अनुसार कुल वस्तु लागत</span>
            </div>

            {/* Gross Profit */}
            <div className="rounded-[22px] ios-glass-card p-5">
              <span className="text-xs text-[#8E8E93] font-medium block">
                सकल नाफा (Gross Profit)
              </span>
              <span className="text-2xl font-bold text-[#007AFF] font-mono mt-1 block">
                रु. {grossProfit.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[#8E8E93]">खर्च कटाउनु पूर्वको नाफा</span>
            </div>

            {/* Net Profit */}
            <div className="rounded-[22px] ios-glass-card p-5">
              <span className="text-xs text-[#8E8E93] font-medium block">
                खुद नाफा (Net Profit After Expenses)
              </span>
              <span
                className={`text-2xl font-bold font-mono mt-1 block ${
                  netProfit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'
                }`}
              >
                रु. {netProfit.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[#34C759] font-semibold">
                नाफा दर: {netMarginPercent.toFixed(1)}% (लेबर र गाडी भाडा कट्टा गरी)
              </span>
            </div>
          </div>

          {/* Visual Breakdown Bar */}
          <div className="rounded-[22px] ios-glass-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#1C1C1E]">
              आम्दानी र खर्च वितरण (Revenue vs Cost vs Profit Distribution)
            </h3>
            <div className="h-6 w-full rounded-2xl overflow-hidden flex bg-stone-100 p-0.5 border border-stone-200">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    totalSalesRevenue > 0 ? (totalCostOfGoodsSold / totalSalesRevenue) * 100 : 70
                  )}%`,
                }}
                className="h-full bg-stone-500 rounded-l-xl flex items-center justify-center text-[10px] text-white font-bold truncate px-1"
                title="खरिद लागत"
              >
                खरिद लागत
              </div>
              <div
                style={{
                  width: `${Math.min(
                    100,
                    totalSalesRevenue > 0 ? (totalExpenses / totalSalesRevenue) * 100 : 10
                  )}%`,
                }}
                className="h-full bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold truncate px-1"
                title="सञ्चालन खर्च (लेबर, भाडा)"
              >
                सञ्चालन खर्च
              </div>
              <div
                style={{
                  width: `${Math.max(
                    0,
                    totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 20
                  )}%`,
                }}
                className="h-full bg-emerald-600 rounded-r-xl flex items-center justify-center text-[10px] text-white font-bold truncate px-1"
                title="खुद नाफा"
              >
                खुद नाफा
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-stone-500 inline-block" />
                <span>खरिद लागत: रु. {totalCostOfGoodsSold.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                <span>कुल खर्च: रु. {totalExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                <span className="font-bold text-emerald-700">
                  खुद नाफा: रु. {netProfit.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Item-wise Profit Margin Table (With Bilingual Names) */}
          <div className="rounded-[22px] ios-glass-card p-5 space-y-3">
            <h3 className="text-base font-bold text-[#1C1C1E]">
              फलफूल अनुसार नाफा विश्लेषण तालिका (Item-wise Profit Margin Breakdown)
            </h3>
            <p className="text-xs text-stone-500">
              प्रत्येक फलफूलको खरिद दर, बिक्री दर, प्रति एकाइ मार्जिन र हालसम्म आर्जित नाफा
            </p>

            <div className="overflow-x-auto no-scrollbar border border-stone-200/80 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-100/90 text-stone-700 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-3">फलफूल (Nepali & English)</th>
                    <th className="p-3 text-right">खरिद दर (Cost)</th>
                    <th className="p-3 text-right">बिक्री दर (Selling)</th>
                    <th className="p-3 text-right text-emerald-700">प्रति इकाई नाफा</th>
                    <th className="p-3 text-right">बिक्री परिमाण</th>
                    <th className="p-3 text-right font-bold text-stone-900">कुल आर्जित नाफा</th>
                    <th className="p-3 text-right">नाफा %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {Object.entries(itemProfitMap).map(([id, data]) => {
                    const marginPerUnit = data.sellingRate - data.buyingRate;
                    const marginPercent =
                      data.buyingRate > 0 ? (marginPerUnit / data.buyingRate) * 100 : 0;

                    return (
                      <tr key={id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="p-3 font-sans">
                          <span className="font-bold text-stone-900 block">
                            {data.fruitNameNepali}
                          </span>
                          <span className="text-[11px] text-orange-600 block">
                            {data.fruitNameEnglish}
                          </span>
                        </td>
                        <td className="p-3 text-right text-stone-700">
                          रु. {data.buyingRate}/{data.unit}
                        </td>
                        <td className="p-3 text-right text-stone-900 font-semibold">
                          रु. {data.sellingRate}/{data.unit}
                        </td>
                        <td className="p-3 text-right text-emerald-700 font-bold">
                          + रु. {marginPerUnit}/{data.unit}
                        </td>
                        <td className="p-3 text-right text-stone-800">
                          {data.quantitySold} {data.unit}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700 text-sm">
                          रु. {data.profit.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right text-stone-600">
                          {marginPercent.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 3. EXPENDITURES TAB                                               */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Columns: Add Expense Form */}
          <div className="lg:col-span-5 rounded-[24px] ios-glass-card p-5 sm:p-6 space-y-4">
            <div className="border-b border-black/[0.06] pb-3">
              <h3 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
                <DollarSign size={18} className="text-[#FF9500]" />
                <span>दैनिक खर्च प्रविष्टि (Add Expenditure)</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                लेबर अनलोडिङ, गाडी भाडा, चिया-खाजा तथा पसल सञ्चालन खर्चहरू
              </p>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">खर्च शीर्षक (Category) *</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200/80 text-stone-900 focus:outline-none focus:border-orange-500 shadow-sm"
                >
                  <option value="लेबर_ज्याला">लेबर ज्याला (Labor / Unloading)</option>
                  <option value="ढुवानी_भाडा">ढुवानी तथा गाडी भाडा (Freight / Gadi Bhada)</option>
                  <option value="चिया_खाजा">चिया तथा खाजा खर्च (Tea & Snacks)</option>
                  <option value="पसल_खर्च">पसल तथा गोदाम खर्च (Shop / Electricity)</option>
                  <option value="विविध">विविध खर्च (Miscellaneous)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">रकम (रु.) *</label>
                <input
                  type="number"
                  min={1}
                  value={expAmount || ''}
                  onChange={(e) => setExpAmount(Number(e.target.value) || 0)}
                  placeholder="रकम प्रविष्टि गर्नुहोस्"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200/80 text-stone-900 font-mono text-right focus:outline-none focus:border-orange-500 shadow-sm"
                  required
                />
              </div>

              {/* Easy Date Picker for Daily Expense */}
              <EasyDatePicker
                value={expDateBs}
                onChange={setExpDateBs}
                label="खर्च मिति (वि.सं.)"
                required
              />

              <div>
                <label className="block font-semibold text-stone-700 mb-1">विवरण / कैफियत</label>
                <input
                  type="text"
                  value={expNotes}
                  onChange={(e) => handleDevanagariChange(e, setExpNotes)}
                  onKeyDown={(e) => handleDevanagariKeyDown(e, expNotes, setExpNotes)}
                  onBlur={() => handleDevanagariBlur(expNotes, setExpNotes)}
                  placeholder="जस्तै: ट्रक अनलोडिङ ५ जना लेबर ज्याला"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200/80 text-stone-900 focus:outline-none shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs tracking-wide shadow-md active:scale-95 cursor-pointer"
              >
                खर्च सुरक्षित गर्नुहोस्
              </button>
            </form>
          </div>

          {/* Right 7 Columns: Expenses List */}
          <div className="lg:col-span-7 rounded-[24px] ios-glass-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1C1C1E]">
                  खर्च विवरण (Expenses Log)
                </h3>
                <p className="text-[11px] text-[#8E8E93]">कुल खर्च: रु. {totalExpenses.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar border border-stone-200/80 rounded-2xl max-h-[420px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-100/90 text-stone-700 font-semibold sticky top-0 border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">मिति</th>
                    <th className="p-2.5">शीर्षक</th>
                    <th className="p-2.5">विवरण</th>
                    <th className="p-2.5 text-right">रकम (रु.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-2.5 font-sans text-stone-600">{exp.dateBs}</td>
                      <td className="p-2.5 font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                          {exp.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-2.5 font-sans text-stone-900">{exp.notes}</td>
                      <td className="p-2.5 text-right font-bold text-red-600">
                        रु. {exp.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 4. SHOP & BILL SETTINGS TAB                                       */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'settings' && (
        <div className="rounded-[24px] ios-glass-card p-6 max-w-3xl mx-auto space-y-5">
          <div className="flex items-center gap-3 border-b border-black/[0.06] pb-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-black/10">
              <img
                src="/maa_durga_idol.jpg"
                alt="श्री सत्यवती माता"
                style={{ objectPosition: 'center 10%' }}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-['Outfit']">
                पसल विवरण तथा बिल सेटिङ (Shop Profile & Bill Format)
              </h3>
              <p className="text-xs text-stone-500">
                बिल प्रिन्ट तथा ह्वाट्सएप इनभ्वाइसमा देखिने फर्मको नाम र नियमहरू
              </p>
            </div>
          </div>

          {settingsSaved && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>सेटिङ सफलतापूर्वक सुरक्षित भयो!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">फर्मको नाम *</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => handleDevanagariChange(e, setShopName)}
                  onKeyDown={(e) => handleDevanagariKeyDown(e, shopName, setShopName)}
                  onBlur={() => handleDevanagariBlur(shopName, setShopName)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">प्रोप्राइटरको नाम *</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => handleDevanagariChange(e, setOwnerName)}
                  onKeyDown={(e) => handleDevanagariKeyDown(e, ownerName, setOwnerName)}
                  onBlur={() => handleDevanagariBlur(ownerName, setOwnerName)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">सम्पर्क फोन नम्बरहरू *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">प्यान / भ्याट नम्बर</label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">पसलको ठेगाना *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => handleDevanagariChange(e, setAddress)}
                onKeyDown={(e) => handleDevanagariKeyDown(e, address, setAddress)}
                onBlur={() => handleDevanagariBlur(address, setAddress)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">ट्यागलाइन / विवरण</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => handleDevanagariChange(e, setTagline)}
                onKeyDown={(e) => handleDevanagariKeyDown(e, tagline, setTagline)}
                onBlur={() => handleDevanagariBlur(tagline, setTagline)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">बिलका सर्त तथा नियमहरू</label>
              <textarea
                value={billTerms}
                onChange={(e) => handleDevanagariChange(e, setBillTerms)}
                onKeyDown={(e) => handleDevanagariKeyDown(e, billTerms, setBillTerms)}
                onBlur={() => handleDevanagariBlur(billTerms, setBillTerms)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md active:scale-95 cursor-pointer"
              >
                सेटिङ सुरक्षित गर्नुहोस्
              </button>
            </div>
          </form>
        </div>
      )}
      {/* ------------------------------------------------------------- */}
      {/* AT THE VERY LAST OF OWNER SECTION: COMPLETE BACKUP & RESTORE  */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white/95 backdrop-blur-md rounded-[24px] p-6 border border-stone-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#007AFF] flex items-center justify-center">
                <Database size={17} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#1C1C1E]">
                डाटा ब्याकअप तथा नयाँ डिभाइसमा सार्ने (Email Backup & Migration)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#34C759] border border-emerald-200">
                १००% सुरक्षित
              </span>
            </div>
            <p className="text-xs text-[#636366] max-w-2xl leading-relaxed">
              फोन हराएमा, एप डिलिट भएमा वा ल्यापटप/नयाँ फोनमा पसलको डाटा सार्न यहाँबाट १ सेकेन्डमै इमेल ब्याकअप पठाउन वा सुरक्षित .json ब्याकअप फाइल रिस्टोर (Restore) गर्न सक्नुहुन्छ।
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                if (onOpenBackupModal) onOpenBackupModal();
              }}
              className="px-5 py-3 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] text-white font-bold text-xs tracking-wide shadow-[0_4px_14px_rgba(0,122,255,0.25)] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Mail size={16} />
              <span>इमेल ब्याकअप तथा Restore खोल्नुहोस्</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
