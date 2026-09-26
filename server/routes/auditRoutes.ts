import { Router, Response } from 'express';
import { getDB } from '../db.ts';
import { requireAuth, requireRole } from '../auth.ts';

const router = Router();

router.get('/audit-logs', requireAuth, requireRole(['ADMIN']), (req, res: Response) => {
  const db = getDB();
  const { entity_type, action } = req.query;

  let logs = db.audit_logs;
  if (entity_type && typeof entity_type === 'string' && entity_type !== 'all') {
    logs = logs.filter(l => l.entity_type === entity_type);
  }
  if (action && typeof action === 'string' && action !== 'all') {
    logs = logs.filter(l => l.action.includes(action.toUpperCase()));
  }

  res.json(logs);
});

export default router;
