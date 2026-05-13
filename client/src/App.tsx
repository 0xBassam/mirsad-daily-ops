import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ClientDashboardPage } from './pages/dashboard/ClientDashboardPage';
import { useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

function PageBoundary() {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <Outlet />
    </ErrorBoundary>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  return user?.role === 'client' ? <ClientDashboardPage /> : <DashboardPage />;
}
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
import { FridgeCheckNewPage } from './pages/fridge-checks/FridgeCheckNewPage';
import { ExpiryTrackingPage } from './pages/expiry/ExpiryTrackingPage';
import { SpoilageAlertsPage } from './pages/spoilage/SpoilageAlertsPage';
import { CorrectiveActionsPage } from './pages/corrective-actions/CorrectiveActionsPage';
import { CorrectiveActionDetailPage } from './pages/corrective-actions/CorrectiveActionDetailPage';
import { CorrectiveActionNewPage } from './pages/corrective-actions/CorrectiveActionNewPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { ReportDetailPage } from './pages/reports/ReportDetailPage';
import { InventoryItemDetailPage } from './pages/inventory/InventoryItemDetailPage';
import { PurchaseOrdersPage } from './pages/purchase-orders/PurchaseOrdersPage';
import { PurchaseOrderDetailPage } from './pages/purchase-orders/PurchaseOrderDetailPage';
import { PurchaseOrderFormPage } from './pages/purchase-orders/PurchaseOrderFormPage';
import { SpoilageRecordingPage } from './pages/spoilage-records/SpoilageRecordingPage';
import { TransfersPage } from './pages/transfers/TransfersPage';
import { ReceivingPage } from './pages/receiving/ReceivingPage';
import { ReceivingDetailPage } from './pages/receiving/ReceivingDetailPage';
import { ReceivingNewPage } from './pages/receiving/ReceivingNewPage';
import { MaintenanceRequestsPage } from './pages/maintenance/MaintenanceRequestsPage';
import { MaintenanceDetailPage } from './pages/maintenance/MaintenanceDetailPage';
import { MaintenanceNewPage } from './pages/maintenance/MaintenanceNewPage';
import { ClientRequestsPage } from './pages/client-requests/ClientRequestsPage';
import { ClientRequestDetailPage } from './pages/client-requests/ClientRequestDetailPage';
import { MenuPage } from './pages/menu/MenuPage';
import { MenuFormPage } from './pages/menu/MenuFormPage';
import { ClientRequestNewPage } from './pages/client-requests/ClientRequestNewPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route element={<PageBoundary />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardRouter />} />
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
              <Route path="/fridge-checks/new" element={<FridgeCheckNewPage />} />
              <Route path="/fridge-checks/:id" element={<FridgeCheckDetailPage />} />
              <Route path="/expiry-tracking" element={<ExpiryTrackingPage />} />
              <Route path="/spoilage-alerts" element={<SpoilageAlertsPage />} />
              <Route path="/spoilage" element={<SpoilageRecordingPage />} />
              <Route path="/transfers" element={<TransfersPage />} />
              <Route path="/receiving" element={<ReceivingPage />} />
              <Route path="/receiving/new" element={<ReceivingNewPage />} />
              <Route path="/receiving/:id" element={<ReceivingDetailPage />} />
              <Route path="/maintenance" element={<MaintenanceRequestsPage />} />
              <Route path="/maintenance/new" element={<MaintenanceNewPage />} />
              <Route path="/maintenance/:id" element={<MaintenanceDetailPage />} />
              <Route path="/client-requests" element={<ClientRequestsPage />} />
              <Route path="/client-requests/new" element={<ClientRequestNewPage />} />
              <Route path="/client-requests/:id" element={<ClientRequestDetailPage />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
              <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
              <Route path="/corrective-actions" element={<CorrectiveActionsPage />} />
              <Route path="/corrective-actions/new" element={<CorrectiveActionNewPage />} />
              <Route path="/corrective-actions/:id" element={<CorrectiveActionDetailPage />} />
              <Route path="/menu"      element={<MenuPage />} />
              <Route path="/menu/new" element={<MenuFormPage />} />
              <Route path="/menu/:id" element={<MenuFormPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>{/* PageBoundary */}
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
