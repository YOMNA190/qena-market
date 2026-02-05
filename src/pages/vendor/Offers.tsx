import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { vendorApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Percent, 
  Plus, 
  Calendar, 
  Tag, 
  Trash2, 
  Edit2,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description?: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export default function VendorOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountPercent: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const response = await vendorApi.getOffers({ includeInactive: true });
      setOffers(response.data.data);
    } catch (error) {
      toast.error('فشل في تحميل العروض');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discountPercent: '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setEditingOffer(null);
  };

  const handleOpenDialog = (offer?: Offer) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        title: offer.title,
        description: offer.description || '',
        discountPercent: offer.discountPercent.toString(),
        startDate: offer.startDate.split('T')[0],
        endDate: offer.endDate.split('T')[0],
        isActive: offer.isActive,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        discountPercent: parseInt(formData.discountPercent),
      };

      if (editingOffer) {
        await vendorApi.updateOffer(editingOffer.id, data);
        toast.success('تم تحديث العرض بنجاح');
      } else {
        await vendorApi.createOffer(data);
        toast.success('تم إضافة العرض بنجاح');
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchOffers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في حفظ العرض');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await vendorApi.deleteOffer(id);
      toast.success('تم حذف العرض بنجاح');
      fetchOffers();
    } catch (error) {
      toast.error('فشل في حذف العرض');
    }
  };

  const handleToggleActive = async (offer: Offer) => {
    try {
      await vendorApi.updateOffer(offer.id, { isActive: !offer.isActive });
      toast.success(offer.isActive ? 'تم إلغاء تفعيل العرض' : 'تم تفعيل العرض');
      fetchOffers();
    } catch (error) {
      toast.error('فشل في تحديث حالة العرض');
    }
  };

  const isOfferActive = (offer: Offer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);
    return offer.isActive && now >= start && now <= end;
  };

  const isOfferExpired = (offer: Offer) => {
    const now = new Date();
    const end = new Date(offer.endDate);
    return now > end;
  };

  const isOfferUpcoming = (offer: Offer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    return now < start;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">العروض والخصومات</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 ml-2" />
              عرض جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingOffer ? 'تعديل العرض' : 'عرض جديد'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان العرض *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: خصم 20% على جميع المنتجات"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف العرض (اختياري)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discountPercent">نسبة الخصم (%) *</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  min="1"
                  max="99"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                  placeholder="20"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">تاريخ البدء *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">تاريخ الانتهاء *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">تفعيل العرض</Label>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingOffer ? 'تحديث' : 'إضافة'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Offers Grid */}
      {offers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Percent className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد عروض</h3>
            <p className="text-muted-foreground mb-4">
              قم بإضافة عروض خاصة لجذب المزيد من العملاء
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة عرض
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className={!offer.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{offer.title}</CardTitle>
                      {offer.description && (
                        <p className="text-sm text-muted-foreground">{offer.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {offer.discountPercent}%
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    من {new Date(offer.startDate).toLocaleDateString('ar-EG')} 
                    {' '}إلى{' '}
                    {new Date(offer.endDate).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {isOfferActive(offer) ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 ml-1" />
                      نشط
                    </Badge>
                  ) : isOfferExpired(offer) ? (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 ml-1" />
                      منتهي
                    </Badge>
                  ) : isOfferUpcoming(offer) ? (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 ml-1" />
                      قادم
                    </Badge>
                  ) : (
                    <Badge variant="secondary">غير نشط</Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={offer.isActive}
                      onCheckedChange={() => handleToggleActive(offer)}
                    />
                    <span className="text-sm">{offer.isActive ? 'مفعل' : 'معطل'}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(offer)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف العرض</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف هذا العرض؟ لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(offer.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
