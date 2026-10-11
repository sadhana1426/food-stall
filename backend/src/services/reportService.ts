import PDFDocument from 'pdfkit';
import { Buffer } from 'node:buffer';
import { Order, IOrder } from '../models/Order';
import { Business, IBusiness } from '../models/Business';
import { ApiError } from '../utils/ApiError';

const formatMoney = (paise: number) => `Rs. ${(paise / 100).toFixed(2)}`;

// Helper to get India start/end of day from YYYY-MM-DD
const getIndiaDayBounds = (dateStr: string, isEnd: boolean) => {
  // Parse date string (e.g., '2026-10-01')
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date in UTC
  const d = new Date(Date.UTC(year, month - 1, day));
  // Adjust for +5:30 to get local midnight in UTC
  d.setUTCHours(d.getUTCHours() - 5);
  d.setUTCMinutes(d.getUTCMinutes() - 30);
  
  if (isEnd) {
    d.setUTCDate(d.getUTCDate() + 1);
    d.setUTCMilliseconds(d.getUTCMilliseconds() - 1);
  }
  return d;
};

export class ReportService {
  static validateDates(dateFrom: string, dateTo: string) {
    const todayStr = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (dateFrom > todayStr || dateTo > todayStr) {
      throw new ApiError(400, 'Future dates are not allowed.');
    }
    
    if (dateFrom > dateTo) {
      throw new ApiError(400, 'From Date cannot be after To Date.');
    }

    return {
      start: getIndiaDayBounds(dateFrom, false),
      end: getIndiaDayBounds(dateTo, true),
    };
  }

  static async generateOrderPdf(businessId: string, orderId: string): Promise<Buffer> {
    const business = await Business.findById(businessId);
    if (!business) throw new ApiError(404, 'Business not found');

    const order = await Order.findOne({ _id: orderId, businessId });
    if (!order) throw new ApiError(404, 'Order not found');

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40 });
        const buffers: Buffer[] = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        
        // Header
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#004D40').text(business.businessName, { align: 'center' });
        doc.fontSize(12).font('Helvetica').fillColor('#666666').text(business.address, { align: 'center' });
        if (business.phone) doc.text(`Ph: ${business.phone}`, { align: 'center' });
        
        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text('BILL DETAILS', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(10).font('Helvetica');
        doc.text(`Bill No: ${order.billNumber}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        doc.text(`Order Type: ${order.orderType}`);
        
        doc.moveDown();
        
        // Items Header
        const y = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Item', 40, y);
        doc.text('Qty', 250, y);
        doc.text('Price', 320, y);
        doc.text('Total', 420, y, { align: 'right' });
        
        doc.moveTo(40, doc.y + 5).lineTo(550, doc.y + 5).stroke();
        doc.moveDown(0.5);
        
        // Items
        doc.font('Helvetica');
        order.items.forEach((item: any) => {
          const iy = doc.y;
          doc.text(item.itemName, 40, iy, { width: 200 });
          doc.text(item.quantity.toString(), 250, iy);
          doc.text(formatMoney(item.unitPricePaise), 320, iy);
          doc.text(formatMoney(item.lineTotalPaise), 420, iy, { align: 'right' });
        });
        
        doc.moveDown();
        doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        
        // Totals
        const ty = doc.y;
        doc.font('Helvetica');
        doc.text('Subtotal:', 320, ty);
        doc.text(formatMoney(order.subtotalPaise), 420, ty, { align: 'right' });
        
        if (order.discountAmountPaise > 0) {
          doc.text(`Discount (${order.discount?.type ?? 'NONE'}):`, 320, doc.y);
          doc.text(`-${formatMoney(order.discountAmountPaise)}`, 420, doc.y - 12, { align: 'right' });
        }
        
        if (order.taxAmountPaise > 0) {
          doc.text(`Tax (${order.taxRate}%):`, 320, doc.y);
          doc.text(formatMoney(order.taxAmountPaise), 420, doc.y - 12, { align: 'right' });
        }
        
        doc.font('Helvetica-Bold');
        doc.text('GRAND TOTAL:', 320, doc.y + 5);
        doc.text(formatMoney(order.grandTotalPaise), 420, doc.y - 12, { align: 'right' });
        
        doc.moveDown(2);
        
        // Footer
        doc.font('Helvetica').fillColor('#666666').text(business.receiptFooter, { align: 'center' });
        
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  static async generateSalesPdf(businessId: string, dateFrom: string, dateTo: string): Promise<Buffer> {
    const business = await Business.findById(businessId);
    if (!business) throw new ApiError(404, 'Business not found');

    const { start, end } = this.validateDates(dateFrom, dateTo);

    const orders = await Order.find({
      businessId,
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: 1 });

    let totalSales = 0, dineIn = 0, takeaway = 0, discount = 0, tax = 0;
    const itemMap = new Map<string, { qty: number, sales: number }>();

    orders.forEach(o => {
      totalSales += o.grandTotalPaise;
      discount += o.discountAmountPaise;
      tax += o.taxAmountPaise;
      
      if (o.orderType === 'DINE_IN') dineIn += o.grandTotalPaise;
      if (o.orderType === 'TAKEAWAY') takeaway += o.grandTotalPaise;

      o.items.forEach((i: any) => {
        const current = itemMap.get(i.itemName) || { qty: 0, sales: 0 };
        itemMap.set(i.itemName, {
          qty: current.qty + i.quantity,
          sales: current.sales + i.lineTotalPaise
        });
      });
    });

    const topItems = Array.from(itemMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40 });
        const buffers: Buffer[] = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#004D40').text(business.businessName, { align: 'center' });
        doc.fontSize(14).fillColor('#333333').text('SALES REPORT', { align: 'center' });
        doc.fontSize(10).fillColor('#666666').text(`${dateFrom} to ${dateTo}`, { align: 'center' });
        doc.moveDown(2);

        // Summary
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#004D40').text('SUMMARY');
        doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        doc.fontSize(10).font('Helvetica').fillColor('#333333');
        const summaryY = doc.y;
        doc.text(`Total Sales: ${formatMoney(totalSales)}`, 40, summaryY);
        doc.text(`Total Bills: ${orders.length}`, 40, summaryY + 15);
        doc.text(`Dine In Sales: ${formatMoney(dineIn)}`, 250, summaryY);
        doc.text(`Takeaway Sales: ${formatMoney(takeaway)}`, 250, summaryY + 15);
        const avg = orders.length > 0 ? Math.round(totalSales / orders.length) : 0;
        doc.text(`Average Bill: ${formatMoney(avg)}`, 420, summaryY);
        doc.text(`Discounts: ${formatMoney(discount)}`, 420, summaryY + 15);
        doc.text(`Tax Collected: ${formatMoney(tax)}`, 420, summaryY + 30);
        
        doc.moveDown(3);

        // Top Items
        if (topItems.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#004D40').text('TOP ITEMS');
          doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown(0.5);

          doc.fontSize(10);
          topItems.forEach(i => {
            const iy = doc.y;
            doc.font('Helvetica').text(i.name, 40, iy);
            doc.text(`${i.qty} units`, 300, iy);
            doc.font('Helvetica-Bold').text(formatMoney(i.sales), 450, iy, { align: 'right' });
          });
          doc.moveDown(2);
        }

        // Orders List
        if (orders.length > 0) {
          doc.addPage();
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#004D40').text('ORDER HISTORY');
          doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown(0.5);

          doc.fontSize(8);
          const y = doc.y;
          doc.font('Helvetica-Bold');
          doc.text('Bill No', 40, y);
          doc.text('Time', 90, y);
          doc.text('Type', 130, y);
          doc.text('Items', 170, y);
          doc.text('Subtotal', 360, y);
          doc.text('Discount', 410, y);
          doc.text('Tax', 460, y);
          doc.text('Total', 500, y, { align: 'right', width: 50 });
          doc.moveDown(0.5);

          doc.font('Helvetica');
          orders.forEach(o => {
            if (doc.y > 700) {
               doc.addPage();
            }
            const oy = doc.y;
            
            const itemsList = o.items.map((i: any) => `${i.itemName} x${i.quantity}`).join(', ');
            const displayItems = itemsList.length > 40 ? itemsList.substring(0, 37) + '...' : itemsList;

            doc.text(o.billNumber, 40, oy);
            doc.text(new Date(o.createdAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit' }), 90, oy);
            doc.text(o.orderType === 'TAKEAWAY' ? 'TKWY' : 'DINE', 130, oy);
            doc.text(displayItems, 170, oy, { width: 180, lineBreak: false });
            doc.text(formatMoney(o.subtotalPaise), 360, oy);
            doc.text(formatMoney(o.discountAmountPaise), 410, oy);
            doc.text(formatMoney(o.taxAmountPaise), 460, oy);
            doc.text(formatMoney(o.grandTotalPaise), 500, oy, { align: 'right', width: 50 });
          });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  static async generateSalesCsv(businessId: string, dateFrom: string, dateTo: string): Promise<string> {
    const { start, end } = this.validateDates(dateFrom, dateTo);

    const orders = await Order.find({
      businessId,
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: 1 });

    const escapeCsv = (str: string) => `"${String(str).replace(/"/g, '""')}"`;

    let csv = "Bill Number,Date,Time,Order Type,Subtotal (Rs),Discount (Rs),Tax (Rs),Grand Total (Rs),Print Count\n";

    orders.forEach(o => {
      const dt = new Date(o.createdAt);
      const dateStr = dt.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
      const timeStr = dt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
      
      const row = [
        escapeCsv(o.billNumber),
        escapeCsv(dateStr),
        escapeCsv(timeStr),
        escapeCsv(o.orderType),
        (o.subtotalPaise / 100).toFixed(2),
        (o.discountAmountPaise / 100).toFixed(2),
        (o.taxAmountPaise / 100).toFixed(2),
        (o.grandTotalPaise / 100).toFixed(2),
        o.printCount
      ].join(',');

      csv += row + '\n';
    });

    return csv;
  }
}
