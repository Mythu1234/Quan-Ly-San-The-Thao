export interface EmployeeShiftSummary {
  type: 'morning' | 'afternoon' | 'evening';
  title: string;
  time: string;
  status: 'working' | 'upcoming' | 'completed' | 'off';
  statusLabel: string;
}

export interface EmployeeScheduleItem {
  dayLabel: string;
  date: string;
  shiftName?: string;
  time?: string;
  status: 'working' | 'scheduled' | 'off';
  statusLabel: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarText: string;
  avatarBg: string;
  avatarImage?: string;
  status: 'active' | 'inactive';
  role: string;
  joinDate: string;
  currentShift?: EmployeeShiftSummary;
  schedule5Days?: EmployeeScheduleItem[];
  deactivatedAt?: string;
  deactivationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeDTO {
  name: string;
  phone: string;
  email?: string;
  role?: string;
  status?: 'active' | 'inactive';
  password?: string;
  avatarText?: string;
  avatarBg?: string;
  avatarImage?: string;
}

export interface UpdateEmployeeDTO {
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  status?: 'active' | 'inactive';
  password?: string;
  avatarText?: string;
  avatarBg?: string;
  avatarImage?: string;
}

export interface EmployeeFilterQuery {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  role?: string;
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  currentlyWorking: number;
}
