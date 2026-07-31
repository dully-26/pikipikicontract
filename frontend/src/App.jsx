import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import UserDashboard from './pages/user/UserDashboard';
import Motorcycles from './pages/user/Motorcycles';
import Marketplace from './pages/user/Marketplace';
import SellMotorcycle from './pages/user/SellMotorcycle';
import MyRequests from './pages/user/MyRequests';
import Payments from './pages/user/Payments';
import ViewContract from './pages/user/ViewContract';
import Profile from './pages/user/Profile';

import ManagerDashboard from './pages/manager/ManagerDashboard';
import MotorcycleManagement from './pages/manager/MotorcycleManagement';
import Reports from './pages/manager/Reports';
import PurchaseRequests from './pages/manager/PurchaseRequests';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AddManager from './pages/admin/AddManager';
import AuditLogs from './pages/admin/AuditLogs';

import RecordPayment from './pages/manager/RecordPayment';
import PaymentRecords from './pages/manager/PaymentRecords';
import ContractsList from './pages/manager/ContractsList';

import './index.css';

const withLayout = (el, roles) => ( <ProtectedRoute allowedRoles={roles}> <Layout>{el}</Layout> </ProtectedRoute>
);

export default function App() {
return ( <AuthProvider> <BrowserRouter> <Routes>

```
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />


      {/* USER ROUTES */}
      <Route
        path="/dashboard"
        element={withLayout(<UserDashboard />, ['user'])}
      />

      <Route
        path="/motorcycles"
        element={withLayout(<Motorcycles />, ['user'])}
      />

      <Route
        path="/marketplace"
        element={withLayout(<Marketplace />, ['user'])}
      />

      <Route
        path="/sell"
        element={withLayout(<SellMotorcycle />, ['user'])}
      />

      <Route
        path="/my-requests"
        element={withLayout(<MyRequests />, ['user'])}
      />

      <Route
        path="/payments"
        element={withLayout(<Payments />, ['user'])}
      />

      <Route
        path="/profile"
        element={withLayout(<Profile />, ['user'])}
      />


      {/* MANAGER ROUTES */}
      <Route
        path="/manager"
        element={withLayout(
          <ManagerDashboard />,
          ['manager', 'admin']
        )}
      />

      <Route
        path="/manager/purchase-requests"
        element={withLayout(
          <PurchaseRequests />,
          ['manager', 'admin']
        )}
      />

      <Route
        path="/manager/motorcycles"
        element={withLayout(
          <MotorcycleManagement />,
          ['manager', 'admin']
        )}
      />

      <Route
        path="/manager/reports"
        element={withLayout(
          <Reports />,
          ['manager', 'admin']
        )}
      />

      <Route
        path="/manager/record-payment"
        element={withLayout(
          <RecordPayment />,
          ['manager', 'admin']
        )}
      />

      <Route
        path="/manager/payment-records"
        element={withLayout(
          <PaymentRecords />,
          ['manager', 'admin']
        )}
      />

      <Route
        path="/manager/contracts"
        element={withLayout(
          <ContractsList />,
          ['manager', 'admin']
        )}
      />


      {/* CONTRACT ROUTES */}
      <Route
        path="/contracts/:id"
        element={withLayout(
          <ViewContract />,
          ['user', 'manager', 'admin']
        )}
      />


      {/* ADMIN ROUTES */}
      <Route
        path="/admin"
        element={withLayout(
          <AdminDashboard />,
          ['admin']
        )}
      />

      <Route
        path="/admin/motorcycles"
        element={withLayout(
          <MotorcycleManagement />,
          ['admin']
        )}
      />

      <Route
        path="/admin/users"
        element={withLayout(
          <UserManagement />,
          ['admin']
        )}
      />

      <Route
        path="/admin/add-manager"
        element={withLayout(
          <AddManager />,
          ['admin']
        )}
      />

      <Route
        path="/admin/audit-logs"
        element={withLayout(
          <AuditLogs />,
          ['admin']
        )}
      />


      {/* FALLBACK */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  </BrowserRouter>
</AuthProvider>


);
}
