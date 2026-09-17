import React, { useState } from 'react';
import { SaleBill, BusinessSettings } from '../types';
import { printInvoice, downloadInvoiceHtml, PrintFormat } from '../utils/printInvoice';
import { SHOP_LOGO_DATA_URL, toCaps, getUnitInCaps } from '../utils/shopLogo';
import { haptic } from '../utils/haptics';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  Receipt,
  Download,
  FileText,
} from 'lucide-react';

interface InvoiceModalProps {
  bill: SaleBill;
  settings: BusinessSettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  bill,
  settings,
  onClose,
}) => {
  const [printFormat, setPrintFormat] = useState<PrintFormat>('standard');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Direct WhatsApp Share (All English words in CAPS LOCK)
  const handleDirectWhatsAppShare = () => {
    let cleanPhone = bill.customerPhone ? bill.customerPhone.replace(/[^0-9]/g, '') : '';
    if (cleanPhone.length === 10) {
      cleanPhone = '977' + cleanPhone; // Nepal country code
    }

    const itemsSummary = bill.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.fruitName} ${it.fruitNameEnglish ? `(${toCaps(it.fruitNameEnglish)})` : ''} - ${it.quantity} ${getUnitInCaps(it.unit)} @ रु.${it.rate.toLocaleString('en-IN')} = रु.${it.total.toLocaleString('en-IN')}`
      )
      .join('\n');

    const message = `।। श्री सत्यवती माता प्रसन्न ।।\n*${toCaps(settings.shopName)} (SATYAWATI TRADERS)*\n*WHOLESALE FRUIT MERCHANTS*\n📍 ${settings.address}\n📞 TEL: ${settings.phone}\n\n*WHOLESALE INVOICE / बिक्री बीजक*\nBILL NO: ${bill.billNumber}\nDATE: ${bill.dateBs}\nCUSTOMER: ${toCaps(bill.customerName)}\nPHONE: ${bill.customerPhone || '-'}\n----------------------------------\n${itemsSummary}\n----------------------------------\n${bill.discount > 0 ? `SUBTOTAL: रु. ${bill.subtotal.toLocaleString('en-IN')}\nDISCOUNT: - रु. ${bill.discount.toLocaleString('en-IN')}\n` : ''}*TOTAL AMOUNT: रु. ${bill.totalAmount.toLocaleString('en-IN')}*\nPAID AMOUNT (CASH): रु. ${bill.paidAmount.toLocaleString('en-IN')}\n${bill.dueAmount > 0 ? `*BALANCE DUE: रु. ${bill.dueAmount.toLocaleString('en-IN')}*` : '*PAID IN FULL / पूरा चुक्ता*'}\nPAYMENT MODE: ${toCaps(bill.paymentType)}\n\nTHANK YOU! VISIT AGAIN • धन्यवाद! 🙏`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(whatsappUrl, '_blank');
  };

  // Direct Print via isolated print engine
  const handleDirectPrint = () => {
    haptic.medium();
    printInvoice(bill, settings, printFormat);
  };

  // Download printable standalone bill
  const handleDownload = () => {
    haptic.light();
    downloadInvoiceHtml(bill, settings, printFormat);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden text-stone-900 animate-fadeIn my-auto">
        {/* Modal Top Control Bar */}
        <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt size={17} className="text-[#007AFF]" />
            <span className="text-xs font-bold text-stone-900 tracking-wide">
              BILL NO: <strong className="font-mono text-sm">{bill.billNumber}</strong>
            </span>
          </div>

          {/* Format Toggle: Standard A4/A5 vs 80mm Thermal */}
          <div className="flex items-center p-1 rounded-xl bg-stone-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPrintFormat('standard')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                printFormat === 'standard'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText size={13} />
              <span>A4/A5 INVOICE</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintFormat('thermal')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                printFormat === 'thermal'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Receipt size={13} />
              <span>80MM THERMAL</span>
            </button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
            title="CLOSE"
          >
            <X size={16} />
          </button>
        </div>

        {/* Invoice Printable Area */}
        <div
          id="invoice-printable-area"
          className={`p-6 sm:p-7 bg-white text-stone-900 ${
            printFormat === 'thermal' ? 'max-w-md mx-auto border-x border-dashed border-stone-300' : ''
          }`}
        >
          {/* Header with Proper Shop Logo & Sacred Invocations */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-stone-200">
            <div className="flex items-center gap-3.5">
              <img
                src={SHOP_LOGO_DATA_URL}
                alt="SATYAWATI TRADERS LOGO"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-400 shadow-sm shrink-0"
              />
              <div>
                <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                  <span>🚩</span>
                  <span>।। श्री सत्यवती माता प्रसन्न ।। • SHREE SATYAWATI MATA PRASANNA</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#007AFF] tracking-tight leading-tight">
                  {settings.shopName} <span className="text-base text-stone-800 font-extrabold">(SATYAWATI TRADERS)</span>
                </h1>
                <p className="text-xs font-bold text-stone-600">WHOLESALE FRUIT MERCHANTS • थोक फलफूल बिक्रेता</p>
                <p className="text-[11px] text-stone-500 font-medium">
                  {settings.address} | TEL: {settings.phone}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-[#007AFF] font-extrabold text-[11px] border border-blue-200 mb-1 tracking-wide">
                {printFormat === 'thermal' ? '80MM THERMAL RECEIPT' : 'WHOLESALE INVOICE'}
              </span>
              <p className="text-xs font-mono font-bold text-stone-900">BILL NO: {bill.billNumber}</p>
              <p className="text-[11px] text-stone-500 font-mono font-bold">PAN NO: {settings.panNumber || '-'}</p>
            </div>
          </div>

          {/* Customer & Bill Meta */}
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-stone-200 text-xs bg-stone-50/70 px-3 my-2 rounded-xl">
            <div>
              <span className="text-stone-500 text-[10px] block uppercase font-extrabold">
                CUSTOMER / PARTY NAME:
              </span>
              <span className="text-sm font-extrabold text-stone-900 block mt-0.5">
                {toCaps(bill.customerName)}
              </span>
              {bill.customerPhone && (
                <span className="text-stone-600 font-mono text-[11px] block mt-0.5 font-bold">
                  PHONE: {bill.customerPhone}
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-stone-500 text-[10px] block uppercase font-extrabold">
                INVOICE DATE:
              </span>
              <span className="font-bold text-stone-900 block mt-0.5">
                DATE: {bill.dateBs}
              </span>
              <span className="text-stone-600 text-[11px] block mt-0.5 font-bold">
                PAYMENT: <strong className="text-stone-900 uppercase">{toCaps(bill.paymentType)}</strong>
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-stone-200 text-[11px] font-extrabold text-stone-700 bg-stone-100/70">
                  <th className="py-2 px-2 text-center w-8">SN</th>
                  <th className="py-2 px-2">ITEM DESCRIPTION</th>
                  <th className="py-2 px-2 text-center">QTY & UNIT</th>
                  <th className="py-2 px-2 text-right">RATE (RS.)</th>
                  <th className="py-2 px-2 text-right">TOTAL (RS.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {bill.items.map((item, index) => (
                  <tr key={index} className="hover:bg-stone-50/50">
                    <td className="py-2 px-2 text-center text-stone-400 font-mono">{index + 1}</td>
                    <td className="py-2 px-2">
                      <div className="font-bold text-stone-900">
                        {item.fruitName || (item as any).fruitNameNepali}
                        {item.fruitNameEnglish && (
                          <span className="text-[11px] text-stone-500 font-bold ml-1.5">
                            - {toCaps(item.fruitNameEnglish)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-stone-800">
                      {item.quantity} {getUnitInCaps(item.unit)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-stone-700 font-medium">
                      रु. {item.rate.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-black text-stone-900">
                      रु. {item.total.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations / Summary */}
          <div className="pt-2 border-t border-stone-200 flex justify-end">
            <div className="w-72 space-y-1.5 text-xs">
              {bill.discount > 0 && (
                <>
                  <div className="flex justify-between text-stone-600 font-semibold px-2">
                    <span>SUBTOTAL:</span>
                    <span className="font-mono font-bold">
                      रु. {bill.subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-semibold px-2">
                    <span>DISCOUNT:</span>
                    <span className="font-mono font-bold">
                      - रु. {bill.discount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-base font-black text-[#007AFF] px-2 py-1 bg-blue-50/80 rounded-lg border border-blue-100">
                <span>TOTAL AMOUNT:</span>
                <span className="font-mono">रु. {bill.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold px-2 py-0.5">
                <span>PAID AMOUNT (CASH):</span>
                <span className="font-mono">रु. {bill.paidAmount.toLocaleString('en-IN')}</span>
              </div>
              {bill.dueAmount > 0 ? (
                <div className="flex justify-between text-red-600 font-black bg-red-50 p-2 rounded-lg border border-red-100">
                  <span>BALANCE DUE:</span>
                  <span className="font-mono">रु. {bill.dueAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="text-center text-emerald-700 font-black bg-emerald-50 p-1.5 rounded-lg border border-emerald-200 text-xs tracking-wide">
                  ✓ PAID IN FULL / पूरा चुक्ता
                </div>
              )}
            </div>
          </div>

          {/* Simple Footer */}
          <div className="mt-5 pt-3 border-t border-stone-200 text-[11px] text-stone-600 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="font-bold text-stone-800">THANK YOU! VISIT AGAIN • धन्यवाद!</div>
              <div className="text-[10px] text-stone-500">PROPRIETOR: {toCaps(settings.ownerName)} ({settings.phone})</div>
            </div>
            <div className="text-center sm:text-right">
              <div className="w-32 border-b border-stone-400 mb-1" />
              <span className="font-bold text-stone-700 text-[10px]">AUTHORIZED SIGNATORY</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>
              {copiedSuccess
                ? 'INVOICE DOWNLOADED / बिल सुरक्षित भयो'
                : 'INVOICE READY FOR PRINT / प्रिन्टको लागि तयार'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 border border-stone-300 shadow-2xs active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
              title="DOWNLOAD INVOICE FILE"
            >
              <Download size={14} />
              <span>DOWNLOAD</span>
            </button>

            {/* Direct WhatsApp Share */}
            <button
              type="button"
              onClick={handleDirectWhatsAppShare}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
              title="SHARE ON WHATSAPP"
            >
              <Share2 size={14} />
              <span>WHATSAPP</span>
            </button>

            {/* Direct Print Button */}
            <button
              type="button"
              onClick={handleDirectPrint}
              className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
              title="PRINT INVOICE"
            >
              <Printer size={15} />
              <span>PRINT INVOICE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

