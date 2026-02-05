import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vendorApi } from '@/services/api';
import { VendorDashboardStats } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

export default function VendorDashboard() {
  const [stats, setStats] = useState<VendorDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await vendorApi.getDashboard();
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">لم يتم العثور على بيانات</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">المنتجات</p>
                <p className="text-2xl font-bold">{stats.products.total}</p>
                <p className="text-sm text-emerald-600">{stats.products.active} نشط</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الطلبات</p>
                <p className="text-2xl font-bold">{stats.orders.total}</p>
                <p className="text-sm text-yellow-600">{stats.orders.pending} قيد الانتظار</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي المبيعات</p>
                <p className="text-2xl font-bold">{stats.revenue.total} ج.م</p>
                <p className="text-sm text-emerald-600">{stats.revenue.today} اليوم</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الطلبات المكتملة</p>
                <p className="text-2xl font-bold">{stats.orders.delivered}</p>
                <p className="text-sm text-emerald-600">هذا الشهر</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">أحدث الطلبات</h2>
            <Link
              to="/vendor/orders"
              className="text-emerald-600 hover:underline text-sm flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          {stats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.user?.fullName}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-emerald-600">{order.total} ج.م</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد طلبات</p>
          )}
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">أفضل المنتجات مبيعاً</h2>
            <Link
              to="/vendor/products"
              className="text-emerald-600 hover:underline text-sm flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          {stats.topProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.topProducts.map((product) => (
                <div key={product.id} className="text-center">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0].imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                  <p className="text-sm text-emerald-600">{product.totalSold} مبيع</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد منتجات</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
