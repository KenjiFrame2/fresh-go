import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductPage from './pages/client/ProductPage';
import StoreInfoPage from './pages/client/StoreInfoPage';
import ClientDashboard from './pages/client/Dashboard';
import StoreDashboard from './pages/store/Dashboard';
import CourierDashboard from './pages/courier/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import PaymentSimulator from './pages/client/PaymentSimulator';
import OrderSuccess from './pages/client/OrderSuccess';
import { LogOut } from 'lucide-react';

function App() {
  const { token, role } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* --- ПУБЛИЧНЫЕ РОУТЫ --- */}
        {!token ? (
          <>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          /* --- ПРИВАТНЫЕ РОУТЫ (ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ) --- */
          <>
            <Route path="/payment-simulator" element={<PaymentSimulator />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/store/:id/info" element={<StoreInfoPage />} />
            
            <Route path="/" element={
              role === 'ADMIN' ? <AdminDashboard /> :
              role === 'CLIENT' ? <ClientDashboard /> :
              role === 'STORE' ? <StoreDashboard /> :
              role === 'COURIER' ? <CourierDashboard /> : <LoginPage />
            } />
            
            <Route path="/admin" element={role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>

      {/* Кнопка выхода (только для дебага, если нужно) */}
      {token && (
        <button 
          onClick={() => useAuthStore.getState().logout()}
          className="fixed bottom-4 right-4 bg-white/80 backdrop-blur-md text-red-500 p-3 rounded-full shadow-xl border border-red-50 z-[999] active:scale-90 transition-all"
        >
          <LogOut size={20} />
        </button>
      )}
    </BrowserRouter>
  );
}

export default App;