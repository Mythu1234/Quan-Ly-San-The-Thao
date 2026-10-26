import { Router } from 'express';
import { employeeController } from '../controllers/employeeController.js';

const router = Router();

// GET /api/employees/stats - Statistical counts
router.get('/stats', (req, res) => employeeController.getStats(req, res));

// GET /api/employees - List with filters & pagination
router.get('/', (req, res) => employeeController.getEmployees(req, res));

// GET /api/employees/:id - Single employee detail
router.get('/:id', (req, res) => employeeController.getEmployeeById(req, res));

// POST /api/employees - Create new employee
router.post('/', (req, res) => employeeController.createEmployee(req, res));

// PUT /api/employees/:id - Update employee
router.put('/:id', (req, res) => employeeController.updateEmployee(req, res));

// PATCH /api/employees/:id/status - Toggle active/inactive
router.patch('/:id/status', (req, res) => employeeController.toggleStatus(req, res));

// DELETE /api/employees/:id - Soft delete (UC-11) or permanent delete
router.delete('/:id', (req, res) => employeeController.deleteEmployee(req, res));

export default router;
