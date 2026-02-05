import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Store, 
  MapPin,
  Phone,
  User,
  CheckCircle,
  XCircle,
  Star,
  AlertCircle,
  Package
} from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  status: string;
  isFeatured: boolean;
  rating: number;
  createdAt: string;
  category: {
    nameAr: string;
  };
  vendor: {
    shopName: string;
    user: {
      fullName: string;
      phone?: string;
    };
  };
  _count?: {
    products: number;
  };
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  INACTIVE: 'غير نشط',
  SUSPENDED: 'موقوف',
  PENDING: 'قيد المراجعة',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
};

export default function AdminShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [pendingShops, setPendingShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const fetchShops = async () => {
    try {
      setIsLoading(true);
      const [allShops, pending] = await Promise.all([
        adminApi.getShops(),
        adminApi.getPendingShops(),
      ]);
      setShops(allShops.data.data);
      setPendingShops(pending.data.data);
    } catch (error) {
      toast.error('فشل في تحميل المحلات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleApprove = async () => {
    if (!selectedShop) return;
    
    try {
      await adminApi.updateShopStatus(selectedShop.id, 'ACTIVE');
      toast.success('تم قبول المحل بنجاح');
      setIsApproveDialogOpen(false);
      fetchShops();
    } catch (error) {
      toast.error('فشل في قبول المحل');
    }
  };

  const handleReject = async () => {
    if (!selectedShop) return;
    
    try {
      await adminApi.updateShopStatus(selectedShop.id, 'SUSPENDED');
      toast.success('تم رفض المحل');
      setIsRejectDialogOpen(false);
      fetchShops();
    } catch (error) {
      toast.error('فشل في رفض المحل');
    }
  };

  const handleToggleFeatured = async (shop: Shop) => {
    try {
      await adminApi.toggleShopFeatured(shop.id);
      toast.success(shop.isFeatured ? 'تم إلغاء التمييز' : 'تم تمييز المحل');
      fetchShops();
    } catch (error) {
      toast.error('فشل في تحديث حالة التمييز');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة المحلات</h1>
        <Badge variant="secondary">
          {shops.length} محل
        </Badge>
      </div>

      {/* Pending Shops Section */}
      {pendingShops.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            محلات قيد المراجعة ({pendingShops.length})
          </h2>
          <div className="grid gap-4">
            {pendingShops.map((shop) => (
              <Card key={shop.id} className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <Store className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{shop.name}</span>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            قيد المراجعة
                          </Badge>
                          <Badge variant="outline">{shop.category.nameAr}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {shop.vendor.user.fullName}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {shop.address}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedShop(shop);
                          setIsApproveDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 ml-1" />
                        قبول
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedShop(shop);
                          setIsRejectDialogOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 ml-1" />
                        رفض
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Shops */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">جميع المحلات</h2>
        <Card>
          <CardContent className="p-0">
            {shops.length === 0 ? (
              <div className="p-12 text-center">
                <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا يوجد محلات</h3>
                <p className="text-muted-foreground">لم يتم تسجيل أي محلات بعد</p>
              </div>
            ) : (
              <div className="divide-y">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{shop.name}</span>
                            <Badge className={statusColors[shop.status]}>
                              {statusLabels[shop.status]}
                            </Badge>
                            <Badge variant="outline">{shop.category.nameAr}</Badge>
                            {shop.isFeatured && (
                              <Badge className="bg-amber-100 text-amber-800">
                                <Star className="h-3 w-3 ml-1" />
                                مميز
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {shop.vendor.user.fullName}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shop.address}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {shop._count?.products || 0} منتج
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {shop.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={shop.isFeatured ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleFeatured(shop)}
                        >
                          <Star className="h-4 w-4 ml-1" />
                          {shop.isFeatured ? 'إلغاء التمييز' : 'تمييز'}
                        </Button>
                        {shop.status === 'ACTIVE' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              adminApi.updateShopStatus(shop.id, 'SUSPENDED');
                              fetchShops();
                            }}
                          >
                            إيقاف
                          </Button>
                        ) : shop.status === 'SUSPENDED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              adminApi.updateShopStatus(shop.id, 'ACTIVE');
                              fetchShops();
                            }}
                          >
                            تفعيل
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>قبول المحل</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من قبول المحل &quot;{selectedShop?.name}&quot;؟
              سيكون متاحاً للعملاء فوراً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              قبول
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>رفض المحل</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رفض المحل &quot;{selectedShop?.name}&quot;؟
              لن يكون متاحاً للعملاء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive">
              رفض
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
