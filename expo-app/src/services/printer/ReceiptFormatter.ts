import { EscPosEncoder } from './EscPosEncoder';
import { PaperWidth } from './printerTypes';

export interface PrintProfile {
  paperWidth: PaperWidth;
  lineWidth: number;
  itemColWidth: number;
  qtyColWidth: number;
  amtColWidth: number;
}

export const PRINT_PROFILES: Record<string, PrintProfile> = {
  '50mm': {
    paperWidth: '50mm',
    lineWidth: 32,
    itemColWidth: 14,
    qtyColWidth: 6,
    amtColWidth: 12,
  },
  '58mm': {
    paperWidth: '58mm',
    lineWidth: 32,
    itemColWidth: 14,
    qtyColWidth: 6,
    amtColWidth: 12,
  },
  '80mm': {
    paperWidth: '80mm',
    lineWidth: 48,
    itemColWidth: 14,
    qtyColWidth: 10,
    amtColWidth: 24,
  },
};

export function getPrintProfile(width: PaperWidth = '58mm'): PrintProfile {
  return PRINT_PROFILES[width] || PRINT_PROFILES['58mm'];
}

/**
 * Word-aware text wrapping.
 * Wraps text before exceeding maxWidth, never splitting mid-word unless a single word exceeds maxWidth.
 */
export function wrapWords(text: string, maxWidth: number): string[] {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragraphs = normalized.split('\n');
  const resultLines: string[] = [];

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    // Split by whitespace
    const words = trimmedPara.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        if (word.length <= maxWidth) {
          currentLine = word;
        } else {
          // Hard-wrap long single word as fallback
          let remaining = word;
          while (remaining.length > maxWidth) {
            resultLines.push(remaining.substring(0, maxWidth));
            remaining = remaining.substring(maxWidth);
          }
          currentLine = remaining;
        }
      } else {
        if (currentLine.length + 1 + word.length <= maxWidth) {
          currentLine += ' ' + word;
        } else {
          resultLines.push(currentLine);
          if (word.length <= maxWidth) {
            currentLine = word;
          } else {
            let remaining = word;
            while (remaining.length > maxWidth) {
              resultLines.push(remaining.substring(0, maxWidth));
              remaining = remaining.substring(maxWidth);
            }
            currentLine = remaining;
          }
        }
      }
    }

    if (currentLine) {
      resultLines.push(currentLine);
    }
  }

  return resultLines;
}

/**
 * Center a string within given width using spaces.
 */
export function centerLine(text: string, width: number): string {
  const clean = text.trim();
  if (clean.length >= width) return clean;
  const totalPadding = width - clean.length;
  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;
  return ' '.repeat(leftPadding) + clean + ' '.repeat(rightPadding);
}

/**
 * Format two columns aligned left and right.
 */
export function leftRight(left: string, right: string, width: number): string {
  const l = left.trim();
  const r = right.trim();
  const spaceCount = width - l.length - r.length;
  if (spaceCount <= 0) {
    return l.substring(0, Math.max(1, width - r.length - 1)) + ' ' + r;
  }
  return l + ' '.repeat(spaceCount) + r;
}

/**
 * Format money in integer paise to standard Rupee presentation without paise fractions if zero.
 */
export function formatMoney(paise: number = 0): string {
  const safePaise = Math.round(Number(paise) || 0);
  const rupees = safePaise / 100;
  return safePaise % 100 === 0 ? rupees.toFixed(0) : rupees.toFixed(2);
}

/**
 * Pure ASCII date/time formatter: DD/MM/YYYY hh:mm:ss AM
 * Standard printable ASCII only, no invisible characters, narrow spaces, or '?'
 */
export function formatDateTimeAscii(dateInput: Date | string | number): string {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const strHours = String(hours).padStart(2, '0');
  return `${day}/${month}/${year} ${strHours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Format item rows with 14-character item-name column.
 * First line: Item (14) + Qty + Amount
 * Continuation lines: item continuation only (max 14 chars, no Qty/Amount repetition)
 */
export function formatItemRows(items: any[], profile: PrintProfile): string[] {
  const lines: string[] = [];
  const { itemColWidth, qtyColWidth, amtColWidth } = profile;

  for (const item of items) {
    const rawName = (item.itemName || item.name || 'Item').trim();
    const qty = String(item.quantity ?? 1);
    const amt = formatMoney(item.lineTotalPaise ?? (item.pricePaise ? item.pricePaise * (item.quantity ?? 1) : 0));

    const nameChunks = wrapWords(rawName, itemColWidth);
    const firstChunk = nameChunks.length > 0 ? nameChunks[0] : rawName.substring(0, itemColWidth);

    // First line has Item, Qty, Amount
    const col1 = firstChunk.padEnd(itemColWidth, ' ');
    const col2 = qty.padStart(qtyColWidth, ' ');
    const col3 = amt.padStart(amtColWidth, ' ');
    lines.push(col1 + col2 + col3);

    // Subsequent continuation lines contain only item-name continuation
    for (let i = 1; i < nameChunks.length; i++) {
      lines.push(nameChunks[i]);
    }
  }

  return lines;
}

/**
 * Build raw text representation of receipt for previews / logging / unit testing.
 */
export function buildReceiptText(order: any, width: PaperWidth = '58mm'): string {
  const profile = getPrintProfile(width);
  const { lineWidth, itemColWidth, qtyColWidth, amtColWidth } = profile;
  const sep = '-'.repeat(lineWidth);
  const out: string[] = [];

  // Restaurant Header
  const restName = (order.businessSnapshot?.name || 'The Punjab Delight Co.').trim();
  out.push(centerLine(restName, lineWidth));

  const address = order.businessSnapshot?.address;
  if (address) {
    const addrLines = wrapWords(address, lineWidth);
    for (const al of addrLines) {
      out.push(centerLine(al, lineWidth));
    }
  }

  const phone = order.businessSnapshot?.phone;
  if (phone) {
    out.push(centerLine(`Ph: ${phone}`, lineWidth));
  }

  out.push(sep);

  // Bill Meta
  const billNum = (order.billNumber ?? '').toString().startsWith('#')
    ? (order.billNumber ?? '').toString()
    : `#${order.billNumber ?? ''}`;
  out.push(`Bill No: ${billNum}`);
  out.push(`Date: ${formatDateTimeAscii(order.createdAt || new Date())}`);
  out.push(`Type: ${order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}`);

  out.push(sep);

  // Items Header
  const hItem = 'Item'.padEnd(itemColWidth, ' ');
  const hQty = 'Qty'.padStart(qtyColWidth, ' ');
  const hAmt = 'Amount'.padStart(amtColWidth, ' ');
  out.push(hItem + hQty + hAmt);

  out.push(sep);

  // Items
  const itemLines = formatItemRows(order.items || [], profile);
  for (const il of itemLines) {
    out.push(il);
  }

  out.push(sep);

  // Totals: Subtotal, GST, TOTAL (No Discount in new billing)
  out.push(leftRight('Subtotal', formatMoney(order.subtotalPaise), lineWidth));

  const taxRate = order.taxRate ?? 5;
  const taxAmountPaise = order.taxAmountPaise ?? Math.round((order.subtotalPaise || 0) * (taxRate / 100));
  out.push(leftRight(`GST (${taxRate}%)`, formatMoney(taxAmountPaise), lineWidth));

  out.push(sep);

  const grandTotal = order.grandTotalPaise ?? ((order.subtotalPaise || 0) + taxAmountPaise);
  out.push(leftRight('TOTAL', `Rs ${formatMoney(grandTotal)}`, lineWidth));

  out.push(sep);

  // Footer
  out.push(centerLine('Thank You! Visit Again.', lineWidth));

  if (order.printCount && order.printCount > 0) {
    out.push(centerLine(`(Reprint ${order.printCount})`, lineWidth));
  }

  return out.join('\n');
}

/**
 * Build ESC/POS bytes for receipt printing.
 */
export function buildReceiptBytes(order: any, width: PaperWidth = '58mm', supportsCutter: boolean = false): Uint8Array {
  const profile = getPrintProfile(width);
  const { lineWidth, itemColWidth, qtyColWidth, amtColWidth } = profile;
  const sep = '-'.repeat(lineWidth);

  const encoder = new EscPosEncoder();
  encoder.initialize();

  // 1. Restaurant Title: centered, bold, normal width (GS ! 0x01 = double height only if 50mm, or standard)
  encoder.alignCenter().bold(true);
  // Double-height (height=2, width=1) only if fits within line; normal width prevents auto-wrapping
  encoder.size(1, 1);
  const restName = (order.businessSnapshot?.name || 'The Punjab Delight Co.').trim();
  encoder.line(restName);

  // Reset style immediately to prevent leakage
  encoder.bold(false).size(1, 1).alignCenter();

  // 2. Restaurant Address: word-aware wrap, each line centered, normal font
  const address = order.businessSnapshot?.address;
  if (address) {
    const addrLines = wrapWords(address, lineWidth);
    for (const al of addrLines) {
      encoder.line(al);
    }
  }

  const phone = order.businessSnapshot?.phone;
  if (phone) {
    encoder.line(`Ph: ${phone}`);
  }

  // Divider
  encoder.alignLeft().line(sep);

  // 3. Metadata
  const billNum = (order.billNumber ?? '').toString().startsWith('#')
    ? (order.billNumber ?? '').toString()
    : `#${order.billNumber ?? ''}`;
  encoder.line(`Bill No: ${billNum}`);
  encoder.line(`Date: ${formatDateTimeAscii(order.createdAt || new Date())}`);
  encoder.line(`Type: ${order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}`);

  // Divider
  encoder.line(sep);

  // 4. Items Header
  const hItem = 'Item'.padEnd(itemColWidth, ' ');
  const hQty = 'Qty'.padStart(qtyColWidth, ' ');
  const hAmt = 'Amount'.padStart(amtColWidth, ' ');
  encoder.line(hItem + hQty + hAmt);
  encoder.line(sep);

  // 5. Items
  const itemLines = formatItemRows(order.items || [], profile);
  for (const il of itemLines) {
    encoder.line(il);
  }
  encoder.line(sep);

  // 6. Totals
  encoder.line(leftRight('Subtotal', formatMoney(order.subtotalPaise), lineWidth));

  const taxRate = order.taxRate ?? 5;
  const taxAmountPaise = order.taxAmountPaise ?? Math.round((order.subtotalPaise || 0) * (taxRate / 100));
  // GST presentation: NO '+' sign
  encoder.line(leftRight(`GST (${taxRate}%)`, formatMoney(taxAmountPaise), lineWidth));

  encoder.line(sep);

  // Grand Total: emphasized size(1, 2) double height, bold
  encoder.bold(true).size(1, 2);
  const grandTotal = order.grandTotalPaise ?? ((order.subtotalPaise || 0) + taxAmountPaise);
  encoder.line(leftRight('TOTAL', `Rs ${formatMoney(grandTotal)}`, lineWidth));

  // Reset style
  encoder.bold(false).size(1, 1);
  encoder.line(sep);

  // 7. Footer: centered, normal font
  encoder.alignCenter();
  encoder.line('Thank You! Visit Again.');

  if (order.printCount && order.printCount > 0) {
    encoder.newline().line(`(Reprint ${order.printCount})`);
  }

  // 8. Feed & Cut
  encoder.paperFeed(3);
  if (supportsCutter) {
    encoder.cut();
  }

  return encoder.build();
}

/**
 * Build ESC/POS bytes for Test Print.
 */
export function buildTestPrintBytes(businessName: string = 'The Punjab Delight Co.', width: PaperWidth = '58mm', supportsCutter: boolean = false): Uint8Array {
  const profile = getPrintProfile(width);
  const { lineWidth } = profile;
  const sep = '-'.repeat(lineWidth);

  const encoder = new EscPosEncoder();
  encoder.initialize();

  encoder.alignCenter().bold(true).size(1, 1);
  encoder.line(businessName.trim());
  encoder.bold(false).size(1, 1);
  encoder.line('Thermal Printer Test');
  encoder.line(`Profile: ${profile.paperWidth} (${lineWidth} col)`);
  encoder.line(sep);
  encoder.alignLeft();
  encoder.line(`Time: ${formatDateTimeAscii(new Date())}`);
  encoder.line('Status: Connected & Working');
  encoder.line(sep);
  encoder.alignCenter();
  encoder.line('Test Print Successful');
  encoder.line(sep);
  encoder.line('Thank You! Visit Again.');
  encoder.paperFeed(3);
  if (supportsCutter) {
    encoder.cut();
  }

  return encoder.build();
}
