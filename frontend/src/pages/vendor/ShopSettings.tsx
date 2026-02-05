import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { vendorApi, shopApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Store, 
  Phone, 
  MapPin, 
  Clock, 
  Save,
  Image as ImageIcon,
  WhatsApp
} from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  location?: string;
  openingTime?: string;
  closingTime?: string;
  logo?: string;
  cover?: string;
  isActive: boolean;
  category: {
    id: string;
    nameAr: string;
  };
}

export default function ShopSettings() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Shop>>({});

  useEffect(() => {
    fetchShop();
  }, []);

  const fetchShop = async () => {
    try {
      setIsLoading(true);
      const response = await vendorApi.getMyShop();
      setShop(response.data.data);
      setFormData(response.data.data);
    } catch (error) {
      toast.error('فشل في تحميل بيانات المحل');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shop) return;

    try {
      setIsSaving(true);
      await shopApi.update(shop.id, formData);
      toast.success('تم تحديث بيانات المحل بنجاح');
      fetchShop();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في تحديث بيانات المحل');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shop) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لم يتم العثور على محل</h3>
          <p className="text-muted-foreground">
            يرجى التواصل مع الإدارة لإنشاء محل جديد
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">إعدادات المحل</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المحل *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف المحل</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="وصف قصير للمحل وما يقدمه..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    رقم الهاتف
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="flex items-center gap-2">
                    <WhatsApp className="h-4 w-4" />
                    واتساب
                  </Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  العنوان
                </Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="الحي - الشارع - المبنى"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">رابط الموقع (Google Maps)</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  ساعات العمل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openingTime">وقت الفتح</Label>
                  <Input
                    id="openingTime"
                    type="time"
                    value={formData.openingTime || ''}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closingTime">وقت الإغلاق</Label>
                  <Input
                    id="closingTime"
                    type="time"
                    value={formData.closingTime || ''}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>حالة المحل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">تفعيل المحل</p>
                    <p className="text-sm text-muted-foreground">
                      إظهار المحل للعملاء
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>التصنيف</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {shop.category.nameAr}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  للتغيير يرجى التواصل مع الإدارة
                </p>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSaving}
            >
              <Save className="h-4 w-4 ml-2" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
