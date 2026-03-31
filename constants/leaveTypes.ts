export interface LeaveType {
  id: string;
  code: string;       // short code for calendar pill (e.g. "AL", "SL")
  label: string;
  color: string;
  icon: string;
  paid: boolean;       // whether this leave counts as paid hours
  defaultDays: number; // annual allocation
}

export const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  { id: 'annual',    code: 'AL', label: 'Annual Leave',    color: '#10B981', icon: 'umbrella-beach',       paid: true,  defaultDays: 21 },
  { id: 'sick',      code: 'SL', label: 'Sick Leave',      color: '#EF4444', icon: 'hospital-box-outline', paid: true,  defaultDays: 14 },
  { id: 'emergency', code: 'EL', label: 'Emergency Leave', color: '#F97316', icon: 'alert-circle-outline', paid: true,  defaultDays: 5  },
  { id: 'unpaid',    code: 'UL', label: 'Unpaid Leave',    color: '#6B7280', icon: 'cash-off',             paid: false, defaultDays: 0  },
];

export const STANDARD_WORK_HOURS = 8; // hours per paid leave day for pay calculation
