import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">السوق الحضاري الرقمي</h1>
          <p className="text-gray-600">قنا الجديدة</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
