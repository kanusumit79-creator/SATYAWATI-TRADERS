import React, { useState, useRef } from 'react';
import {
  FruitItem,
  Party,
  SaleBill,
  StockArrival,
  DailyExpense,
  LedgerEntry,
  BusinessSettings,
} from '../types';
import {
  generateBackupData,
  sendBackupEmail,
  downloadBackupFile,
  validateBackupJson,
  AppBackupData,
} from '../utils/backupRestore';
import { haptic } from '../utils/haptics';
import {
  X,
  Mail,
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  Database,
  HelpCircle,
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  fruits: FruitItem[];
  parties: Party[];
  bills: SaleBill[];
  stockArrivals: StockArrival[];
  expenses: DailyExpense[];
  ledgers: LedgerEntry[];
  settings: BusinessSettings;
  onRestoreData: (backup: AppBackupData) => void;
}

export function BackupRestoreModal({
  isOpen,
  onClose,
  fruits,
  parties,
  bills,
  stockArrivals,
  expenses,
  ledgers,
  settings,
  onRestoreData,
}: BackupRestoreModalProps) {
  const [recipientEmail, setRecipientEmail] = useState('kanusumit79@gmail.com');
  const [backupSuccessMsg, setBackupSuccessMsg] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [pendingRestoreData, setPendingRestoreData] = useState<AppBackupData | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [showHowTo, setShowHowTo] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Generate current dataset backup
  const currentBackup = generateBackupData(
    fruits,
    parties,
    bills,
    stockArrivals,
    expenses,
    ledgers,
    settings
  );

  const handleSendEmailBackup = () => {
    haptic.success();
    sendBackupEmail(currentBackup, recipientEmail.trim() || 'kanusumit79@gmail.com');
    setBackupSuccessMsg(
      `ब्याकअप फाइल डाउनलोड भयो र ${recipientEmail} मा इमेल तयार भयो! यसलाई आफ्नो इमेलमा सेभ गर्नुहोस्।`
    );
    setTimeout(() => setBackupSuccessMsg(''), 6000);
  };

  const handleDownloadOnly = () => {
    haptic.medium();
    const filename = downloadBackupFile(currentBackup);
    setBackupSuccessMsg(`"${filename}" तपाईंको डिभाइसमा सफलतापूर्वक डाउनलोड भयो!`);
    setTimeout(() => setBackupSuccessMsg(''), 5000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        const result = validateBackupJson(parsed);

        if (!result.isValid || !result.data) {
          setRestoreError(result.error || 'अमान्य ब्याकअप फाइल: कृपया सही .json फाइल छान्नुहोस्।');
          haptic.warning();
          return;
        }

        haptic.selection();
        setPendingRestoreData(result.data);
      } catch {
        setRestoreError('फाइल पढ्न सकिएन। कृपया सही .json फाइल छान्नुहोस्।');
        haptic.warning();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (!pendingRestoreData) return;
    haptic.success();
    onRestoreData(pendingRestoreData);
    setRestoreSuccess(true);
    setTimeout(() => {
      setRestoreSuccess(false);
      setPendingRestoreData(null);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                डाटा ब्याकअप तथा नयाँ डिभाइसमा सार्ने (Backup & Restore)
              </h2>
              <p className="text-xs text-stone-300">
                एप डिलिट भएमा वा ल्यापटप/नयाँ फोनमा पुरानो डाटा ल्याउने तरिका
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Current Shop Data Overview */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-stone-800 block text-sm">
                हाल पसलको सुरक्षित डाटा:
              </span>
              <span className="text-stone-700">
                {bills.length} वटा बिल • {parties.length} पार्टी खाता • {fruits.length} फलफूल
                स्टक • {expenses.length} खर्च रेकर्ड
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1.5">
              <ShieldCheck size={14} />
              सुरक्षित
            </div>
          </div>

          {backupSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{backupSuccessMsg}</span>
            </div>
          )}

          {/* STEP 1: CREATE BACKUP */}
          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  १
                </span>
                <h3 className="text-sm font-bold text-stone-900">
                  डाटा ब्याकअप लिनुहोस् (Download / Send to Email)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-blue-700">दैनिक सिफारिस</span>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              यसले तपाईंको सबै बिलहरू, पार्टीको उधारो हिसाब र स्टकको सुरक्षित फाइल बनाउँछ।
              यो फाइल इमेलमा पठाउनुहोस् वा सिधै डाउनलोड गर्नुहोस्।
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="इमेल (e.g. kanusumit79@gmail.com)"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs font-mono text-stone-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendEmailBackup}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Mail size={15} />
                  इमेलमा ब्याकअप पठाउनुहोस्
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDownloadOnly}
                  className="text-xs text-stone-700 hover:text-stone-900 underline flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <Download size={13} />
                  वा केवल डिभाइसमा .json ब्याकअप फाइल डाउनलोड गर्नुहोस्
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: RESTORE WHEN MOVED OR DELETED */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                  २
                </span>
                <h3 className="text-sm font-bold text-stone-900">
                  नयाँ ल्यापटप/फोनमा डाटा कसरी ल्याउने? (Restore Data)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">१ सेकेन्डमै फिर्ता</span>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              यदि एप डिलिट भयो वा तपाईंले <strong>ल्यापटप / नयाँ मोबाइल</strong>मा एप खोल्नुभयो भने,
              अघि इमेल वा फोनमा सेभ गरेको <span className="font-mono font-bold text-stone-900">.json</span> ब्याकअप फाइल यहाँ अपलोड गर्नुहोस्:
            </p>

            <div className="space-y-3 pt-1">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-white hover:bg-emerald-50/40 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Upload size={18} className="text-emerald-600" />
                ब्याकअप फाइल छान्नुहोस् र अपलोड गर्नुहोस् (.json Restore)
              </button>

              {restoreError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              {/* Confirmation Preview */}
              {pendingRestoreData && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <FileCheck2 size={18} className="text-amber-700" />
                    <span>ब्याकअप फाइल प्रमाणित भयो! के यो डाटा लोड गर्न चाहनुहुन्छ?</span>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-amber-200 text-xs text-stone-800 space-y-1.5">
                    <p className="font-semibold text-stone-900">
                      📅 ब्याकअप मिति: {pendingRestoreData.formattedDate || pendingRestoreData.exportDate}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <span className="bg-stone-50 p-1.5 rounded border border-stone-200">
                        📄 बिलहरू: {pendingRestoreData.bills.length} वटा
                      </span>
                      <span className="bg-stone-50 p-1.5 rounded border border-stone-200">
                        👥 पार्टी खाता: {pendingRestoreData.parties.length} जना
                      </span>
                      <span className="bg-stone-50 p-1.5 rounded border border-stone-200">
                        🍎 फलफूल स्टक: {pendingRestoreData.fruits.length} प्रकार
                      </span>
                      <span className="bg-stone-50 p-1.5 rounded border border-stone-200">
                        💰 खर्च रेकर्ड: {pendingRestoreData.expenses.length} वटा
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmRestore}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 size={15} />
                      हो, सबै डाटा तुरुन्तै रिस्टोर गर्नुहोस् (Confirm Restore)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingRestoreData(null)}
                      className="px-3 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
                    >
                      रद्द गर्नुहोस्
                    </button>
                  </div>
                </div>
              )}

              {restoreSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 size={18} />
                  <span>बधाई छ! सबै डाटा सफलतापूर्वक पुनःस्थापना (Restore) भयो।</span>
                </div>
              )}
            </div>
          </div>

          {/* Migration & Safety Visual Guide */}
          <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 text-xs text-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <HelpCircle size={16} className="text-amber-600" />
                <span>फोन हराएमा वा ल्यापटपमा सार्दा के गर्ने? (Detailed Guide)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHowTo(!showHowTo)}
                className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                {showHowTo ? 'लुकाउनुहोस्' : 'हेर्नुहोस्'}
              </button>
            </div>

            {showHowTo && (
              <div className="space-y-2 pt-1 text-[11px] text-stone-700 leading-relaxed border-t border-stone-200/80">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    A
                  </div>
                  <div>
                    <strong className="text-stone-900">दैनिक ब्याकअप बानी:</strong> प्रत्येक साँझ पसल बन्द गर्दा माथिको <strong>"इमेलमा ब्याकअप पठाउनुहोस्"</strong> बटन थिच्नुहोस्। यसले तपाईंको जिमेलमा ब्याकअप फाइल सुरक्षित राख्छ।
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    B
                  </div>
                  <div>
                    <strong className="text-stone-900">नयाँ ल्यापटप वा नयाँ फोनमा खोल्दा:</strong> नयाँ ल्यापटपको ब्राउजरमा एप खोल्नुहोस्। त्यहाँ माथि रहेको <strong>"ब्याकअप / Restore"</strong> बटन थिचेर इमेलबाट डाउनलोड गरेको फाइल छान्नुहोस्।
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    C
                  </div>
                  <div>
                    <strong className="text-stone-900">कुनै पनि डाटा हराउँदैन:</strong> यो फाइलमा तपाईंको सबै ग्राहकको नाम, फोन नम्बर, उधारो हिसाब, पुराना बिलहरू र स्टक सुरक्षित रहने भएकाले एप डिलिट भए पनि केही फरक पर्दैन।
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-700">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" />
            सत्यवती ट्रेडर्स • तपाईंको डाटा पूर्ण रूपमा तपाईंको नियन्त्रणमा छ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold cursor-pointer transition-colors"
          >
            बन्द गर्नुहोस्
          </button>
        </div>
      </div>
    </div>
  );
}
