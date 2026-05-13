export type UserRole = 'admin' | 'supervisor' | 'assistant_supervisor' | 'project_manager' | 'client' | 'operations' | 'warehouse' | 'kitchen';

export type OrgPlan = 'trial' | 'starter' | 'professional' | 'enterprise';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  project?: { _id: string; name: string } | string;
  organizationId?: string | null;
  orgName?: string;
  plan?: OrgPlan;
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
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'closed';
  notes?: string;
  createdBy?: { _id: string; fullName: string };
  createdAt: string;
  lines?: DailyPlanLine[];
}

export type PlanLineStatus = 'pending' | 'in_progress' | 'completed' | 'shortage';

export interface DailyPlanLine {
  _id: string;
  dailyPlan?: { _id: string; date: string; shift: string; status: string; building?: { _id: string; name: string } } | string;
  floor: { _id: string; name: string } | string;
  item: { _id: string; name: string; unit: string } | string;
  plannedQty: number;
  actualQty: number;
  assignedTo?: { _id: string; fullName: string } | string;
  lineStatus: PlanLineStatus;
  completedBy?: { _id: string; fullName: string };
  completedAt?: string;
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

export interface DashboardRequestRow {
  _id: string;
  title: string;
  floor: string;
  priority: string;
  status: string;
  itemCount: number;
  createdAt: string;
}

export interface DashboardReceivingRow {
  _id: string;
  supplierName: string;
  deliveryDate: string;
  lineCount: number;
  status: string;
  invoiceNumber?: string;
}

export interface DashboardPORow {
  _id: string;
  poNumber: string;
  supplierName: string;
  month: string;
  status: string;
  lineCount: number;
  receivedPct: number;
}

export interface DashboardLowStockRow {
  name: string;
  type: 'food' | 'material';
  unit: string;
  remainingQty: number;
  monthlyLimit: number;
  status: 'low_stock' | 'out_of_stock';
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
  expiringIn3Days?: number;
  activeCorrectiveActions?: number;
  fridgeChecksToday?: number;
  activeSpoilageAlerts?: number;
  topConsumedItems?: { name: string; consumed: number }[];
  checksByFloor?: { name: string; count: number }[];
  openPurchaseOrders?: number;
  pendingTransfers?: number;
  openMaintenanceRequests?: number;
  // New operational fields
  operationRequestsOpen?: number;
  coffeeBreakRequestsOpen?: number;
  receivingToday?: number;
  latestOperationRequests?: DashboardRequestRow[];
  latestCoffeeBreakRequests?: DashboardRequestRow[];
  latestReceiving?: DashboardReceivingRow[];
  recentPurchaseOrders?: DashboardPORow[];
  lowStockItemsList?: DashboardLowStockRow[];
}

export type ReportType = 'daily_floor_check' | 'daily_project_summary' | 'weekly_warehouse' | 'monthly_food_inventory' | 'monthly_materials' | 'approval_summary' | 'food_stock_balance';

export interface Report {
  _id: string;
  title: string;
  reportType: ReportType;
  project: { _id: string; name: string };
  building?: { _id: string; name: string } | null;
  floor?: { _id: string; name: string } | null;
  dateFrom: string;
  dateTo: string;
  status: 'ready' | 'generating';
  generatedBy: { _id: string; fullName: string };
  createdAt: string;
}

// ── Phase 2 ────────────────────────────────────────────────────────────────

export interface Supplier {
  _id: string;
  name: string;
  nameAr?: string;
  contactName: string;
  phone: string;
  email: string;
  category: 'food' | 'material' | 'both';
  rating: number;
  status: 'active' | 'inactive' | 'blacklisted';
  licenseNumber?: string;
  address?: string;
  createdAt: string;
}

export type StorageZoneType = 'cold' | 'chilled' | 'ambient' | 'freezer' | 'dry_storage' | 'coffee_station' | 'hospitality';

export interface Batch {
  _id: string;
  batchNumber: string;
  item: { _id: string; name: string; unit: string; type: string };
  supplier: { _id: string; name: string };
  quantity: number;
  receivedDate: string;
  expiryDate: string;
  storageZone: StorageZoneType;
  remainingQty: number;
  status: 'active' | 'consumed' | 'expired' | 'spoiled' | 'recalled';
  project: { _id: string; name: string };
  notes?: string;
}

export interface FridgeCheckItem {
  _id: string;
  batch: { _id: string; batchNumber: string };
  item: { _id: string; name: string; unit: string };
  expiryDate: string;
  isExpired: boolean;
  isNearExpiry: boolean;
  quantity: number;
  condition: 'good' | 'damaged' | 'expired' | 'near_expiry';
  nameTagPresent: boolean;
  notes?: string;
}

export interface FridgeCheck {
  _id: string;
  date: string;
  floor: { _id: string; name: string };
  building: { _id: string; name: string };
  project: { _id: string; name: string };
  storageZone: StorageZoneType;
  checkedBy: { _id: string; fullName: string };
  temperature: number;
  expectedTempMin: number;
  expectedTempMax: number;
  cleanlinessOk: boolean;
  cleanlinessNotes?: string;
  itemsChecked: FridgeCheckItem[];
  status: 'ok' | 'issue_found' | 'corrective_action_required';
  correctiveActionId?: string;
  createdAt: string;
}

export interface CorrectiveAction {
  _id: string;
  title: string;
  description: string;
  sourceType: 'fridge_check' | 'floor_check' | 'inventory' | 'manual';
  sourceRef?: string;
  assignedTo: { _id: string; fullName: string };
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution?: string;
  resolvedAt?: string;
  createdBy: { _id: string; fullName: string };
  createdAt: string;
}

export interface SpoilageAlert {
  _id: string;
  batch?: { _id: string; batchNumber: string };
  item: { _id: string; name: string; unit: string };
  alertType: 'expired' | 'near_expiry' | 'temperature_breach' | 'damaged' | 'spoiled';
  daysUntilExpiry?: number;
  quantity: number;
  storageZone: StorageZoneType;
  status: 'active' | 'resolved' | 'dismissed';
  detectedAt: string;
  createdBy?: { _id: string; fullName: string };
  resolvedBy?: { _id: string; fullName: string };
}

export type SpoilageReason = 'expired' | 'damaged' | 'temperature_issue' | 'packaging_issue' | 'quality_issue' | 'spoiled' | 'other';

export interface SpoilageRecord {
  _id: string;
  item: { _id: string; name: string; unit: string; type: string };
  batch?: { _id: string; batchNumber: string };
  project: { _id: string; name: string } | string;
  quantity: number;
  reason: SpoilageReason;
  alertType: 'expired' | 'near_expiry' | 'temperature_breach' | 'damaged' | 'spoiled';
  location: string;
  storageZone?: string;
  date: string;
  notes?: string;
  status: 'active' | 'resolved' | 'dismissed';
  detectedAt: string;
  createdBy: { _id: string; fullName: string };
  resolvedBy?: { _id: string; fullName: string };
  resolvedAt?: string;
  createdAt: string;
}

export type POStatus = 'active' | 'partially_received' | 'fully_received' | 'near_depletion' | 'over_consumed' | 'closed';

export interface POLine {
  _id: string;
  item: { _id: string; name: string; unit: string; type: string } | string;
  approvedQty: number;
  receivedQty: number;
  distributedQty: number;
  consumedQty: number;
  remainingQty: number;
  variance: number;
  unit: string;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplier: { _id: string; name: string; category: string } | string;
  project: { _id: string; name: string } | string;
  month: string;
  startDate: string;
  endDate: string;
  status: POStatus;
  lines: POLine[];
  notes?: string;
  createdBy?: { _id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequest {
  _id: string;
  title: string;
  description: string;
  project: { _id: string; name: string } | string;
  building: { _id: string; name: string } | string;
  floor?: { _id: string; name: string } | string;
  category: 'electrical' | 'plumbing' | 'hvac' | 'equipment' | 'cleaning' | 'structural' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  reportedBy: { _id: string; fullName: string } | string;
  assignedTo?: { _id: string; fullName: string } | string;
  assignedAt?: string;
  resolvedAt?: string;
  resolution?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRequestItem {
  name: string;
  quantity: number;
  unit?: string;
}

export interface ClientRequest {
  _id: string;
  title: string;
  description: string;
  requestType: 'catering' | 'maintenance' | 'supplies' | 'event' | 'housekeeping' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project: { _id: string; name: string } | string;
  building?: { _id: string; name: string } | string;
  floor?: { _id: string; name: string } | string;
  room?: string;
  locationNotes?: string;
  requestedBy: { _id: string; fullName: string; role?: string } | string;
  assignedTo?: { _id: string; fullName: string } | string;
  status: 'submitted' | 'assigned' | 'in_progress' | 'delivered' | 'confirmed' | 'rejected';
  items: ClientRequestItem[];
  expectedDelivery?: string;
  deliveredAt?: string;
  confirmedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferLine {
  _id: string;
  item: { _id: string; name: string; unit: string; type: string } | string;
  quantity: number;
  notes?: string;
}

export interface Transfer {
  _id: string;
  project: { _id: string; name: string } | string;
  building: { _id: string; name: string } | string;
  floor: { _id: string; name: string } | string;
  lines: TransferLine[];
  status: 'draft' | 'confirmed' | 'cancelled';
  transferDate: string;
  notes?: string;
  createdBy: { _id: string; fullName: string } | string;
  confirmedBy?: { _id: string; fullName: string } | string;
  confirmedAt?: string;
  createdAt: string;
}

export interface ReceivingLine {
  _id: string;
  item: { _id: string; name: string; unit: string; type: string } | string;
  purchaseOrderLine?: string;
  quantityOrdered: number;
  quantityReceived: number;
  condition: 'good' | 'damaged' | 'rejected';
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface Receiving {
  _id: string;
  project: { _id: string; name: string } | string;
  supplier: { _id: string; name: string; contactName?: string } | string;
  purchaseOrder?: { _id: string; poNumber: string; status?: string } | string;
  deliveryDate: string;
  lines: ReceivingLine[];
  status: 'pending' | 'confirmed' | 'partial' | 'rejected';
  invoiceNumber?: string;
  notes?: string;
  receivedBy?: { _id: string; fullName: string } | string;
  confirmedBy?: { _id: string; fullName: string } | string;
  confirmedAt?: string;
  createdAt: string;
}
