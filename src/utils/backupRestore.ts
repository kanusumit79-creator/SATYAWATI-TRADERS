import {
  FruitItem,
  Party,
  SaleBill,
  StockArrival,
  DailyExpense,
  LedgerEntry,
  BusinessSettings,
} from '../types';

export interface AppBackupData {
  version: string;
  appName: string;
  exportDate: string;
  formattedDate: string;
  summary: {
    totalBills: number;
    totalSalesAmount: number;
    totalParties: number;
    totalCreditDue: number;
    totalStockItems: number;
    totalArrivals: number;
    totalExpenses: number;
  };
  fruits: FruitItem[];
  parties: Party[];
  bills: SaleBill[];
  stockArrivals: StockArrival[];
  expenses: DailyExpense[];
  ledgers: LedgerEntry[];
  settings: BusinessSettings;
}

/**
 * Generates structured backup object with metadata & summary
 */
export function generateBackupData(
  fruits: FruitItem[],
  parties: Party[],
  bills: SaleBill[],
  stockArrivals: StockArrival[],
  expenses: DailyExpense[],
  ledgers: LedgerEntry[],
  settings: BusinessSettings
): AppBackupData {
  const totalSalesAmount = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalCreditDue = parties
    .filter((p) => p.balance > 0)
    .reduce((sum, p) => sum + p.balance, 0);

  const now = new Date();
  const formattedDate = now.toLocaleDateString('ne-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return {
    version: '2.0.0',
    appName: 'सत्यवती डिजिटल मन्डी ब्याकअप (Satyawati Mandi)',
    exportDate: now.toISOString(),
    formattedDate,
    summary: {
      totalBills: bills.length,
      totalSalesAmount,
      totalParties: parties.length,
      totalCreditDue,
      totalStockItems: fruits.length,
      totalArrivals: stockArrivals.length,
      totalExpenses: expenses.length,
    },
    fruits,
    parties,
    bills,
    stockArrivals,
    expenses,
    ledgers,
    settings,
  };
}

/**
 * Triggers browser download of the backup JSON file
 */
export function downloadBackupFile(backup: AppBackupData): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `satyawati_mandi_backup_${dateStr}.json`;
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return filename;
}

/**
 * Opens email client with pre-filled backup summary and instructions
 */
export function sendBackupEmail(
  backup: AppBackupData,
  recipientEmail: string = 'kanusumit79@gmail.com'
): void {
  // 1. Download JSON file locally to computer/phone
  const filename = downloadBackupFile(backup);

  const dateStr = new Date().toLocaleDateString('ne-NP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = encodeURIComponent(
    `[सत्यवती मन्डी] सुरक्षित डाटा ब्याकअप - ${dateStr}`
  );

  const bodyText = `नमस्ते अशोक पाण्डे जी,

सत्यवती ट्रेडर्स (फलफूल थोक बिक्रेता, बुटवल) को सम्पूर्ण पसल डाटा ब्याकअप विवरण:

--------------------------------------------------
📅 ब्याकअप मिति: ${dateStr} (${new Date().toLocaleTimeString()})
📁 ब्याकअप फाइल: ${filename} (तपाईंको फोन/कम्प्युटरमा डाउनलोड भइसकेको छ)

📊 पसलको संक्षिप्त विवरण:
• जम्मा काटिएका बिलहरू: ${backup.summary.totalBills} वटा
• हालसम्मको बिक्री: रु ${backup.summary.totalSalesAmount.toLocaleString('en-IN')}
• बजारमा उठ्न बाँकी उधारो (Credit Due): रु ${backup.summary.totalCreditDue.toLocaleString('en-IN')}
• खाता सूचीमा रहेका पार्टी/व्यापारी: ${backup.summary.totalParties} जना
• स्टक सूचीका फलफूल आइटमहरू: ${backup.summary.totalStockItems} प्रकार
• गाडी दाखिला रेकर्ड: ${backup.summary.totalArrivals} वटा
• पसल खर्च रेकर्ड: ${backup.summary.totalExpenses} वटा
--------------------------------------------------

⚠️ फोन हराएमा, एप डिलिट भएमा वा ल्यापटपमा सार्नका लागि (Restore Guide):
१. डाउनलोड भएको "${filename}" फाइललाई आफ्नो जिमेल वा गुगल ड्राइभमा सुरक्षित राख्नुहोस्।
२. नयाँ ल्यापटप वा फोनमा एपको लिङ्क खोल्नुहोस्।
३. माथि रहेको "ब्याकअप / Restore" बटन थिच्नुहोस्।
४. "ब्याकअप फाइल अपलोड गर्नुहोस् (.json Restore)" मा क्लिक गरेर सो फाइल छान्नुहोस्।
५. १ सेकेन्डमै तपाईंको सबै बिल, पार्टीको उधारो हिसाब र फलफूल स्टक नयाँ डिभाइसमा जस्ताको तस्तै फिर्ता आउनेछ।

धन्यवाद,
सत्यवती डिजिटल मन्डी बिलिङ प्रणाली`;

  const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;

  // Open email client
  window.location.href = mailtoUrl;
}

/**
 * Validates parsed backup JSON content
 */
export function validateBackupJson(jsonObj: unknown): { isValid: boolean; error?: string; data?: AppBackupData } {
  if (!jsonObj || typeof jsonObj !== 'object') {
    return { isValid: false, error: 'अमान्य फाइल ढाँचा: कृपया सही .json ब्याकअप फाइल छान्नुहोस्।' };
  }

  const obj = jsonObj as Record<string, unknown>;

  if (!Array.isArray(obj.fruits)) {
    return { isValid: false, error: 'अमान्य फाइल: फलफूल स्टक डाटा फेला परेन।' };
  }
  if (!Array.isArray(obj.parties)) {
    return { isValid: false, error: 'अमान्य फाइल: पार्टी खाता डाटा फेला परेन।' };
  }
  if (!Array.isArray(obj.bills)) {
    return { isValid: false, error: 'अमान्य फाइल: बिलिङ डाटा फेला परेन।' };
  }

  const backupData: AppBackupData = {
    version: typeof obj.version === 'string' ? obj.version : '2.0.0',
    appName: typeof obj.appName === 'string' ? obj.appName : 'Satyawati Backup',
    exportDate: typeof obj.exportDate === 'string' ? obj.exportDate : new Date().toISOString(),
    formattedDate: typeof obj.formattedDate === 'string' ? obj.formattedDate : '',
    summary: (obj.summary as AppBackupData['summary']) || {
      totalBills: obj.bills.length,
      totalSalesAmount: 0,
      totalParties: obj.parties.length,
      totalCreditDue: 0,
      totalStockItems: obj.fruits.length,
      totalArrivals: Array.isArray(obj.stockArrivals) ? obj.stockArrivals.length : 0,
      totalExpenses: Array.isArray(obj.expenses) ? obj.expenses.length : 0,
    },
    fruits: obj.fruits as FruitItem[],
    parties: obj.parties as Party[],
    bills: obj.bills as SaleBill[],
    stockArrivals: Array.isArray(obj.stockArrivals) ? (obj.stockArrivals as StockArrival[]) : [],
    expenses: Array.isArray(obj.expenses) ? (obj.expenses as DailyExpense[]) : [],
    ledgers: Array.isArray(obj.ledgers) ? (obj.ledgers as LedgerEntry[]) : [],
    settings: (obj.settings as BusinessSettings) || {
      shopName: 'सत्यवती ट्रेडर्स (फलफूल थोक बिक्रेता)',
      ownerName: 'अशोक पाण्डे',
      tagline: 'सत्यवती मन्डी बुटवल',
      address: 'बुटवल फलफूल तथा तरकारी थोक मन्डी, स्टल नं. १२',
      phone: '9857012345, 9801234567',
      panNumber: '601234567',
      billTerms: 'बिक्री भएको फलफूल फिर्ता लिइने छैन।',
    },
  };

  return { isValid: true, data: backupData };
}
