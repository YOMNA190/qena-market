import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { vendorApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  Search, 
  Eye, 
  Phone, 
  MapPin, 
  Calendar,
  Clock,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  notes?: string;
  createdAt: string;
  user: {
    fullName: string;
    phone: string;
  };
  address: {
    district: string;
    street: string;
    building: string;
    phone: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
    product?: {
      name: string;
    };
  }[];
}

const statusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'تم التأكيد',
  PREPARING: 'جاري التحضير',
  READY: 'جاهز للاستلام',
  OUT_FOR_DELIVERY: 'في الطريق',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
  REFUNDED: 'تم الاسترجاع',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-purple-100 text-purple-800',
  READY: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const paymentMethodLabels: Record<string, string> = {
  CASH_ON_DELIVERY: 'الدفع عند الاستلام',
  ONLINE_PAYMENT: 'دفع إلكتروني',
  WALLET: 'محفظة إلكترونية',
};

export default function VendorOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await vendorApi.getOrders({
        status: statusFilter || undefined,
      });
      setOrders(response.data.data);
    } catch (error) {
      toast.error('فشل في تحميل الطلبات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await vendorApi.updateOrderStatus(orderId, newStatus);
      toast.success('تم تحديث حالة الطلب');
      fetchOrders();
    } catch (error) {
      toast.error('فشل في تحديث حالة الطلب');
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user.phone.includes(searchQuery)
  );

  const getNextStatuses = (currentStatus: string): string[] => {
    const flow: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['OUT_FOR_DELIVERY', 'CANCELLED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
      REFUNDED: [],
    };
    return flow[currentStatus] || [];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">الطلبات</h1>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-sm">
            {orders.filter(o => o.status === 'PENDING').length} طلب جديد
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث برقم الطلب أو اسم العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الحالات</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد طلبات</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter
                  ? 'لا توجد طلبات تطابق معايير البحث'
                  : 'لم تستلم أي طلبات بعد'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Order Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">#{order.orderNumber}</span>
                          <Badge className={statusColors[order.status]}>
                            {statusLabels[order.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="font-bold text-lg">{order.total} ج.م</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} منتج
                        </p>
                      </div>
                      {expandedOrder === order.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {expandedOrder === order.id && (
                  <div className="border-t px-4 py-4 space-y-4">
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">معلومات العميل</h4>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {order.user.fullName}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {order.user.phone}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">عنوان التوصيل</h4>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {order.address.district}
                          </p>
                          <p className="text-muted-foreground mr-6">
                            {order.address.street} - {order.address.building}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-right">المنتج</th>
                            <th className="px-4 py-2 text-center">الكمية</th>
                            <th className="px-4 py-2 text-left">السعر</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="px-4 py-2">{item.name}</td>
                              <td className="px-4 py-2 text-center">{item.quantity}</td>
                              <td className="px-4 py-2 text-left">{item.price} ج.م</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Order Summary */}
                    <div className="flex justify-between items-center text-sm">
                      <div className="space-y-1">
                        <p>طريقة الدفع: {paymentMethodLabels[order.paymentMethod]}</p>
                        {order.notes && (
                          <p className="text-muted-foreground">ملاحظات: {order.notes}</p>
                        )}
                      </div>
                      <div className="text-left space-y-1">
                        <p>المجموع: {order.subtotal} ج.م</p>
                        <p>التوصيل: {order.deliveryFee} ج.م</p>
                        <p className="font-bold text-lg">الإجمالي: {order.total} ج.م</p>
                      </div>
                    </div>

                    {/* Status Actions */}
                    {getNextStatuses(order.status).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <span className="text-sm text-muted-foreground">تحديث الحالة:</span>
                        {getNextStatuses(order.status).map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={status === 'CANCELLED' ? 'destructive' : 'default'}
                            onClick={() => handleUpdateStatus(order.id, status)}
                          >
                            {statusLabels[status]}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
