import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

import authRoutes from './server/routes/authRoutes.ts';
import productsRoutes from './server/routes/productsRoutes.ts';
import warehouseRoutes from './server/routes/warehouseRoutes.ts';
import operationsRoutes from './server/routes/operationsRoutes.ts';
import inventoryRoutes from './server/routes/inventoryRoutes.ts';
import dashboardRoutes from './server/routes/dashboardRoutes.ts';
import reportsRoutes from './server/routes/reportsRoutes.ts';
import auditRoutes from './server/routes/auditRoutes.ts';

dotenv.config();

const app = express();
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', productsRoutes);
app.use('/api', warehouseRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api', auditRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', system: 'StockSense ERP', version: '2026.1' });
});

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StockSense ERP server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start StockSense ERP server:', err);
  process.exit(1);
});
