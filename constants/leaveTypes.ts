export interface LeaveType {
  id: string;
  label: string;
  color: string;
  icon: string;
  defaultDays: number; // annual allocation
}

export const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  { id: 'annual',    label: 'Annual Leave',    color: '#10B981', icon: 'umbrella-beach',     defaultDays: 21 },
  { id: 'sick',      label: 'Sick Leave',      color: '#EF4444', icon: 'hospital-box-outline', defaultDays: 14 },
  { id: 'emergency', label: 'Emergency Leave', color: '#F97316', icon: 'alert-circle-outline', defaultDays: 5  },
  { id: 'unpaid',    label: 'Unpaid Leave',    color: '#6B7280', icon: 'cash-off',              defaultDays: 0  },
];
