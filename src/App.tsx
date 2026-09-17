import React, { useState, useEffect } from 'react';
import {
  FruitItem,
  Party,
  SaleBill,
  StockArrival,
  DailyExpense,
  LedgerEntry,
  BusinessSettings,
  ActiveTab,
} from './types';
import {
  INITIAL_SETTINGS,
  INITIAL_FRUITS,
  INITIAL_PARTIES,
  INITIAL_BILLS,
  INITIAL_STOCK_ARRIVALS,
  INITIAL_EXPENSES,
  INITIAL_LEDGERS,
} from './data/initialData';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { SalesBilling } from './components/SalesBilling';
import { StockManager } from './components/StockManager';
import { PartyKhata } from './components/PartyKhata';
import { OwnerSection } from './components/OwnerSection';
import { InvoiceModal } from './components/InvoiceModal';
import { IosBubbleBackground } from './components/IosBubbleBackground';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { AppBackupData } from './utils/backupRestore';
import { Database, CheckCircle2 } from 'lucide-react';

export function App() {
  // Backup & Restore Modal State
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [restoreNotification, setRestoreNotification] = useState('');

  // Application Data State with LocalStorage persistence
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    try {
      const saved = localStorage.getItem('satyawati_settings_clean');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [fruits, setFruits] = useState<FruitItem[]>(() => {
    try {
      const saved = localStorage.getItem('satyawati_fruits_clean');
      return saved ? JSON.parse(saved) : INITIAL_FRUITS;
    } catch {
      return INITIAL_FRUITS;
    }
  });

  const [parties, setParties] = useState<Party[]>(() => {
    try {
      const saved = localStorage.getItem('satyawati_parties_clean');
      return saved ? JSON.parse(saved) : INITIAL_PARTIES;
    } catch {
      return INITIAL_PARTIES;
    }
  });

  const [bills, setBills] = useState<SaleBill[]>(() => {
    try {
      const saved = localStorage.getItem('satyawati_bills_clean');
      return saved ? JSON.parse(saved) : INITIAL_BILLS;
    } catch {
      return INITIAL_BILLS;
    }
  });

  const [stockArrivals, setStockArrivals] = useState<StockArrival[]>(() => {
    try {
      const saved = localStorage.getItem('satyawati_arrivals_clean');
      return saved ? JSON.parse(saved) : INITIAL_STOCK_ARRIVALS;
    } catch {
      return INITIAL_STOCK_ARRIVALS;
    }
  });

  const [expenses, setExpenses] = useState<DailyExpense[]>(() => {
    try {
      const saved = localStorage.getItem('satyawati_expenses_clean');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [ledgers, setLedgers] = useState<LedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem('satyawati_ledgers_clean');
      return saved ? JSON.parse(saved) : INITIAL_LEDGERS;
    } catch {
      return INITIAL_LEDGERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('satyawati_settings_clean', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('satyawati_fruits_clean', JSON.stringify(fruits));
    } catch (e) {
      console.error(e);
    }
  }, [fruits]);

  useEffect(() => {
    try {
      localStorage.setItem('satyawati_parties_clean', JSON.stringify(parties));
    } catch (e) {
      console.error(e);
    }
  }, [parties]);

  useEffect(() => {
    try {
      localStorage.setItem('satyawati_bills_clean', JSON.stringify(bills));
    } catch (e) {
      console.error(e);
    }
  }, [bills]);

  useEffect(() => {
    try {
      localStorage.setItem('satyawati_arrivals_clean', JSON.stringify(stockArrivals));
    } catch (e) {
      console.error(e);
    }
  }, [stockArrivals]);

  useEffect(() => {
    try {
      localStorage.setItem('satyawati_expenses_clean', JSON.stringify(expenses));
    } catch (e) {
      console.error(e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem('satyawati_ledgers_clean', JSON.stringify(ledgers));
    } catch (e) {
      console.error(e);
    }
  }, [ledgers]);

  // Active View State - Strictly the 4 requested tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('billing');
  const [selectedInvoice, setSelectedInvoice] = useState<SaleBill | null>(null);

  // Calculated Metrics for Header
  const todaySalesTotal = bills.reduce((acc, b) => acc + b.totalAmount, 0);
  const todayCashCollected = bills.reduce((acc, b) => acc + b.paidAmount, 0);
  const lowStockCount = fruits.filter((f) => f.stockQuantity <= f.minAlert).length;

  // Handlers
  const handleSaveBill = (newBill: SaleBill) => {
    setBills([newBill, ...bills]);

    // Deduct stock for items in the bill
    setFruits((prevFruits) =>
      prevFruits.map((fruit) => {
        const soldItem = newBill.items.find((it) => it.fruitId === fruit.id);
        if (soldItem) {
          return {
            ...fruit,
            stockQuantity: Math.max(0, fruit.stockQuantity - soldItem.quantity),
          };
        }
        return fruit;
      })
    );

    // If customer is registered party and has due amount, update party balance and add to ledger
    if (newBill.customerId && newBill.dueAmount > 0) {
      setParties((prevParties) =>
        prevParties.map((p) =>
          p.id === newBill.customerId ? { ...p, balance: p.balance + newBill.dueAmount } : p
        )
      );

      const targetParty = parties.find((p) => p.id === newBill.customerId);
      const prevBal = targetParty ? targetParty.balance : 0;

      const newLedger: LedgerEntry = {
        id: `leg-${Date.now()}`,
        partyId: newBill.customerId,
        dateBs: newBill.dateBs,
        type: 'बिक्री_उधारो',
        description: `बिक्री बिल नं. ${newBill.billNumber} उधारो`,
        billNumber: newBill.billNumber,
        debit: newBill.dueAmount,
        credit: 0,
        runningBalance: prevBal + newBill.dueAmount,
      };
      setLedgers((prev) => [newLedger, ...prev]);
    }
  };

  const handleUpdateStock = (fruitId: string, delta: number) => {
    setFruits((prev) =>
      prev.map((f) =>
        f.id === fruitId ? { ...f, stockQuantity: Math.max(0, f.stockQuantity + delta) } : f
      )
    );
  };

  const handleAddFruit = (newFruit: FruitItem) => {
    setFruits([...fruits, newFruit]);
  };

  const handleAddParty = (newParty: Party) => {
    setParties([...parties, newParty]);
  };

  const handleDeleteParty = (partyId: string) => {
    setParties((prev) => prev.filter((p) => p.id !== partyId));
  };

  const handleAddLedgerEntry = (entry: LedgerEntry, partyId: string, balanceDelta: number) => {
    setLedgers((prev) => [entry, ...prev]);
    setParties((prev) =>
      prev.map((p) => (p.id === partyId ? { ...p, balance: p.balance + balanceDelta } : p))
    );
  };

  const handleAddStockArrival = (arrival: StockArrival, updateFruitStock: boolean) => {
    setStockArrivals((prev) => [arrival, ...prev]);

    if (updateFruitStock) {
      setFruits((prevFruits) =>
        prevFruits.map((fruit) => {
          // If arrival has multiple cumulated fruits
          if (arrival.items && arrival.items.length > 0) {
            const matchedItem = arrival.items.find((it) => it.fruitId === fruit.id);
            if (matchedItem) {
              return {
                ...fruit,
                stockQuantity: fruit.stockQuantity + matchedItem.quantity,
                costPrice: matchedItem.costRate, // update latest purchase cost rate
                lastUpdated: arrival.dateBs,
              };
            }
            return fruit;
          }

          // Fallback for single fruit arrival
          if (fruit.id === arrival.fruitId) {
            return {
              ...fruit,
              stockQuantity: fruit.stockQuantity + (arrival.quantity || 0),
              costPrice: arrival.costRate || fruit.costPrice,
              lastUpdated: arrival.dateBs,
            };
          }
          return fruit;
        })
      );
    }
  };

  const handleAddExpense = (newExpense: DailyExpense) => {
    setExpenses((prev) => [newExpense, ...prev]);
  };

  // Restore Complete Shop Data from Backup File
  const handleRestoreData = (backup: AppBackupData) => {
    if (backup.fruits && backup.fruits.length > 0) setFruits(backup.fruits);
    if (backup.parties && backup.parties.length > 0) setParties(backup.parties);
    if (backup.bills && backup.bills.length > 0) setBills(backup.bills);
    if (backup.stockArrivals && backup.stockArrivals.length > 0) setStockArrivals(backup.stockArrivals);
    if (backup.expenses && backup.expenses.length > 0) setExpenses(backup.expenses);
    if (backup.ledgers && backup.ledgers.length > 0) setLedgers(backup.ledgers);
    if (backup.settings) setSettings(backup.settings);

    setRestoreNotification(
      `सफलतापूर्वक पुनःस्थापना भयो: ${backup.bills.length} वटा बिल, ${backup.parties.length} जना पार्टी, र ${backup.fruits.length} फलफूल स्टक!`
    );
    setTimeout(() => setRestoreNotification(''), 9000);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F2F2F7] text-[#1C1C1E] flex flex-col font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display','Mukta',sans-serif] selection:bg-[#007AFF]/20 selection:text-[#007AFF]">
      {/* iOS Liquid Glass Ambient Background (Static, Zero Battery Drain) */}
      <IosBubbleBackground />

      {/* Restore Success Banner */}
      {restoreNotification && (
        <div className="relative z-50 bg-[#34C759] text-white px-4 py-3 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-md animate-fadeIn">
          <CheckCircle2 size={18} />
          <span>{restoreNotification}</span>
          <button
            type="button"
            onClick={() => setRestoreNotification('')}
            className="ml-3 underline opacity-85 hover:opacity-100 cursor-pointer"
          >
            बन्द गर्नुहोस्
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col pb-12">
        {/* Top iOS Header with Devi Photo */}
        <Header
          settings={settings}
          todaySalesTotal={todaySalesTotal}
          todayCashCollected={todayCashCollected}
          onNewBillClick={() => setActiveTab('billing')}
        />

        {/* Floating Frosted Glass Navigation (Strictly 4 Tabs) */}
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lowStockCount={lowStockCount}
        />

        {/* Active Tab View with Smooth Transition */}
        <main className="flex-1 transition-opacity duration-200">
          {/* 1. New Bill (Sales Billing) */}
          {activeTab === 'billing' && (
            <SalesBilling
              fruits={fruits}
              parties={parties}
              onSaveBill={handleSaveBill}
              onViewInvoice={(bill) => setSelectedInvoice(bill)}
              onAddParty={handleAddParty}
              recentBills={bills}
            />
          )}

          {/* 2. Stocks (Inventory Management with Bilingual Names) */}
          {activeTab === 'stock' && (
            <StockManager
              fruits={fruits}
              onUpdateStock={handleUpdateStock}
              onAddFruit={handleAddFruit}
              onSetStockQuantity={(fruitId, qty) =>
                setFruits((prev) =>
                  prev.map((f) => (f.id === fruitId ? { ...f, stockQuantity: Math.max(0, qty) } : f))
                )
              }
              onDeleteFruit={(fruitId) =>
                setFruits((prev) => prev.filter((f) => f.id !== fruitId))
              }
            />
          )}

          {/* 3. Credit / Debit History of Party (Party Khata) */}
          {activeTab === 'parties' && (
            <PartyKhata
              parties={parties}
              ledgers={ledgers}
              bills={bills}
              settings={settings}
              onAddParty={handleAddParty}
              onDeleteParty={handleDeleteParty}
              onAddLedgerEntry={handleAddLedgerEntry}
            />
          )}

          {/* 4. Owner Section (Gadi No & Buying Rate Inward, Profit/Loss, Expenditures) */}
          {activeTab === 'owner' && (
            <OwnerSection
              fruits={fruits}
              bills={bills}
              stockArrivals={stockArrivals}
              expenses={expenses}
              settings={settings}
              parties={parties}
              onAddStockArrival={handleAddStockArrival}
              onAddExpense={handleAddExpense}
              onUpdateSettings={(newSettings) => setSettings(newSettings)}
              onOpenBackupModal={() => setIsBackupModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Invoice Modal (Opens on creation or click with direct WhatsApp and Print, NO PIN) */}
      {selectedInvoice && (
        <InvoiceModal
          bill={selectedInvoice}
          settings={settings}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Complete Backup & Data Restore / Migration Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        fruits={fruits}
        parties={parties}
        bills={bills}
        stockArrivals={stockArrivals}
        expenses={expenses}
        ledgers={ledgers}
        settings={settings}
        onRestoreData={handleRestoreData}
      />
    </div>
  );
}

export default App;
