import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';

// Public Pages
import Home from '@/pages/Home';
import Categories from '@/pages/Categories';
import CategoryDetail from '@/pages/CategoryDetail';
import Shops from '@/pages/Shops';
import ShopDetail from '@/pages/ShopDetail';
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Search from '@/pages/Search';
import Offers from '@/pages/Offers';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';

// Customer Pages
import Profile from '@/pages/customer/Profile';
import Addresses from '@/pages/customer/Addresses';
import Orders from '@/pages/customer/Orders';
import OrderDetail from '@/pages/customer/OrderDetail';
import Favorites from '@/pages/customer/Favorites';
import Cart from '@/pages/customer/Cart';
import Checkout from '@/pages/customer/Checkout';

// Vendor Pages
import VendorDashboard from '@/pages/vendor/Dashboard';
import VendorProducts from '@/pages/vendor/Products';
import VendorOrders from '@/pages/vendor/Orders';
import VendorOffers from '@/pages/vendor/Offers';
import VendorAnalytics from '@/pages/vendor/Analytics';
import VendorShopSettings from '@/pages/vendor/ShopSettings';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminUsers from '@/pages/admin/Users';
import AdminVendors from '@/pages/admin/Vendors';
import AdminShops from '@/pages/admin/Shops';
import AdminCategories from '@/pages/admin/Categories';
import AdminProducts from '@/pages/admin/Products';
import AdminOrders from '@/pages/admin/Orders';

// Components
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/:id" element={<CategoryDetail />} />
              <Route path="/shops" element={<Shops />} />
              <Route path="/shops/:id" element={<ShopDetail />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/offers" element={<Offers />} />
            </Route>

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Customer Routes */}
            <Route element={<ProtectedRoute />}>              <Route element={<MainLayout />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/addresses" element={<Addresses />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
              </Route>
            </Route>

            {/* Vendor Routes */}
            <Route element={<RoleRoute allowedRoles={['VENDOR']} />}>
              <Route element={<DashboardLayout type="vendor" />}>
                <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                <Route path="/vendor/products" element={<VendorProducts />} />
                <Route path="/vendor/orders" element={<VendorOrders />} />
                <Route path="/vendor/offers" element={<VendorOffers />} />
                <Route path="/vendor/analytics" element={<VendorAnalytics />} />
                <Route path="/vendor/settings" element={<VendorShopSettings />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
              <Route element={<DashboardLayout type="admin" />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/vendors" element={<AdminVendors />} />
                <Route path="/admin/shops" element={<AdminShops />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <Toaster position="top-left" richColors />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
