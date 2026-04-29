export type UserRole = 'admin' | 'supervisor' | 'assistant_supervisor' | 'project_manager' | 'client';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  project?: { _id: string; name: string } | string;
  status: 'active' | 'inactive';
  lastLoginAt?: string;
  createdAt: string;
}

export interface Project {
  _id: string;
  name: string;
  clientName?: string;
  locationCode?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Building {
  _id: string;
  project: { _id: string; name: string } | string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Floor {
  _id: string;
  building: { _id: string; name: string } | string;
  project: { _id: string; name: string } | string;
  name: string;
  locationCode?: string;
  status: 'active' | 'inactive';
}

export interface ItemCategory {
  _id: string;
  name: string;
  type: 'food' | 'material';
  status: 'active' | 'inactive';
}

export interface Item {
  _id: string;
  name: string;
  category: { _id: string; name: string; type: 'food' | 'material' } | string;
  type: 'food' | 'material';
  unit: string;
  limitQty: number;
  status: 'active' | 'inactive';
}

export interface DailyPlan {
  _id: string;
  date: string;
  project: { _id: string; name: string } | string;
  building: { _id: string; name: string } | string;
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  status: 'draft' | 'published' | 'closed';
  notes?: string;
  createdBy?: { _id: string; fullName: string };
  createdAt: string;
  lines?: DailyPlanLine[];
}

export interface DailyPlanLine {
  _id: string;
  floor: { _id: string; name: string } | string;
  item: { _id: string; name: string; unit: string } | string;
  plannedQty: number;
  notes?: string;
}

export type FloorCheckStatus = 'draft' | 'submitted' | 'under_review' | 'returned' | 'approved' | 'rejected' | 'closed';
export type LineStatus = 'ok' | 'shortage' | 'extra' | 'not_available' | 'replaced' | 'needs_review';

export interface FloorCheck {
  _id: string;
  date: string;
  project: { _id: string; name: string } | string;
  building: { _id: string; name: string } | string;
  floor: { _id: string; name: string } | string;
  shift: string;
  supervisor: { _id: string; fullName: string } | string;
  status: FloorCheckStatus;
  notes?: string;
  currentApprovalStep: string;
  approvalRecords?: ApprovalRecord[];
  lines?: FloorCheckLine[];
  createdAt: string;
}

export interface FloorCheckLine {
  _id: string;
  item: { _id: string; name: string; unit: string; type: string } | string;
  plannedQty: number;
  actualQty: number;
  difference: number;
  lineStatus: LineStatus;
  notes?: string;
  photos?: Attachment[];
}

export interface ApprovalRecord {
  _id: string;
  entityType: string;
  step: string;
  action: string;
  actor: { _id: string; fullName: string; role: string } | string;
  comment?: string;
  version: number;
  createdAt: string;
}

export interface InventoryBalance {
  _id: string;
  project: { _id: string; name: string } | string;
  item: { _id: string; name: string; unit: string; category?: { name: string } } | null;
  period: string;
  monthlyLimit: number;
  openingBalance: number;
  receivedQty: number;
  consumedQty: number;
  issuedQty: number;
  damagedQty: number;
  returnedQty: number;
  remainingQty: number;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'over_consumed';
}

export interface StockMovement {
  _id: string;
  project: { _id: string; name: string } | string;
  item: { _id: string; name: string; unit: string; type: string } | string;
  movementType: string;
  quantity: number;
  movementDate: string;
  sourceType: string;
  notes?: string;
  createdBy?: { _id: string; fullName: string };
  createdAt: string;
}

export interface Attachment {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface AuditLog {
  _id: string;
  user?: { _id: string; fullName: string; email: string; role: string };
  action: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  message?: string;
}

export interface DashboardStats {
  checks: { total: number; completed: number; pending: number };
  reports: { submitted: number; approved: number; rejected: number };
  shortages: number;
  lowStock: number;
  outOfStock: number;
  pendingApprovals: number;
  foodInventory: { available: number; lowStock: number; outOfStock: number; overConsumed: number };
  materialsInventory: { available: number; lowStock: number; outOfStock: number };
  recentActivity: ApprovalRecord[];
}
