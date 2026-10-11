import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ReportService } from '../services/reportService';
import { ApiError } from '../utils/ApiError';

export const getOrderPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pdfBuffer = await ReportService.generateOrderPdf(req.user!.businessId, req.params.id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Bill-${req.params.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const getSalesPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dateFrom, dateTo } = req.query;
    if (typeof dateFrom !== 'string' || typeof dateTo !== 'string') {
      throw new ApiError(400, 'dateFrom and dateTo are required');
    }

    const pdfBuffer = await ReportService.generateSalesPdf(req.user!.businessId, dateFrom, dateTo);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Sales-${dateFrom}-to-${dateTo}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const getSalesCsv = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dateFrom, dateTo } = req.query;
    if (typeof dateFrom !== 'string' || typeof dateTo !== 'string') {
      throw new ApiError(400, 'dateFrom and dateTo are required');
    }

    const csvStr = await ReportService.generateSalesCsv(req.user!.businessId, dateFrom, dateTo);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Sales-${dateFrom}-to-${dateTo}.csv"`);
    res.send(csvStr);
  } catch (error) {
    next(error);
  }
};
