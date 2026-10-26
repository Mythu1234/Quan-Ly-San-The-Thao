import { Router } from 'express';
import { shiftController } from '../controllers/shiftController.js';

const router = Router();

// 1. Specialized query & report endpoints (Must be declared before /:id)
router.get('/statistics/kpi', shiftController.getStatistics.bind(shiftController));
router.get('/audit-logs', shiftController.getAuditLogs.bind(shiftController));
router.get('/export/preview', shiftController.getExportPreview.bind(shiftController));
router.get('/export/download', shiftController.downloadExport.bind(shiftController));

// 2. Validation & Batch actions
router.post('/validate', shiftController.validateShift.bind(shiftController));
router.post('/batch', shiftController.createBatchShifts.bind(shiftController));
router.post('/batch-delete', shiftController.deleteBatchShifts.bind(shiftController));

// 3. Standard CRUD
router.get('/', shiftController.getShifts.bind(shiftController));
router.get('/:id', shiftController.getShiftById.bind(shiftController));
router.post('/', shiftController.createShift.bind(shiftController));
router.put('/:id', shiftController.updateShift.bind(shiftController));
router.delete('/:id', shiftController.deleteShift.bind(shiftController));

// 4. Custom actions
router.patch('/:id/unassign', shiftController.unassignStaff.bind(shiftController));
router.post('/:id/tasks', shiftController.assignTask.bind(shiftController));

export default router;
