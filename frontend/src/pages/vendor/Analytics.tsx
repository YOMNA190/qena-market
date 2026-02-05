import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { vendorApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';

interface AnalyticsData {
  products: {
    total: number;
    active: number;
  };
  orders: {
    total: number;
    today: number;
    thisMonth: number;
    pending: number;
    confirmed: number;
    delivered: number;
  };
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
  };
  recentOrders: any[];
  topProducts: any[];
  dailySales: any[];
}

export default function VendorAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await vendorApi.getDashboard();
      setData(response.data.data);
    } catch (error) {
      toast.error('فشل في تحميل التحليلات');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'إجمالي الإيرادات',
      value: data.revenue.total,
      subValue: `${data.revenue.today} ج.م اليوم`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'إجمالي الطلبات',
      value: data.orders.total,
      subValue: `${data.orders.today} طلب اليوم`,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'المنتجات',
      value: data.products.total,
      subValue: `${data.products.active} نشط`,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'الطلبات المعلقة',
      value: data.orders.pending,
      subValue: `${data.orders.confirmed} قيد التحضير`,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">التحليلات والإحصائيات</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    {card.title.includes('إيراد') ? `${card.value} ج.م` : card.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{card.subValue}</p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              المبيعات اليومية (آخر 30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.dailySales.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات كافية
              </div>
            ) : (
              <div className="space-y-2">
                {data.dailySales.slice(-7).map((day: any, index: number) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm w-24">
                      {new Date(day.date).toLocaleDateString('ar-EG', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(
                            (day.revenue / Math.max(...data.dailySales.map((d: any) => d.revenue))) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-left">
                      {parseFloat(day.revenue).toFixed(0)} ج.م
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              أكثر المنتجات مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات كافية
              </div>
            ) : (
              <div className="space-y-4">
                {data.topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.totalSold} مبيعة
                      </p>
                    </div>
                    <span className="font-medium">
                      {product.price} ج.م
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>توزيع حالات الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: 'قيد الانتظار', value: data.orders.pending, color: 'bg-yellow-500' },
              { label: 'تم التأكيد', value: data.orders.confirmed, color: 'bg-blue-500' },
              { label: 'جاري التحضير', value: data.orders.confirmed, color: 'bg-purple-500' },
              { label: 'جاهز', value: 0, color: 'bg-indigo-500' },
              { label: 'في الطريق', value: 0, color: 'bg-orange-500' },
              { label: 'تم التوصيل', value: data.orders.delivered, color: 'bg-green-500' },
            ].map((status, index) => (
              <div key={index} className="text-center p-4 bg-muted rounded-lg">
                <div className={`w-3 h-3 rounded-full ${status.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold">{status.value}</p>
                <p className="text-sm text-muted-foreground">{status.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص الشهر الحالي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-3xl font-bold text-green-600">
                {data.revenue.thisMonth} ج.م
              </p>
              <p className="text-muted-foreground">إيرادات الشهر</p>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <ShoppingCart className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-3xl font-bold text-blue-600">
                {data.orders.thisMonth}
              </p>
              <p className="text-muted-foreground">طلبات الشهر</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <Package className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <p className="text-3xl font-bold text-purple-600">
                {data.products.active}
              </p>
              <p className="text-muted-foreground">منتجات نشطة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
