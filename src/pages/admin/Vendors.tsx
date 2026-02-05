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
  UserCheck, 
  Store,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Vendor {
  id: string;
  shopName: string;
  status: string;
  phone?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
  };
  shops: {
    id: string;
    name: string;
    status: string;
  }[];
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  INACTIVE: 'غير نشط',
  SUSPENDED: 'موقوف',
  PENDING: 'قيد الانتظار',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
};

export default function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pendingVendors, setPendingVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const [allVendors, pending] = await Promise.all([
        adminApi.getVendors(),
        adminApi.getPendingVendors(),
      ]);
      setVendors(allVendors.data.data);
      setPendingVendors(pending.data.data);
    } catch (error) {
      toast.error('فشل في تحميل البائعين');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleApprove = async () => {
    if (!selectedVendor) return;
    
    try {
      await adminApi.updateVendorStatus(selectedVendor.id, 'ACTIVE');
      toast.success('تم قبول البائع بنجاح');
      setIsApproveDialogOpen(false);
      fetchVendors();
    } catch (error) {
      toast.error('فشل في قبول البائع');
    }
  };

  const handleReject = async () => {
    if (!selectedVendor) return;
    
    try {
      await adminApi.updateVendorStatus(selectedVendor.id, 'SUSPENDED');
      toast.success('تم رفض البائع');
      setIsRejectDialogOpen(false);
      fetchVendors();
    } catch (error) {
      toast.error('فشل في رفض البائع');
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
        <h1 className="text-2xl font-bold">إدارة البائعين</h1>
        <Badge variant="secondary">
          {vendors.length} بائع
        </Badge>
      </div>

      {/* Pending Vendors Section */}
      {pendingVendors.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            بائعين قيد الانتظار ({pendingVendors.length})
          </h2>
          <div className="grid gap-4">
            {pendingVendors.map((vendor) => (
              <Card key={vendor.id} className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <UserCheck className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{vendor.shopName}</span>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            قيد الانتظار
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {vendor.user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {vendor.user.phone || vendor.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(vendor.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedVendor(vendor);
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
                          setSelectedVendor(vendor);
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

      {/* All Vendors */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">جميع البائعين</h2>
        <Card>
          <CardContent className="p-0">
            {vendors.length === 0 ? (
              <div className="p-12 text-center">
                <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا يوجد بائعين</h3>
                <p className="text-muted-foreground">لم يتم تسجيل أي بائعين بعد</p>
              </div>
            ) : (
              <div className="divide-y">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{vendor.shopName}</span>
                            <Badge className={statusColors[vendor.status]}>
                              {statusLabels[vendor.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {vendor.user.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Store className="h-3 w-3" />
                              {vendor.shops.length} محل
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(vendor.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {vendor.status === 'ACTIVE' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              adminApi.updateVendorStatus(vendor.id, 'SUSPENDED');
                              fetchVendors();
                            }}
                          >
                            إيقاف
                          </Button>
                        ) : vendor.status === 'SUSPENDED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              adminApi.updateVendorStatus(vendor.id, 'ACTIVE');
                              fetchVendors();
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
            <AlertDialogTitle>قبول البائع</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من قبول البائع &quot;{selectedVendor?.shopName}&quot;؟
              سيتمكن من البدء في استخدام المنصة فوراً.
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
            <AlertDialogTitle>رفض البائع</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رفض البائع &quot;{selectedVendor?.shopName}&quot;؟
              لن يتمكن من استخدام المنصة.
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
