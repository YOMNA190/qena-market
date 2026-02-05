import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi } from '@/services/api';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, MapPin, Phone, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'تم التأكيد',
  PREPARING: 'جاري التحضير',
  READY: 'جاهز',
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

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await orderApi.getOrderById(id!);
        setOrder(response.data.data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleCancel = async () => {
    try {
      await orderApi.cancelOrder(id!);
      toast.success('تم إلغاء الطلب');
      const response = await orderApi.getOrderById(id!);
      setOrder(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إلغاء الطلب');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">الطلب غير موجود</h1>
        <Link to="/orders">
          <Button>العودة إلى الطلبات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        العودة إلى الطلبات
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">رقم الطلب</p>
                  <p className="text-xl font-bold">#{order.orderNumber}</p>
                </div>
                <Badge className={statusColors[order.status]}>
                  {statusLabels[order.status]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">تاريخ الطلب</p>
                  <p>{new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
                <div>
                  <p className="text-gray-500">طريقة الدفع</p>
                  <p>
                    {order.paymentMethod === 'CASH_ON_DELIVERY'
                      ? 'الدفع عند الاستلام'
                      : order.paymentMethod}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">المنتجات</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0].imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.price} ج.م × {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold">{item.total} ج.م</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                عنوان التوصيل
              </h2>
              <p className="font-medium">{order.address?.district}</p>
              <p className="text-gray-600">{order.address?.street}</p>
              <p className="text-gray-600">مبنى: {order.address?.building}</p>
              {order.address?.floor && (
                <p className="text-gray-600">دور: {order.address.floor}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <Phone className="h-4 w-4" />
                {order.address?.phone}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">ملخص الطلب</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">المجموع الفرعي</span>
                  <span>{order.subtotal} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">رسوم التوصيل</span>
                  <span>{order.deliveryFee} ج.م</span>
                </div>
                {order.discount && (
                  <div className="flex justify-between text-green-600">
                    <span>الخصم</span>
                    <span>-{order.discount} ج.م</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>الإجمالي</span>
                  <span className="text-emerald-600">{order.total} ج.م</span>
                </div>
              </div>

              {order.status === 'PENDING' && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-600 hover:bg-red-50"
                  onClick={handleCancel}
                >
                  إلغاء الطلب
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
