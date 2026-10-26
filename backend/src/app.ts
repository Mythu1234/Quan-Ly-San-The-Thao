import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import employeeRoutes from './routes/employeeRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';

export const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow frontend Vite dev server & production
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'CourtX Arena Backend API',
    version: '1.0.0',
    time: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api', facilityRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Đường dẫn API không tồn tại',
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống nội bộ',
  });
});
