import React, { useState } from 'react';
import { Party, LedgerEntry, PartyType, BusinessSettings, SaleBill } from '../types';
import { EasyDatePicker } from './EasyDatePicker';
import {
  handleDevanagariChange,
  handleDevanagariKeyDown,
  handleDevanagariBlur,
  transliterateSentence,
  forceTransliterate,
} from '../utils/nepaliTransliterate';
import { printPartyStatement } from '../utils/printInvoice';
import { haptic } from '../utils/haptics';
import {
  Users,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Share2,
  Phone,
  Printer,
  Calendar,
  CheckCircle,
  X,
  Trash2,
  Receipt,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface PartyKhataProps {
  parties: Party[];
  ledgers: LedgerEntry[];
  bills?: SaleBill[];
  settings?: BusinessSettings;
  onAddParty: (party: Party) => void;
  onDeleteParty?: (partyId: string) => void;
  onAddLedgerEntry: (entry: LedgerEntry, partyId: string, balanceDelta: number) => void;
}

export const PartyKhata: React.FC<PartyKhataProps> = ({
  parties,
  ledgers,
  bills = [],
  settings,
  onAddParty,
  onDeleteParty,
  onAddLedgerEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);

  // New Party Form State
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyType, setNewPartyType] = useState<PartyType>('खुद्रा_व्यापारी');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyAddress, setNewPartyAddress] = useState('');
  const [newPartyInitialBalance, setNewPartyInitialBalance] = useState<number>(0);

  // New Ledger Entry State
  const [entryType, setEntryType] = useState<'रकम_प्राप्त' | 'बिक्री_उधारो' | 'रकम_भुक्तान' | 'खरिद_उधारो'>('रकम_प्राप्त');
  const [entryAmount, setEntryAmount] = useState<number>(0);
  const [entryDescription, setEntryDescription] = useState('');
  const [entryBillNo, setEntryBillNo] = useState('');
  const [entryDateBs, setEntryDateBs] = useState('२०८१-०६-०३');

  const filteredParties = parties.filter((p) => {
    const term = searchTerm.toLowerCase();
    const termDev = transliterateSentence(term).toLowerCase();
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(termDev) ||
      p.phone.toLowerCase().includes(term) ||
      p.address.toLowerCase().includes(term) ||
      p.address.toLowerCase().includes(termDev);

    if (!matchesSearch) return false;
    if (filterType === 'receivable' && p.balance <= 0) return false;
    if (filterType === 'payable' && p.balance >= 0) return false;
    return true;
  });

  const totalReceivable = parties.filter((p) => p.balance > 0).reduce((acc, p) => acc + p.balance, 0);
  const totalPayable = parties.filter((p) => p.balance < 0).reduce((acc, p) => acc + Math.abs(p.balance), 0);

  // Filter all bills generated for the selected party
  const selectedPartyBills = selectedParty
    ? bills.filter((b) => {
        const matchId = b.customerId && b.customerId === selectedParty.id;
        const cleanBillPhone = b.customerPhone ? b.customerPhone.replace(/[^0-9]/g, '') : '';
        const cleanPartyPhone = selectedParty.phone ? selectedParty.phone.replace(/[^0-9]/g, '') : '';
        const matchPhone = cleanBillPhone && cleanPartyPhone && cleanBillPhone === cleanPartyPhone;
        const matchName =
          b.customerName && b.customerName.trim().toLowerCase() === selectedParty.name.trim().toLowerCase();
        return Boolean(matchId || matchPhone || matchName);
      })
    : [];

  const handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;

    const newParty: Party = {
      id: `party-${Date.now()}`,
      name: forceTransliterate(newPartyName.trim()),
      type: newPartyType,
      phone: newPartyPhone.trim(),
      address: forceTransliterate(newPartyAddress.trim() || 'बुटवल'),
      balance: newPartyInitialBalance,
      createdAt: '२०८१-०६-०३',
    };

    onAddParty(newParty);
    haptic.success();
    setIsAddPartyModalOpen(false);
    setNewPartyName('');
    setNewPartyPhone('');
    setNewPartyAddress('');
    setNewPartyInitialBalance(0);
  };

  const handleCreateLedgerEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty || entryAmount <= 0) return;

    let debit = 0;
    let credit = 0;
    let balanceDelta = 0;

    if (entryType === 'बिक्री_उधारो') {
      debit = entryAmount;
      balanceDelta = entryAmount; // लिन बाँकी बढ्छ
    } else if (entryType === 'रकम_प्राप्त') {
      credit = entryAmount;
      balanceDelta = -entryAmount; // लिन बाँकी घट्छ
    } else if (entryType === 'खरिद_उधारो') {
      credit = entryAmount;
      balanceDelta = -entryAmount; // तिर्न बाँकी बढ्छ
    } else if (entryType === 'रकम_भुक्तान') {
      debit = entryAmount;
      balanceDelta = entryAmount; // तिर्न बाँकी घट्छ
    }

    const newRunning = selectedParty.balance + balanceDelta;

    const entry: LedgerEntry = {
      id: `leg-${Date.now()}`,
      partyId: selectedParty.id,
      dateBs: entryDateBs,
      type: entryType,
      description: entryDescription.trim()
        ? forceTransliterate(entryDescription.trim())
        : entryType === 'रकम_प्राप्त'
        ? 'नगद / बैंक प्राप्त'
        : 'उधारो प्रविष्टि',
      billNumber: entryBillNo.trim() || undefined,
      debit,
      credit,
      runningBalance: newRunning,
    };

    onAddLedgerEntry(entry, selectedParty.id, balanceDelta);
    setSelectedParty({ ...selectedParty, balance: newRunning });
    haptic.success();
    setIsAddEntryModalOpen(false);
    setEntryAmount(0);
    setEntryDescription('');
    setEntryBillNo('');
  };

  // WhatsApp share for party statement
  const handleSharePartyStatement = (party: Party) => {
    const partyLedger = ledgers.filter((l) => l.partyId === party.id);
    const balanceText =
      party.balance >= 0
        ? `बाँकी लिनुपर्ने रकम: रु. ${party.balance.toLocaleString('en-IN')}`
        : `तिर्नुपर्ने बाँकी रकम: रु. ${Math.abs(party.balance).toLocaleString('en-IN')}`;

    let msg = `*सत्यवती ट्रेडर्स (फलफूल थोक गोदाम)*\n`;
    msg += `।। श्री सत्यवती माता प्रसन्न ।।\n`;
    msg += `-----------------------------\n`;
    msg += `पार्टी: ${party.name}\n`;
    msg += `फोन: ${party.phone}\n`;
    msg += `मिति: २०८१-०६-०३\n`;
    msg += `*${balanceText}*\n\n`;
    msg += `*पछिल्ला कारोबार विवरण:*\n`;

    partyLedger.slice(0, 5).forEach((l, idx) => {
      msg += `${idx + 1}. ${l.dateBs} - ${l.description} | `;
      if (l.debit > 0) msg += `नामे: रु.${l.debit} `;
      if (l.credit > 0) msg += `जम्मा: रु.${l.credit} `;
      msg += `\n`;
    });

    msg += `\nधन्यवाद! 🙏`;
    const cleanPhone = party.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/977${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[22px] ios-glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8E8E93] font-medium block">
              कुल पार्टी संख्या (Total Parties)
            </span>
            <span className="text-2xl font-bold text-[#1C1C1E] mt-1 block">
              {parties.length} पार्टीहरू
            </span>
            <span className="text-[11px] text-[#8E8E93]">खुद्रा व्यापारी, किसान तथा होटेलहरू</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center border border-[#007AFF]/20">
            <Users size={24} />
          </div>
        </div>

        <div className="rounded-[22px] ios-glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8E8E93] font-medium block">
              बजारबाट लिन बाँकी (Total Receivable - Debit)
            </span>
            <span className="text-2xl font-bold text-[#FF9500] font-mono mt-1 block">
              रु. {totalReceivable.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-[#8E8E93]">खुद्रा ग्राहकहरूले बुझाउन बाँकी उधारो</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center border border-[#FF9500]/20">
            <ArrowUpRight size={24} />
          </div>
        </div>

        <div className="rounded-[22px] ios-glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8E8E93] font-medium block">
              सप्लायरलाई तिर्न बाँकी (Total Payable - Credit)
            </span>
            <span className="text-2xl font-bold text-[#FF3B30] font-mono mt-1 block">
              रु. {totalPayable.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-[#8E8E93]">किसान तथा ट्रक सप्लायरको बाँकी रकम</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center border border-[#FF3B30]/20">
            <ArrowDownLeft size={24} />
          </div>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="rounded-[24px] ios-glass-panel p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1C1C1E] flex items-center gap-2">
            <Users size={20} className="text-[#007AFF]" />
            <span>पार्टी खाता तथा उधारो-जम्मा इतिहास</span>
            <span className="text-xs font-normal text-[#8E8E93]">(Party Khata & Credit / Debit History)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            खुद्रा व्यापारी तथा किसान सप्लायरहरूको लेजर हिसाब, भुक्तानी दाखिला र ह्वाट्सएप स्टेटमेन्ट
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-white/90 border border-stone-200/80 text-xs text-stone-800 focus:outline-none focus:border-orange-500 shadow-sm"
          >
            <option value="all">सबै पार्टी (All Parties)</option>
            <option value="receivable">लिन बाँकी मात्र (Receivable)</option>
            <option value="payable">तिर्न बाँकी मात्र (Payable)</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleDevanagariChange(e, setSearchTerm)}
              onKeyDown={(e) => handleDevanagariKeyDown(e, searchTerm, setSearchTerm)}
              onBlur={() => handleDevanagariBlur(searchTerm, setSearchTerm)}
              placeholder="पार्टी वा फोन खोज्नुहोस् (ram, butwal)..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/90 border border-stone-200/80 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 shadow-sm"
            />
          </div>

          {/* Add Party Button */}
          <button
            type="button"
            onClick={() => setIsAddPartyModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-[0_4px_16px_rgba(245,110,40,0.3)] active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>+ नयाँ पार्टी दर्ता (Add Party)</span>
          </button>
        </div>
      </div>

      {/* Parties Cards Grid */}
      {filteredParties.length === 0 ? (
        <div className="rounded-[24px] ios-glass-panel p-10 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center mx-auto">
            <Users size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#1C1C1E]">
              कुनै पार्टी खाता दर्ता भएको छैन (No Parties Yet)
            </h3>
            <p className="text-xs text-[#8E8E93]">
              तपाईंले नयाँ पार्टी/व्यापारीको नाम आफ्नै तरिकाले थप्न सक्नुहुन्छ।
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic.light();
              setIsAddPartyModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-[#007AFF] text-white text-xs font-semibold hover:bg-[#007AFF]/90 active:scale-95 transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>+ नयाँ पार्टी दर्ता गर्नुहोस् (Add First Party)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParties.map((party) => {
            const isReceivable = party.balance >= 0;
            const partyLedgersCount = ledgers.filter((l) => l.partyId === party.id).length;

            return (
              <div
                key={party.id}
                className="rounded-[22px] ios-glass-card p-5 hover:border-[#007AFF]/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 group-hover:text-orange-600 transition-colors">
                        {party.name}
                      </h3>
                      <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                        <Phone size={11} className="text-orange-500" />
                        <span>{party.phone}</span>
                        <span>•</span>
                        <span>{party.address}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                      {party.type.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Balance Pill */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-stone-50/90 border border-stone-200/60 flex items-center justify-between">
                    <span className="text-xs text-stone-600 font-medium">
                      {isReceivable ? 'लिन बाँकी (Receivable):' : 'तिर्न बाँकी (Payable):'}
                    </span>
                    <span
                      className={`font-mono text-base font-bold ${
                        isReceivable ? 'text-orange-600' : 'text-red-600'
                      }`}
                    >
                      रु. {Math.abs(party.balance).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setSelectedParty(party);
                    }}
                    className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    <FileText size={13} />
                    <span>लेजर इतिहास ({partyLedgersCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      handleSharePartyStatement(party);
                    }}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 active:scale-95 transition-all cursor-pointer"
                    title="ह्वाट्सएपमा हिसाब पठाउनुहोस्"
                  >
                    <Share2 size={15} />
                  </button>

                  {onDeleteParty && (
                    <button
                      type="button"
                      onClick={() => {
                        haptic.light();
                        setPartyToDelete(party);
                      }}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 border border-red-200/80 active:scale-95 transition-all cursor-pointer"
                      title="पार्टी खाता मेटाउनुहोस् (Delete Party)"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ledger Statement Details Modal */}
      {selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 p-6 shadow-2xl space-y-4 text-stone-900 my-auto max-h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-stone-900 font-['Outfit']">
                    {selectedParty.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">
                    {selectedParty.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  फोन: {selectedParty.phone} • ठेगाना: {selectedParty.address}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setEntryAmount(0);
                    setEntryBillNo('');
                    setEntryDescription('');
                    setIsAddEntryModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>+ नयाँ प्रविष्टि</span>
                </button>
                {onDeleteParty && (
                  <button
                    type="button"
                    onClick={() => {
                      haptic.light();
                      setPartyToDelete(selectedParty);
                    }}
                    className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 transition-colors cursor-pointer"
                    title="यो पार्टी खाता मेटाउनुहोस् (Delete Party)"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedParty(null)}
                  className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Current Balance Banner */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 block">वर्तमान मौज्दात (Current Balance)</span>
                <span className="text-xs font-medium text-stone-700">
                  {selectedParty.balance >= 0 ? 'लिन बाँकी (Receivable)' : 'तिर्न बाँकी (Payable)'}
                </span>
              </div>
              <span
                className={`text-xl font-bold font-mono ${
                  selectedParty.balance >= 0 ? 'text-orange-600' : 'text-red-600'
                }`}
              >
                रु. {Math.abs(selectedParty.balance).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Ledger Transactions Table */}
            <div className="flex-1 overflow-y-auto no-scrollbar border border-stone-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-100/90 text-stone-700 font-semibold sticky top-0 border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">मिति</th>
                    <th className="p-2.5">विवरण</th>
                    <th className="p-2.5 text-right text-orange-700">नामे / डेबिट (Debit)</th>
                    <th className="p-2.5 text-right text-emerald-700">जम्मा / क्रेडिट (Credit)</th>
                    <th className="p-2.5 text-right">बाँकी (Balance)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {ledgers
                    .filter((l) => l.partyId === selectedParty.id)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="p-2.5 font-sans text-stone-600">{item.dateBs}</td>
                        <td className="p-2.5 font-sans text-stone-900 font-medium">
                          {item.description}
                          {item.billNumber && (
                            <span className="ml-1 text-[10px] text-orange-600 bg-orange-50 px-1 py-0.5 rounded">
                              {item.billNumber}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right text-orange-700 font-semibold">
                          {item.debit > 0 ? `रु. ${item.debit.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="p-2.5 text-right text-emerald-700 font-semibold">
                          {item.credit > 0 ? `रु. ${item.credit.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-bold text-stone-900">
                          रु. {item.runningBalance.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  {ledgers.filter((l) => l.partyId === selectedParty.id).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-stone-400 font-sans">
                        कुनै कारोबार प्रविष्टि भेटिएन। माथिको "+ नयाँ प्रविष्टि" बाट सुरु गर्नुहोस्।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => handleSharePartyStatement(selectedParty)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Share2 size={14} />
                <span>ह्वाट्सएपमा हिसाब पठाउनुहोस्</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.medium();
                  const defaultSettings: BusinessSettings = settings || {
                    shopName: 'सत्यवती ट्रेडर्स (फलफूल थोक बिक्रेता)',
                    ownerName: 'अशोक पाण्डे',
                    tagline: 'विशुद्ध ताजा फलफूलको भरपर्दो थोक भण्डार',
                    address: 'बुटवल उप-महानगरपालिका-६, फलफूल मण्डी, रुपन्देही',
                    phone: '९८४७००००००',
                    panNumber: '६०१२३४५६७',
                    billTerms: 'बिक्री भएको फलफूल फिर्ता लिइँदैन। ७ दिनभित्र रकम भुक्तानी गर्नुहोला।',
                  };
                  printPartyStatement(selectedParty, ledgers, defaultSettings);
                }}
                className="px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Printer size={14} />
                <span>खाता स्टेटमेन्ट प्रिन्ट</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ledger Entry Sub-Modal */}
      {isAddEntryModalOpen && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl space-y-4 text-stone-900">
            <h3 className="text-base font-bold text-stone-900 font-['Outfit'] border-b border-stone-200 pb-2">
              नयाँ हिसाब प्रविष्टि ({selectedParty.name})
            </h3>

            <form onSubmit={handleCreateLedgerEntry} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 mb-1">प्रविष्टि किसिम</label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none"
                >
                  <option value="रकम_प्राप्त">रकम प्राप्त / जम्मा (Cash In / Received)</option>
                  <option value="बिक्री_उधारो">बिक्री उधारो (Credit Sale / Debit)</option>
                  <option value="रकम_भुक्तान">सप्लायर भुक्तानी दिएको (Payment to Supplier)</option>
                  <option value="खरिद_उधारो">खरिद उधारो (Purchase Credit)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">रकम (रु.) *</label>
                <input
                  type="number"
                  min={1}
                  value={entryAmount || ''}
                  onChange={(e) => setEntryAmount(Number(e.target.value) || 0)}
                  placeholder="रकम प्रविष्टि गर्नुहोस्"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-mono text-right focus:outline-none"
                  required
                />
              </div>

              {/* Easy Date Picker: Auto-captured year, 1-click Month & Day */}
              <EasyDatePicker
                value={entryDateBs}
                onChange={setEntryDateBs}
                label="प्रविष्टि मिति (वि.सं.)"
                required
              />

              {/* Choice Bill Section: Show all bills generated for this person */}
              <div className="space-y-2 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-stone-800 font-bold flex items-center gap-1.5 text-xs">
                    <Receipt size={14} className="text-amber-600" />
                    <span>सम्बन्धित बिल छान्नुहोस् (Choice Bill)</span>
                    <span className="text-[10px] text-stone-500 font-normal">यदि बिल छ भने</span>
                  </label>
                  {entryBillNo && (
                    <button
                      type="button"
                      onClick={() => setEntryBillNo('')}
                      className="text-[10px] text-red-600 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                    >
                      <X size={11} />
                      हटाउनुहोस् (Clear)
                    </button>
                  )}
                </div>

                {selectedPartyBills.length > 0 ? (
                  <div className="space-y-2.5">
                    {/* Dropdown for quick selection */}
                    <div>
                      <select
                        value={entryBillNo}
                        onChange={(e) => {
                          const billNo = e.target.value;
                          setEntryBillNo(billNo);
                          const matched = selectedPartyBills.find((b) => b.billNumber === billNo);
                          if (matched) {
                            if (matched.dueAmount > 0) {
                              setEntryAmount(matched.dueAmount);
                            } else {
                              setEntryAmount(matched.totalAmount);
                            }
                            setEntryDescription(`बिल नं. ${matched.billNumber} को हिसाब`);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-medium focus:outline-none focus:border-amber-500 shadow-xs"
                      >
                        <option value="">-- यस व्यक्तिका बिलहरूबाट छान्नुहोस् ({selectedPartyBills.length} वटा) --</option>
                        {selectedPartyBills.map((b) => (
                          <option key={b.id} value={b.billNumber}>
                            {b.billNumber} | मिति: {b.dateBs} | कुल: रु. {b.totalAmount.toLocaleString('en-IN')}{' '}
                            {b.dueAmount > 0 ? `(बाँकी: रु. ${b.dueAmount.toLocaleString('en-IN')})` : '(चुक्ता)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Visual 1-click selectable bill cards */}
                    <div>
                      <span className="text-[11px] text-stone-600 font-semibold block mb-1">
                        १-क्लिकमा बिल छान्नुहोस् (Tap to Auto-fill Amount & Info):
                      </span>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                        {selectedPartyBills.map((b) => {
                          const isSelected = entryBillNo === b.billNumber;
                          const itemsSummary =
                            b.items?.map((it) => `${it.fruitName} (${it.quantity} ${it.unit})`).join(', ') || '';

                          return (
                            <div
                              key={b.id}
                              onClick={() => {
                                haptic.selection();
                                setEntryBillNo(b.billNumber);
                                if (b.dueAmount > 0) {
                                  setEntryAmount(b.dueAmount);
                                } else {
                                  setEntryAmount(b.totalAmount);
                                }
                                setEntryDescription(`बिल नं. ${b.billNumber} को भुक्तानी`);
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                                isSelected
                                  ? 'bg-amber-100/90 border-amber-500 shadow-sm ring-1 ring-amber-400'
                                  : 'bg-white hover:bg-stone-50 border-stone-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-stone-900 flex items-center gap-1.5 text-xs">
                                  {isSelected && <Check size={13} className="text-amber-600 font-bold" />}
                                  <span>{b.billNumber}</span>
                                </span>
                                <span className="text-[10px] text-stone-500 font-mono">{b.dateBs}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-stone-700 font-mono">
                                  कुल: रु. {b.totalAmount.toLocaleString('en-IN')}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    b.dueAmount > 0
                                      ? 'bg-red-100 text-red-700 font-mono'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {b.dueAmount > 0
                                    ? `बाँकी: रु. ${b.dueAmount.toLocaleString('en-IN')}`
                                    : 'चुक्ता (Paid)'}
                                </span>
                              </div>
                              {itemsSummary && (
                                <p className="text-[10px] text-stone-500 truncate mt-0.5">
                                  📦 {itemsSummary}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-500 text-[11px] leading-relaxed">
                    यस व्यक्तिको नाममा अहिलेसम्म कुनै बिक्री बिल काटिएको छैन। तपाईं तल म्यानुअल बिल नं. प्रविष्टि गर्न सक्नुहुन्छ।
                  </div>
                )}

                {/* Manual Bill Input */}
                <div className="pt-1">
                  <label className="block text-[11px] text-stone-600 mb-0.5">
                    म्यानुअल वा अन्य बिल नं. (वा माथि छानिएको बिल):
                  </label>
                  <input
                    type="text"
                    value={entryBillNo}
                    onChange={(e) => setEntryBillNo(e.target.value)}
                    placeholder="जस्तै: ST-BL-0001 वा बिल-१०३"
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">विवरण / कैफियत</label>
                <input
                  type="text"
                  value={entryDescription}
                  onChange={(e) => handleDevanagariChange(e, setEntryDescription)}
                  onKeyDown={(e) => handleDevanagariKeyDown(e, entryDescription, setEntryDescription)}
                  onBlur={() => handleDevanagariBlur(entryDescription, setEntryDescription)}
                  placeholder="जस्तै: ई-सेवा वा बैंक मार्फत प्राप्त"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddEntryModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 cursor-pointer"
                >
                  रद्द
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-orange-500 text-white font-semibold cursor-pointer"
                >
                  सुरक्षित गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Party Modal */}
      {isAddPartyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 p-6 shadow-2xl space-y-4 text-stone-900">
            <h3 className="text-base font-bold text-stone-900 font-['Outfit'] border-b border-stone-200 pb-2">
              नयाँ पार्टी खाता खोल्नुहोस् (Add New Party)
            </h3>

            <form onSubmit={handleCreateParty} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">पार्टी वा व्यक्तिको नाम *</label>
                <input
                  type="text"
                  value={newPartyName}
                  onChange={(e) => handleDevanagariChange(e, setNewPartyName)}
                  onKeyDown={(e) => handleDevanagariKeyDown(e, newPartyName, setNewPartyName)}
                  onBlur={() => handleDevanagariBlur(newPartyName, setNewPartyName)}
                  placeholder="जस्तै: बुटवल फ्रुट सेन्टर"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-orange-500 shadow-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">पार्टी किसिम</label>
                  <select
                    value={newPartyType}
                    onChange={(e) => setNewPartyType(e.target.value as PartyType)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none shadow-sm"
                  >
                    <option value="खुद्रा_व्यापारी">खुद्रा व्यापारी</option>
                    <option value="किसान_सप्लायर">किसान / सप्लायर</option>
                    <option value="होटेल_क्याटरिङ">होटेल / क्याटरिङ</option>
                    <option value="ठेला_व्यापारी">ठेला व्यापारी</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">मोबाइल नं.</label>
                  <input
                    type="text"
                    value={newPartyPhone}
                    onChange={(e) => setNewPartyPhone(e.target.value)}
                    placeholder="९८४७००००००"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">ठेगाना</label>
                <input
                  type="text"
                  value={newPartyAddress}
                  onChange={(e) => handleDevanagariChange(e, setNewPartyAddress)}
                  onKeyDown={(e) => handleDevanagariKeyDown(e, newPartyAddress, setNewPartyAddress)}
                  onBlur={() => handleDevanagariBlur(newPartyAddress, setNewPartyAddress)}
                  placeholder="जस्तै: मिलनचोक, बुटवल"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1">सुरुवाती बाँकी रकम (+ लिन बाँकी / - तिर्न बाँकी)</label>
                <input
                  type="number"
                  value={newPartyInitialBalance || ''}
                  onChange={(e) => setNewPartyInitialBalance(Number(e.target.value) || 0)}
                  placeholder="०"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-mono text-right focus:outline-none shadow-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddPartyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors cursor-pointer"
                >
                  रद्द
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 text-white font-semibold shadow-md active:scale-95 cursor-pointer"
                >
                  पार्टी खाता खोल्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Party Confirmation Modal */}
      {partyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-stone-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  पार्टी खाता मेटाउने निश्चित गर्नुहोस् (Delete Party)
                </h3>
                <p className="text-xs text-stone-500">पार्टी वा ग्राहक विवरण हटाउँदै हुनुहुन्छ</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-stone-700">
                के तपाईं साँच्चै <strong className="text-stone-900 font-bold">"{partyToDelete.name}"</strong> को खाता सूचीबाट मेटाउन चाहनुहुन्छ?
              </p>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">सम्पर्क नम्बर:</span>
                  <span className="font-semibold text-stone-800">{partyToDelete.phone || 'उपलब्ध छैन'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">ठेगाना:</span>
                  <span className="font-semibold text-stone-800">{partyToDelete.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">वर्तमान मौज्दात:</span>
                  <span
                    className={`font-mono font-bold ${
                      partyToDelete.balance > 0
                        ? 'text-orange-600'
                        : partyToDelete.balance < 0
                        ? 'text-red-600'
                        : 'text-stone-700'
                    }`}
                  >
                    रु. {Math.abs(partyToDelete.balance).toLocaleString('en-IN')}{' '}
                    {partyToDelete.balance > 0 ? '(लिन बाँकी)' : partyToDelete.balance < 0 ? '(तिर्न बाँकी)' : '(०)'}
                  </span>
                </div>
              </div>

              {partyToDelete.balance !== 0 && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>सावधानी:</strong> यस पार्टीको खातामा रु. {Math.abs(partyToDelete.balance).toLocaleString('en-IN')} मौज्दात बाँकी छ। मेटाएमा यो पार्टी सूचीबाट हट्नेछ।
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setPartyToDelete(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                रद्द गर्नुहोस् (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteParty) {
                    onDeleteParty(partyToDelete.id);
                  }
                  if (selectedParty?.id === partyToDelete.id) {
                    setSelectedParty(null);
                  }
                  haptic.medium();
                  setPartyToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>मेटाउनुहोस् (Confirm Delete)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
