import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  UserCheck,
  Clock,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    newToday: number;
  };
  vendors: {
    total: number;
    pending: number;
  };
  shops: {
    total: number;
    pending: number;
  };
  products: {
    total: number;
  };
  orders: {
    total: number;
    today: number;
    thisMonth: number;
    pending: number;
  };
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
  };
  recentOrders: any[];
  topProducts: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getDashboard();
      setStats(response.data.data);
    } catch (error) {
      toast.error('فشل في تحميل إحصائيات لوحة التحكم');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats.users.total,
      subValue: `+${stats.users.newToday} اليوم`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/admin/users',
    },
    {
      title: 'البائعين',
      value: stats.vendors.total,
      subValue: `${stats.vendors.pending} قيد الانتظار`,
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/admin/vendors',
    },
    {
      title: 'المحلات',
      value: stats.shops.total,
      subValue: `${stats.shops.pending} قيد المراجعة`,
      icon: Store,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/admin/shops',
    },
    {
      title: 'المنتجات',
      value: stats.products.total,
      subValue: 'منتج',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/admin/products',
    },
    {
      title: 'إجمالي الطلبات',
      value: stats.orders.total,
      subValue: `${stats.orders.today} اليوم`,
      icon: ShoppingCart,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      link: '/admin/orders',
    },
    {
      title: 'الطلبات المعلقة',
      value: stats.orders.pending,
      subValue: 'يحتاج معالجة',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      link: '/admin/orders',
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${stats.revenue.total} ج.م`,
      subValue: `${stats.revenue.today} ج.م اليوم`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      link: '/admin/orders',
    },
    {
      title: 'إيرادات الشهر',
      value: `${stats.revenue.thisMonth} ج.م`,
      subValue: 'هذا الشهر',
      icon: TrendingUp,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      link: '/admin/orders',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">لوحة تحكم المشرف</h1>
        <div className="flex gap-2">
          {stats.vendors.pending > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {stats.vendors.pending} بائعين قيد الانتظار
            </Badge>
          )}
          {stats.shops.pending > 0 && (
            <Badge variant="warning" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {stats.shops.pending} محلات قيد المراجعة
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <Link key={index} to={card.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.subValue}</p>
                  </div>
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>أحدث الطلبات</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/orders">
                عرض الكل
                <ArrowLeft className="h-4 w-4 mr-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد طلبات</p>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.slice(0, 5).map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">#{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.user.fullName}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{order.total} ج.م</p>
                      <Badge variant={order.status === 'PENDING' ? 'destructive' : 'default'}>
                        {order.status === 'PENDING' ? 'قيد الانتظار' : order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>أكثر المنتجات مبيعاً</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
            ) : (
              <div className="space-y-4">
                {stats.topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-3 bg-muted rounded-lg"
                  >
                    <span className="text-lg font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.shop?.name}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{product.totalSold} مبيعة</p>
                      <p className="text-sm text-muted-foreground">
                        {product.price} ج.م
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
