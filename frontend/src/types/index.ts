export interface Bus {
  id: number;
  num: string;
  route: string;
}

export type ScheduleType = 'even' | 'odd';

export interface Driver {
  id: number;
  name: string;
  bus: number | Bus | null;
  schedule: ScheduleType;
  schedule_display?: string;
  black: boolean;
  shift_start: string; // e.g. "06:00:00"
  shift_end: string;   // e.g. "18:00:00"
  shift?: string;       // Custom displays like "06:00 - 18:00"
  total_trips: number;
  phone: string | null;
}

export interface Fine {
  id: number;
  driver: number | Driver;
  driver_display?: string;
  date: string;
  amount: string; // decimal from backend
  reason: string;
}

export interface WorkAttendance {
  id: number;
  driver: number | Driver;
  driver_display?: string;
  date: string;
  planned_hours: number;
  actual_hours: number;
  overtime_hours: number;
  status: string;
  check_in?: string;
  check_out?: string;
}

export interface Salary {
  id: number;
  driver: number | Driver;
  driver_display?: string;
  year: number;
  month: number;
  month_display?: string;
  fixed_salary: string;
  bonus: string;
  fines_deduction: string;
  total_paid: string;
}

export interface TechnicalStatus {
  id: number;
  bus: number | Bus;
  bus_display?: string;
  category: 'tires' | 'brakes' | 'oil' | 'engine' | 'battery';
  category_display?: string;
  last_service_date: string;
  current_km: number;
  max_km: number;
  status: 'ok' | 'warn' | 'danger' | 'repair';
  status_display?: string;
  km_left?: number;
}
