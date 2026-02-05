import { useEffect, useState } from 'react';
import { userApi } from '@/services/api';
import { Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Addresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    city: 'قنا الجديدة',
    district: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
    phone: '',
    notes: '',
    isDefault: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await userApi.getAddresses();
      setAddresses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await userApi.updateAddress(editingAddress.id, formData);
        toast.success('تم تحديث العنوان');
      } else {
        await userApi.createAddress(formData);
        toast.success('تم إضافة العنوان');
      }
      setIsDialogOpen(false);
      setEditingAddress(null);
      resetForm();
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حفظ العنوان');
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      city: address.city,
      district: address.district,
      street: address.street,
      building: address.building,
      floor: address.floor || '',
      apartment: address.apartment || '',
      phone: address.phone,
      notes: address.notes || '',
      isDefault: address.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنوان؟')) return;
    try {
      await userApi.deleteAddress(id);
      toast.success('تم حذف العنوان');
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حذف العنوان');
    }
  };

  const resetForm = () => {
    setFormData({
      city: 'قنا الجديدة',
      district: '',
      street: '',
      building: '',
      floor: '',
      apartment: '',
      phone: '',
      notes: '',
      isDefault: false,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">عناويني</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">عناويني</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setEditingAddress(null);
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة عنوان
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'تعديل عنوان' : 'إضافة عنوان جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="district">الحي *</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street">الشارع *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="building">المبنى *</Label>
                <Input
                  id="building"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floor">الدور</Label>
                  <Input
                    id="floor"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apartment">الشقة</Label>
                  <Input
                    id="apartment"
                    value={formData.apartment}
                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                {editingAddress ? 'تحديث' : 'إضافة'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">لا توجد عناوين مسجلة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <Card key={address.id} className={address.isDefault ? 'border-emerald-500' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium">{address.district}</span>
                      {address.isDefault && (
                        <Badge className="bg-emerald-100 text-emerald-800">
                          <Check className="h-3 w-3 ml-1" />
                          افتراضي
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600">{address.street}</p>
                    <p className="text-gray-600">مبنى: {address.building}</p>
                    {address.floor && <p className="text-gray-600">دور: {address.floor}</p>}
                    <p className="text-gray-600 mt-2">{address.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(address)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(address.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
