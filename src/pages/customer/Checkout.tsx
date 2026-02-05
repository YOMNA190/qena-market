import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartApi, orderApi, userApi } from '@/services/api';
import { Cart, Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, MapPin, CreditCard, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartRes, addressesRes] = await Promise.all([
          cartApi.getCart(),
          userApi.getAddresses(),
        ]);
        setCart(cartRes.data.data);
        setAddresses(addressesRes.data.data);
        const defaultAddress = addressesRes.data.data.find((a: Address) => a.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
        }
      } catch (error) {
        console.error('Failed to fetch checkout data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedAddress) {
      toast.error('يرجى اختيار عنوان التوصيل');
      return;
    }

    try {
      setIsSubmitting(true);
      await orderApi.createOrder({
        addressId: selectedAddress,
        paymentMethod,
      });
      toast.success('تم إنشاء الطلب بنجاح');
      navigate('/orders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إنشاء الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">إتمام الطلب</h1>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <ShoppingBag className="h-24 w-24 mx-auto mb-6 text-gray-300" />
        <h1 className="text-2xl font-bold mb-4">السلة فارغة</h1>
        <p className="text-gray-500">لا يمكن إتمام الطلب لأن السلة فارغة</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">إتمام الطلب</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address Selection */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                عنوان التوصيل
              </h2>

              {addresses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">لا توجد عناوين مسجلة</p>
                  <Button onClick={() => navigate('/addresses')}>
                    إضافة عنوان
                  </Button>
                </div>
              ) : (
                <RadioGroup
                  value={selectedAddress}
                  onValueChange={setSelectedAddress}
                  className="space-y-3"
                >
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAddress === address.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedAddress(address.id)}
                    >
                      <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={address.id} className="font-medium cursor-pointer">
                          {address.district}
                        </Label>
                        <p className="text-sm text-gray-500">{address.street}</p>
                        <p className="text-sm text-gray-500">مبنى: {address.building}</p>
                        <p className="text-sm text-gray-500">{address.phone}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                طريقة الدفع
              </h2>

              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="space-y-3"
              >
                <div
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'CASH_ON_DELIVERY'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                >
                  <RadioGroupItem value="CASH_ON_DELIVERY" id="cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    الدفع عند الاستلام
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">ملخص الطلب</h2>

              <div className="space-y-2 mb-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="line-clamp-1">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>
                      {(item.product.salePrice || item.product.price) * item.quantity} ج.م
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">المجموع الفرعي</span>
                  <span>{cart.subtotal} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">رسوم التوصيل</span>
                  <span>{cart.deliveryFee === 0 ? 'مجاني' : `${cart.deliveryFee} ج.م`}</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>الإجمالي</span>
                  <span className="text-emerald-600">{cart.total} ج.م</span>
                </div>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedAddress}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري إتمام الطلب...
                  </>
                ) : (
                  <>تأكيد الطلب</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
