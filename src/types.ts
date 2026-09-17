export type UnitType = 'गोटा' | 'क्यारेट' | 'कार्टुन' | 'पेटी' | 'बोरा' | 'केजी' | 'दर्जन' | 'घार' | 'क्रेट' | 'अन्य';

export type FruitCategory = 'स्याउ' | 'सुन्तला' | 'केरा' | 'आँप' | 'अंगुर' | 'अनार' | 'नरिवल' | 'भुइँकटहर' | 'किवी' | 'अन्य फलफूल';

export interface FruitItem {
  id: string;
  nameNepali: string;
  nameEnglish?: string;
  category?: FruitCategory | string;
  stockQuantity: number; // in numbers / units
  unit: UnitType;
  minAlert?: number;
  costPrice?: number; // optional, not required for simple workflow
  sellingPrice?: number; // optional rate of 1
  origin?: string; // optional
  imageEmoji?: string;
  lastUpdated?: string;
  godamRack?: string;
}

export type OrderStatus = 'पेन्डिङ' | 'तयारीमा' | 'सम्पन्न' | 'रद्द';

export interface WholesaleOrder {
  id: string;
  orderNumber: string;
  orderDateBs: string;
  deliveryDateBs: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: BillItem[];
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  status: OrderStatus;
  notes?: string;
  convertedBillId?: string;
}

export interface BillItem {
  fruitId: string;
  fruitName: string;
  fruitNameEnglish?: string;
  unit: UnitType;
  quantity: number;
  rate: number;
  total: number;
}

export interface SaleBill {
  id: string;
  billNumber: string;
  dateBs: string;
  dateAd: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentType: 'नगद' | 'उधारो' | 'आंशिक';
  notes?: string;
  status: 'सम्पन्न' | 'रद्द';
}

export interface ArrivalItem {
  fruitId: string;
  fruitName: string;
  fruitNameEnglish?: string;
  unit: UnitType;
  quantity: number;
  costRate: number; // खरिद दर प्रति इकाई
  totalCost: number; // quantity * costRate
}

export interface StockArrival {
  id: string;
  dateBs: string;
  supplierName: string;
  driverName: string; // गाडी चालकको नाम (Driver Name)
  vehicleNumber?: string; // गाडी नं. (वैकल्पिक)
  items?: ArrivalItem[]; // गाडीमा एकसाथ आएका सबै फलफूलहरूको सूची (Multi-fruit cumulated list)
  // Backwards compatibility for single fruit arrivals:
  fruitId?: string;
  fruitName?: string;
  fruitNameEnglish?: string;
  unit?: UnitType;
  quantity?: number;
  costRate?: number;
  totalCost: number; // कुल सामान मूल्य
  transportationCost?: number; // गाडी भाडा / ढुवानी
  laborCost?: number; // लेबर ज्याला
  grandTotalCost?: number; // कुल खरिद + भाडा + ज्याला
  paidAmount: number;
  dueAmount: number;
  notes?: string;
}

export interface WastageRecord {
  id: string;
  dateBs: string;
  fruitId: string;
  fruitName: string;
  unit: UnitType;
  quantity: number;
  reason: 'ढुवानीमा थिचिएको' | 'धेरै पाकेर सडेको' | 'दागी/कमसल' | 'अन्य';
  estimatedLossAmount: number;
  notes?: string;
}

export type PartyType = 'खुद्रा_व्यापारी' | 'किसान_सप्लायर' | 'होटेल_क्याटरिङ' | 'ठेला_व्यापारी' | 'सुपरमार्केट_स्टोर';

export interface Party {
  id: string;
  name: string;
  type: PartyType;
  phone: string;
  address: string;
  balance: number; // positive = लिन बाँकी, negative = तिर्न बाँकी
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  partyId: string;
  dateBs: string;
  type: 'बिक्री_उधारो' | 'खरिद_उधारो' | 'रकम_प्राप्त' | 'रकम_भुक्तान';
  description: string;
  billNumber?: string;
  debit: number; // लिन बढेको / दिएको रकम
  credit: number; // आएको रकम / तिर्नु पर्ने
  runningBalance: number;
}

export interface DailyExpense {
  id: string;
  dateBs: string;
  category: 'लेबर_ज्याला' | 'ढुवानी_भाडा' | 'चिया_खाजा' | 'पसल_खर्च' | 'विविध';
  amount: number;
  notes: string;
}

export interface BusinessSettings {
  shopName: string;
  ownerName: string;
  tagline: string;
  address: string;
  phone: string;
  panNumber?: string;
  billTerms: string;
}

// Strictly the 4 core sections requested by user
export type ActiveTab = 'billing' | 'stock' | 'parties' | 'owner';
