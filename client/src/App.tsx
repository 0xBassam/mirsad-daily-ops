import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { UsersPage } from './pages/users/UsersPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { BuildingsPage } from './pages/projects/BuildingsPage';
import { FloorsPage } from './pages/projects/FloorsPage';
import { ItemsPage } from './pages/items/ItemsPage';
import { CategoriesPage } from './pages/items/CategoriesPage';
import { DailyPlansPage } from './pages/daily-plans/DailyPlansPage';
import { DailyPlanFormPage } from './pages/daily-plans/DailyPlanFormPage';
import { FloorChecksPage } from './pages/floor-checks/FloorChecksPage';
import { FloorCheckDetailPage } from './pages/floor-checks/FloorCheckDetailPage';
import { FoodInventoryPage } from './pages/inventory/FoodInventoryPage';
import { MaterialsPage } from './pages/inventory/MaterialsPage';
import { MovementsPage } from './pages/inventory/MovementsPage';
import { ApprovalsPage } from './pages/approvals/ApprovalsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { SuppliersPage } from './pages/suppliers/SuppliersPage';
import { SupplierDetailPage } from './pages/suppliers/SupplierDetailPage';
import { BatchesPage } from './pages/batches/BatchesPage';
import { BatchDetailPage } from './pages/batches/BatchDetailPage';
import { FridgeChecksPage } from './pages/fridge-checks/FridgeChecksPage';
import { FridgeCheckDetailPage } from './pages/fridge-checks/FridgeCheckDetailPage';
import { ExpiryTrackingPage } from './pages/expiry/ExpiryTrackingPage';
import { SpoilageAlertsPage } from './pages/spoilage/SpoilageAlertsPage';
import { CorrectiveActionsPage } from './pages/corrective-actions/CorrectiveActionsPage';
import { CorrectiveActionDetailPage } from './pages/corrective-actions/CorrectiveActionDetailPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { ReportDetailPage } from './pages/reports/ReportDetailPage';
import { InventoryItemDetailPage } from './pages/inventory/InventoryItemDetailPage';
import { PurchaseOrdersPage } from './pages/purchase-orders/PurchaseOrdersPage';
import { PurchaseOrderDetailPage } from './pages/purchase-orders/PurchaseOrderDetailPage';
import { SpoilageRecordingPage } from './pages/spoilage-records/SpoilageRecordingPage';
import { TransfersPage } from './pages/transfers/TransfersPage';
import { ReceivingPage } from './pages/receiving/ReceivingPage';
import { ReceivingDetailPage } from './pages/receiving/ReceivingDetailPage';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/buildings" element={<BuildingsPage />} />
              <Route path="/floors" element={<FloorsPage />} />
              <Route path="/items" element={<ItemsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/daily-plans" element={<DailyPlansPage />} />
              <Route path="/daily-plans/new" element={<DailyPlanFormPage />} />
              <Route path="/daily-plans/:id" element={<DailyPlanFormPage />} />
              <Route path="/floor-checks" element={<FloorChecksPage />} />
              <Route path="/floor-checks/:id" element={<FloorCheckDetailPage />} />
              <Route path="/inventory/food" element={<FoodInventoryPage />} />
              <Route path="/inventory/food/:id" element={<InventoryItemDetailPage />} />
              <Route path="/inventory/materials" element={<MaterialsPage />} />
              <Route path="/inventory/materials/:id" element={<InventoryItemDetailPage />} />
              <Route path="/inventory/movements" element={<MovementsPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
              <Route path="/batches" element={<BatchesPage />} />
              <Route path="/batches/:id" element={<BatchDetailPage />} />
              <Route path="/fridge-checks" element={<FridgeChecksPage />} />
              <Route path="/fridge-checks/:id" element={<FridgeCheckDetailPage />} />
              <Route path="/expiry-tracking" element={<ExpiryTrackingPage />} />
              <Route path="/spoilage-alerts" element={<SpoilageAlertsPage />} />
              <Route path="/spoilage" element={<SpoilageRecordingPage />} />
              <Route path="/transfers" element={<TransfersPage />} />
              <Route path="/receiving" element={<ReceivingPage />} />
              <Route path="/receiving/:id" element={<ReceivingDetailPage />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
              <Route path="/corrective-actions" element={<CorrectiveActionsPage />} />
              <Route path="/corrective-actions/:id" element={<CorrectiveActionDetailPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
