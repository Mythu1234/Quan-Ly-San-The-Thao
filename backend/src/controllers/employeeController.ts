import { Request, Response } from 'express';
import { employeeService } from '../services/employeeService.js';
import { CreateEmployeeDTO, UpdateEmployeeDTO, EmployeeFilterQuery } from '../types/employee.js';

export class EmployeeController {
  /**
   * GET /api/employees
   * Returns list of employees matching filters + summary stats
   */
  public async getEmployees(req: Request, res: Response): Promise<void> {
    try {
      const filters: EmployeeFilterQuery = {
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        status: (req.query.status === 'active' || req.query.status === 'inactive' || req.query.status === 'all')
          ? req.query.status
          : undefined,
        role: typeof req.query.role === 'string' ? req.query.role : undefined,
      };

      const result = employeeService.listEmployees(filters);

      res.status(200).json({
        success: true,
        data: result.employees,
        stats: result.stats,
        total: result.employees.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi máy chủ khi lấy danh sách nhân viên',
      });
    }
  }

  /**
   * GET /api/employees/stats
   * Returns summary counts
   */
  public async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = employeeService.getStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi máy chủ khi lấy thống kê nhân viên',
      });
    }
  }

  /**
   * GET /api/employees/:id
   * Returns detailed employee info
   */
  public async getEmployeeById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const employee = employeeService.getEmployeeById(id);
      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Không tìm thấy nhân viên',
      });
    }
  }

  /**
   * POST /api/employees
   * Creates a new employee
   */
  public async createEmployee(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateEmployeeDTO = req.body;
      const created = employeeService.createEmployee(dto);

      res.status(201).json({
        success: true,
        message: 'Thêm nhân viên mới thành công!',
        data: created,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Dữ liệu không hợp lệ',
      });
    }
  }

  /**
   * PUT /api/employees/:id
   * Updates an existing employee
   */
  public async updateEmployee(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const dto: UpdateEmployeeDTO = req.body;
      const updated = employeeService.updateEmployee(id, dto);

      res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin nhân viên thành công!',
        data: updated,
      });
    } catch (error: any) {
      const statusCode = error.message?.includes('Không tìm thấy') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Lỗi cập nhật nhân viên',
      });
    }
  }

  /**
   * PATCH /api/employees/:id/status
   * Toggles active / inactive
   */
  public async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = employeeService.toggleStatus(id);

      res.status(200).json({
        success: true,
        message: `Đã chuyển trạng thái nhân viên sang "${updated.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}"`,
        data: updated,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Lỗi cập nhật trạng thái',
      });
    }
  }

  /**
   * DELETE /api/employees/:id
   * Performs soft delete (UC-11) or hard delete if permanent=true
   */
  public async deleteEmployee(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const permanent = req.query.permanent === 'true';
      const reason = typeof req.body.reason === 'string' ? req.body.reason : (typeof req.query.reason === 'string' ? req.query.reason : undefined);

      const result = employeeService.deleteEmployee(id, permanent, reason);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.employee,
      });
    } catch (error: any) {
      const statusCode = error.message?.includes('Không tìm thấy') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Lỗi khi xóa nhân viên',
      });
    }
  }
}

export const employeeController = new EmployeeController();
