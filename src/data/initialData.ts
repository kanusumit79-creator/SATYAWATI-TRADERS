import {
  FruitItem,
  Party,
  SaleBill,
  StockArrival,
  BusinessSettings,
  DailyExpense,
  LedgerEntry,
} from '../types';

export const INITIAL_SETTINGS: BusinessSettings = {
  shopName: 'सत्यवती ट्रेडर्स',
  ownerName: 'बृजेश कुमार (प्रो.)',
  tagline: 'ताजा फलफूल थोक बिक्रेता • थोक मण्डी बुटवल',
  address: 'फलफूल थोक बजार मण्डी, बुटवल-६, रुपन्देही',
  phone: '९८५७०१२३४५, ९८०४४५६७८९',
  panNumber: '६०१२३४५६७',
  billTerms: '१. सामान बुझेपछि तुरुन्त जाँच गर्नुहोला। २. उधारो भुक्तानी १५ दिनभित्र गरिसक्नुपर्नेछ। ३. बिग्रिएको सामानको गुनासो सोही दिन मान्य हुनेछ।',
};

// All data initialized to NIL (empty arrays) as requested: "jammai data lai nil rakha na new app banako jammai ma afai add grxu"
export const INITIAL_FRUITS: FruitItem[] = [];

export const INITIAL_PARTIES: Party[] = [];

export const INITIAL_BILLS: SaleBill[] = [];

export const INITIAL_STOCK_ARRIVALS: StockArrival[] = [];

export const INITIAL_EXPENSES: DailyExpense[] = [];

export const INITIAL_LEDGERS: LedgerEntry[] = [];
