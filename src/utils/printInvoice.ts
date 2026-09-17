import { SaleBill, BusinessSettings, Party, LedgerEntry } from '../types';
import { SHOP_LOGO_DATA_URL, toCaps, getUnitInCaps } from './shopLogo';

/**
 * Robust, standalone print engine for Satyawati Traders Invoices and Party Statements.
 * Handles both Standard A4/A5 Invoices, 80mm POS Thermal Slips, and Party Statements.
 * Uses an isolated hidden iframe with complete CSS to bypass iframe/sandbox blocking.
 */

export type PrintFormat = 'thermal' | 'standard';

export function generateInvoiceHtml(
  bill: SaleBill,
  settings: BusinessSettings,
  format: PrintFormat = 'standard'
): string {
  const isThermal = format === 'thermal';

  const rows = bill.items
    .map((item, index) => {
      const rateStr = item.rate.toLocaleString('en-IN');
      const totalStr = item.total.toLocaleString('en-IN');
      const englishName = item.fruitNameEnglish ? ` - ${toCaps(item.fruitNameEnglish)}` : '';
      const unitCaps = getUnitInCaps(item.unit);

      if (isThermal) {
        return `
          <tr>
            <td style="padding: 4px 2px; border-bottom: 1px dashed #444; font-size: 11px; text-align: center;">${index + 1}</td>
            <td style="padding: 4px 2px; border-bottom: 1px dashed #444; font-size: 11px;">
              <strong>${item.fruitName}</strong>${englishName ? `<br/><span style="font-size: 9px; color: #444;">${englishName}</span>` : ''}
            </td>
            <td style="padding: 4px 2px; border-bottom: 1px dashed #444; text-align: center; font-size: 11px; font-weight: 600;">${item.quantity} ${unitCaps}</td>
            <td style="padding: 4px 2px; border-bottom: 1px dashed #444; text-align: right; font-size: 11px;">${rateStr}</td>
            <td style="padding: 4px 2px; border-bottom: 1px dashed #444; text-align: right; font-size: 11px; font-weight: bold;">${totalStr}</td>
          </tr>
        `;
      }
      return `
        <tr>
          <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; font-family: monospace;">${index + 1}</td>
          <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
            <span style="font-weight: 700; color: #0f172a;">${item.fruitName}</span>
            ${englishName ? `<span style="font-size: 11px; color: #64748b; font-weight: 600;">${englishName}</span>` : ''}
          </td>
          <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; font-weight: 700; color: #1e293b;">${item.quantity} ${unitCaps}</td>
          <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 12px; font-family: monospace;">रु. ${rateStr}</td>
          <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 12px; font-weight: 800; font-family: monospace; color: #007AFF;">रु. ${totalStr}</td>
        </tr>
      `;
    })
    .join('');

  if (isThermal) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BILL-${bill.billNumber}</title>
  <style>
    @page { size: 80mm auto; margin: 2mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Mukta', sans-serif;
      margin: 0;
      padding: 6px;
      color: #000;
      background: #fff;
      font-size: 11px;
      line-height: 1.35;
      width: 76mm;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .double-divider { border-top: 2px double #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 10px; border-bottom: 1px solid #000; padding: 4px 2px; }
    @media print {
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="position: sticky; top: 0; background: #0f172a; color: white; padding: 6px 8px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; margin: -6px -6px 8px -6px; border-radius: 4px; font-family: system-ui, sans-serif;">
    <span style="font-size: 10px; font-weight: 700;">80MM THERMAL RECEIPT</span>
    <div style="display: flex; gap: 4px;">
      <button onclick="window.print()" style="background: #007aff; color: white; border: none; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer;">PRINT</button>
      <button onclick="window.close()" style="background: #475569; color: white; border: none; padding: 3px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;">X</button>
    </div>
  </div>

  <!-- Shop Header with Logo -->
  <div class="text-center">
    <div style="margin-bottom: 4px;">
      <img src="${SHOP_LOGO_DATA_URL}" alt="LOGO" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1.5px solid #000; display: inline-block;" />
    </div>
    <div style="font-size: 10px; font-weight: bold; color: #555;">।। श्री सत्यवती माता प्रसन्न ।।</div>
    <div style="font-size: 10px; font-weight: bold;">SHREE SATYAWATI MATA PRASANNA</div>
    <div style="font-size: 16px; font-weight: 900; margin: 2px 0;">${toCaps(settings.shopName)}</div>
    <div style="font-size: 10px; font-weight: bold; color: #222;">SATYAWATI TRADERS</div>
    <div style="font-size: 9.5px;">WHOLESALE FRUIT MERCHANTS</div>
    <div style="font-size: 9.5px;">${settings.address}</div>
    <div style="font-size: 9.5px; font-weight: 600;">TEL: ${settings.phone} | PAN NO: ${settings.panNumber}</div>
  </div>

  <div class="divider"></div>

  <!-- Simple Bill Meta -->
  <div style="font-size: 10.5px; line-height: 1.4;">
    <div><strong>BILL NO:</strong> ${bill.billNumber}</div>
    <div><strong>DATE:</strong> ${bill.dateBs}</div>
    <div><strong>CUSTOMER:</strong> ${toCaps(bill.customerName)}</div>
    ${bill.customerPhone ? `<div><strong>PHONE:</strong> ${bill.customerPhone}</div>` : ''}
  </div>

  <div class="divider"></div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th style="width: 16px; text-align: center;">SN</th>
        <th>ITEM DESCRIPTION</th>
        <th style="text-align: center;">QTY</th>
        <th style="text-align: right;">RATE</th>
        <th style="text-align: right;">AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="divider"></div>

  <!-- Simple Summary -->
  <table style="font-size: 11px;">
    ${bill.discount > 0 ? `
    <tr>
      <td style="padding: 2px 0;">SUBTOTAL:</td>
      <td class="text-right bold">रु. ${bill.subtotal.toLocaleString('en-IN')}</td>
    </tr>
    <tr>
      <td style="padding: 2px 0;">DISCOUNT:</td>
      <td class="text-right bold">- रु. ${bill.discount.toLocaleString('en-IN')}</td>
    </tr>` : ''}
    <tr style="font-size: 13px;">
      <td style="padding: 4px 0;" class="bold">TOTAL AMOUNT:</td>
      <td class="text-right bold">रु. ${bill.totalAmount.toLocaleString('en-IN')}</td>
    </tr>
    <tr>
      <td style="padding: 2px 0;">PAID AMOUNT (CASH):</td>
      <td class="text-right bold">रु. ${bill.paidAmount.toLocaleString('en-IN')}</td>
    </tr>
    ${bill.dueAmount > 0 ? `
    <tr style="font-size: 12px;">
      <td style="padding: 3px 0;" class="bold">BALANCE DUE:</td>
      <td class="text-right bold">रु. ${bill.dueAmount.toLocaleString('en-IN')}</td>
    </tr>` : `
    <tr>
      <td colspan="2" class="text-center bold" style="padding: 4px 0;">PAID IN FULL / पूरा चुक्ता</td>
    </tr>`}
  </table>

  <div class="double-divider"></div>

  <!-- Simple Footer -->
  <div class="text-center" style="font-size: 9.5px; line-height: 1.4;">
    <p class="bold">THANK YOU! VISIT AGAIN • धन्यवाद!</p>
    <p style="margin-top: 4px;">PROPRIETOR: ${toCaps(settings.ownerName)} (${settings.phone})</p>
  </div>
</body>
</html>`;
  }

  // Standard A4 / A5 Clean, Simplified Invoice
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>INVOICE-${bill.billNumber} - ${toCaps(settings.shopName)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Mukta', sans-serif;
      margin: 0;
      padding: 14px;
      color: #0f172a;
      background: #fff;
      line-height: 1.4;
      font-size: 13px;
    }
    .header-box {
      border-bottom: 2px solid #007aff;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .shop-logo {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #eab308;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      flex-shrink: 0;
    }
    .shop-title {
      font-size: 24px;
      font-weight: 900;
      color: #007aff;
      line-height: 1.1;
      margin: 2px 0;
      letter-spacing: -0.5px;
    }
    .shop-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      letter-spacing: 0.5px;
    }
    .shop-contact {
      font-size: 11px;
      color: #334155;
      font-weight: 600;
      margin-top: 2px;
    }
    .invoice-badge {
      text-align: right;
    }
    .badge-pill {
      display: inline-block;
      background: #007aff;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 14px;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-size: 11px;
      font-weight: 800;
      padding: 8px 6px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      letter-spacing: 0.5px;
    }
    .summary-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .summary-box {
      width: 290px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      font-size: 12px;
      border-bottom: 1px solid #f1f5f9;
      font-weight: 600;
      color: #334155;
    }
    .summary-row.total {
      background: #eff6ff;
      font-weight: 900;
      font-size: 14px;
      color: #007aff;
      border-top: 1px solid #bfdbfe;
      border-bottom: 1px solid #bfdbfe;
    }
    .footer-box {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11px;
      color: #475569;
    }
    .sign-line {
      width: 160px;
      border-bottom: 1px solid #334155;
      margin-bottom: 4px;
    }
    @media print {
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="position: sticky; top: 0; background: #0f172a; color: white; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; z-index: 99999; margin: -14px -14px 14px -14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: system-ui, sans-serif;">
    <span style="font-size: 12px; font-weight: 700;">WHOLESALE INVOICE PREVIEW</span>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background: #007aff; color: white; border: none; padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;">PRINT INVOICE</button>
      <button onclick="window.close()" style="background: #334155; color: white; border: none; padding: 5px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">CLOSE</button>
    </div>
  </div>

  <!-- Header with Proper Logo and Sacred Blessing -->
  <div class="header-box">
    <div class="logo-container">
      <img src="${SHOP_LOGO_DATA_URL}" alt="SATYAWATI TRADERS LOGO" class="shop-logo" />
      <div>
        <div style="font-size: 11px; font-weight: 800; color: #b45309;">
          ।। श्री सत्यवती माता प्रसन्न ।। • SHREE SATYAWATI MATA PRASANNA
        </div>
        <div class="shop-title">
          ${settings.shopName} <span style="font-size: 18px; color: #1e293b; font-weight: 800;">(SATYAWATI TRADERS)</span>
        </div>
        <div class="shop-subtitle">
          WHOLESALE FRUIT MERCHANTS • थोक फलफूल बिक्रेता
        </div>
        <div class="shop-contact">
          ${settings.address} | TEL: ${settings.phone}
        </div>
      </div>
    </div>
    <div class="invoice-badge">
      <div class="badge-pill">WHOLESALE INVOICE</div>
      <div style="font-size: 12px; font-weight: 800; color: #0f172a;">BILL NO: ${bill.billNumber}</div>
      <div style="font-size: 11px; font-weight: 700; color: #64748b;">PAN NO: ${settings.panNumber || '-'}</div>
    </div>
  </div>

  <!-- Simple 2-Column Meta Grid -->
  <div class="meta-grid">
    <div>
      <div style="font-size: 10px; color: #64748b; font-weight: 800;">CUSTOMER / PARTY NAME:</div>
      <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 1px;">${toCaps(bill.customerName)}</div>
      ${bill.customerPhone ? `<div style="font-size: 11px; color: #475569; font-weight: 600; margin-top: 1px;">PHONE: ${bill.customerPhone}</div>` : ''}
    </div>
    <div style="text-align: right;">
      <div style="font-size: 10px; color: #64748b; font-weight: 800;">INVOICE DATE:</div>
      <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 1px;">DATE: ${bill.dateBs}</div>
      <div style="font-size: 11px; color: #64748b; font-weight: 600;">PAYMENT: ${toCaps(bill.paymentType)}</div>
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th style="width: 32px; text-align: center;">SN</th>
        <th style="text-align: left;">ITEM DESCRIPTION</th>
        <th style="width: 100px; text-align: center;">QTY & UNIT</th>
        <th style="width: 110px; text-align: right;">RATE (RS.)</th>
        <th style="width: 120px; text-align: right;">TOTAL AMOUNT (RS.)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <!-- Simplified Summary -->
  <div class="summary-container">
    <div class="summary-box">
      ${bill.discount > 0 ? `
      <div class="summary-row">
        <span>SUBTOTAL:</span>
        <span style="font-family: monospace;">रु. ${bill.subtotal.toLocaleString('en-IN')}</span>
      </div>
      <div class="summary-row" style="color: #b45309;">
        <span>DISCOUNT:</span>
        <span style="font-family: monospace;">- रु. ${bill.discount.toLocaleString('en-IN')}</span>
      </div>` : ''}
      <div class="summary-row total">
        <span>TOTAL AMOUNT:</span>
        <span style="font-family: monospace;">रु. ${bill.totalAmount.toLocaleString('en-IN')}</span>
      </div>
      <div class="summary-row">
        <span>PAID AMOUNT (CASH):</span>
        <span style="font-family: monospace; color: #059669; font-weight: 700;">रु. ${bill.paidAmount.toLocaleString('en-IN')}</span>
      </div>
      ${bill.dueAmount > 0 ? `
      <div class="summary-row" style="background: #fef2f2; color: #dc2626; font-weight: 800;">
        <span>BALANCE DUE:</span>
        <span style="font-family: monospace;">रु. ${bill.dueAmount.toLocaleString('en-IN')}</span>
      </div>` : `
      <div class="summary-row" style="background: #f0fdf4; color: #16a34a; font-weight: 800; justify-content: center;">
        <span>PAID IN FULL / पूरा चुक्ता</span>
      </div>`}
    </div>
  </div>

  <!-- Simple Footer -->
  <div class="footer-box">
    <div>
      <div style="font-weight: 800; color: #0f172a;">THANK YOU! VISIT AGAIN • धन्यवाद!</div>
      <div style="margin-top: 2px;">PROPRIETOR: ${toCaps(settings.ownerName)} (${settings.phone})</div>
    </div>
    <div style="text-align: center;">
      <div class="sign-line"></div>
      <div style="font-weight: 700;">AUTHORIZED SIGNATORY</div>
    </div>
  </div>
</body>
</html>`;
}

function printHtmlContent(html: string) {
  try {
    let printIframe = document.getElementById('satyawati-print-iframe') as HTMLIFrameElement;
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'satyawati-print-iframe';
      // Use proper offscreen layout dimensions (non-zero width & height prevents print clipping)
      printIframe.style.position = 'fixed';
      printIframe.style.left = '-10000px';
      printIframe.style.top = '-10000px';
      printIframe.style.width = '1024px';
      printIframe.style.height = '768px';
      printIframe.style.border = 'none';
      printIframe.style.opacity = '0';
      printIframe.style.pointerEvents = 'none';
      document.body.appendChild(printIframe);
    }

    const doc = printIframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (printErr) {
          console.warn('Iframe print failed, attempting window fallback', printErr);
          fallbackPrint(html);
        }
      }, 350);
      return;
    }
  } catch (err) {
    console.warn('Direct iframe print error, using popup/window fallback', err);
  }

  fallbackPrint(html);
}

/**
 * Triggers direct printing via a clean, isolated iframe.
 * Avoids modal obscuring, sandbox iframe bugs, and dark-theme bleeds.
 */
export function printInvoice(
  bill: SaleBill,
  settings: BusinessSettings,
  format: PrintFormat = 'standard'
) {
  const html = generateInvoiceHtml(bill, settings, format);
  printHtmlContent(html);
}

/**
 * Generates formatted HTML for a Party Ledger Statement (खाता स्टेटमेन्ट)
 */
export function generatePartyStatementHtml(
  party: Party,
  ledgers: LedgerEntry[],
  settings: BusinessSettings
): string {
  const partyLedgers = ledgers.filter((l) => l.partyId === party.id);

  const rows = partyLedgers
    .map((item, index) => {
      const debitStr = item.debit > 0 ? `रु. ${item.debit.toLocaleString('en-IN')}` : '-';
      const creditStr = item.credit > 0 ? `रु. ${item.credit.toLocaleString('en-IN')}` : '-';
      const runBalStr = `रु. ${item.runningBalance.toLocaleString('en-IN')}`;

      return `
        <tr>
          <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 11px; font-family: monospace;">${index + 1}</td>
          <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; white-space: nowrap; font-weight: 600;">${item.dateBs}</td>
          <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <div style="font-weight: 700; color: #0f172a;">${item.description}</div>
            ${item.billNumber ? `<div style="font-size: 10px; color: #64748b;">BILL NO: ${item.billNumber}</div>` : ''}
          </td>
          <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 11px; font-family: monospace; color: #b45309; font-weight: 600;">${debitStr}</td>
          <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 11px; font-family: monospace; color: #059669; font-weight: 600;">${creditStr}</td>
          <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 11px; font-weight: 800; font-family: monospace;">${runBalStr}</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PARTY STATEMENT - ${toCaps(party.name)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Mukta', sans-serif;
      margin: 0;
      padding: 14px;
      color: #0f172a;
      background: #fff;
      line-height: 1.4;
      font-size: 12px;
    }
    .header-box {
      border-bottom: 2px solid #007aff;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .shop-logo {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #eab308;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .shop-title {
      font-size: 22px;
      font-weight: 900;
      color: #007aff;
      margin: 2px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-size: 11px;
      font-weight: 800;
      padding: 7px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    .balance-box {
      margin-left: auto;
      width: 290px;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 10px 14px;
      background: #eff6ff;
      margin-bottom: 20px;
    }
    .footer-box {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11px;
      color: #475569;
    }
    @media print {
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="position: sticky; top: 0; background: #0f172a; color: white; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; z-index: 99999; margin: -14px -14px 14px -14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: system-ui, sans-serif;">
    <span style="font-size: 12px; font-weight: 700;">PARTY STATEMENT PREVIEW</span>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background: #007aff; color: white; border: none; padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;">PRINT STATEMENT</button>
      <button onclick="window.close()" style="background: #334155; color: white; border: none; padding: 5px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">CLOSE</button>
    </div>
  </div>

  <div class="header-box">
    <div style="display: flex; align-items: center; gap: 12px;">
      <img src="${SHOP_LOGO_DATA_URL}" alt="LOGO" class="shop-logo" />
      <div>
        <div style="font-size: 11px; font-weight: 800; color: #b45309;">।। श्री सत्यवती माता प्रसन्न ।। • SHREE SATYAWATI MATA PRASANNA</div>
        <div class="shop-title">${settings.shopName} <span style="font-size: 17px; color: #1e293b; font-weight: 800;">(SATYAWATI TRADERS)</span></div>
        <div style="font-size: 11px; color: #475569; font-weight: 700;">WHOLESALE FRUIT MERCHANTS</div>
        <div style="font-size: 11px; color: #334155;">${settings.address} | TEL: ${settings.phone}</div>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="display: inline-block; background: #007aff; color: #fff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; margin-bottom: 4px;">
        PARTY LEDGER STATEMENT
      </div>
      <div style="font-size: 11px; font-weight: 700; color: #64748b;">PAN NO: ${settings.panNumber || '-'}</div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div style="font-size: 10px; color: #64748b; font-weight: 800;">PARTY / CUSTOMER NAME:</div>
      <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">${toCaps(party.name)}</div>
      <div style="font-size: 11px; color: #475569;">ADDRESS: ${toCaps(party.address || '-')}</div>
      <div style="font-size: 11px; color: #475569;">PHONE: ${party.phone || '-'}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 10px; color: #64748b; font-weight: 800;">CURRENT BALANCE STATUS:</div>
      <div style="font-size: 16px; font-weight: 900; color: ${party.balance >= 0 ? '#b45309' : '#059669'}; margin-top: 2px;">
        रु. ${Math.abs(party.balance).toLocaleString('en-IN')}
      </div>
      <div style="font-size: 11px; font-weight: 800; color: #64748b;">
        ${party.balance >= 0 ? 'BALANCE RECEIVABLE (बाँकी लिनुपर्ने)' : 'ADVANCE BALANCE (अग्रिम जम्मा)'}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px; text-align: center;">SN</th>
        <th style="width: 85px; text-align: left;">DATE</th>
        <th style="text-align: left;">PARTICULARS</th>
        <th style="width: 110px; text-align: right;">DEBIT (नामे)</th>
        <th style="width: 110px; text-align: right;">CREDIT (जम्मा)</th>
        <th style="width: 110px; text-align: right;">BALANCE (बाँकी)</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="6" style="padding: 16px; text-align: center; color: #999;">NO ENTRIES RECORDED</td></tr>'}
    </tbody>
  </table>

  <div class="balance-box">
    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; color: #1e3a8a;">
      <span>TOTAL BALANCE:</span>
      <span style="font-family: monospace;">रु. ${Math.abs(party.balance).toLocaleString('en-IN')}</span>
    </div>
    <div style="font-size: 11px; color: #475569; margin-top: 3px; text-align: right; font-weight: 600;">
      (${party.balance >= 0 ? 'RECEIVABLE FROM PARTY' : 'ADVANCE FROM PARTY'})
    </div>
  </div>

  <div class="footer-box">
    <div>
      <div style="font-weight: 700;">PROPRIETOR: ${toCaps(settings.ownerName)} (${settings.phone})</div>
      <div style="margin-top: 2px;">SATYAWATI TRADERS, BUTWAL</div>
    </div>
    <div style="text-align: center;">
      <div style="width: 140px; border-bottom: 1px solid #475569; margin-bottom: 4px;"></div>
      <div style="font-weight: 700;">AUTHORIZED SIGNATORY</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers direct printing of party statement
 */
export function printPartyStatement(
  party: Party,
  ledgers: LedgerEntry[],
  settings: BusinessSettings
) {
  const html = generatePartyStatementHtml(party, ledgers, settings);
  printHtmlContent(html);
}

function fallbackPrint(html: string) {
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, '_blank', 'width=900,height=950');
    if (printWindow) {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (_) {}
      }, 500);
      return;
    }
  } catch (_) {}

  // Last-ditch native fallback
  window.print();
}

/**
 * Downloads a standalone, formatted invoice file (.html)
 * that the user can store, share, or open and print anytime.
 */
export function downloadInvoiceHtml(
  bill: SaleBill,
  settings: BusinessSettings,
  format: PrintFormat = 'standard'
) {
  const html = generateInvoiceHtml(bill, settings, format);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BILL_${bill.billNumber}_${bill.customerName.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
