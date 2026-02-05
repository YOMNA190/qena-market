import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Package, 
  Search,
  Store,
  Tag,
  Star,
  Trash2
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  rating: number;
  createdAt: string;
  images: { imageUrl: string }[];
  category: {
    nameAr: string;
  };
  shop: {
    name: string;
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getProducts();
      setProducts(response.data.data);
    } catch (error) {
      toast.error('فشل في تحميل المنتجات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleActive = async (product: Product) => {
    try {
      // This would need a proper API endpoint
      toast.success(product.isActive ? 'تم إلغاء تفعيل المنتج' : 'تم تفعيل المنتج');
      fetchProducts();
    } catch (error) {
      toast.error('فشل في تحديث حالة المنتج');
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await adminApi.toggleProductFeatured(product.id);
      toast.success(product.isFeatured ? 'تم إلغاء التمييز' : 'تم تمييز المنتج');
      fetchProducts();
    } catch (error) {
      toast.error('فشل في تحديث حالة التمييز');
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      // This would need a proper API endpoint
      toast.success('تم حذف المنتج');
      setIsDeleteDialogOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('فشل في حذف المنتج');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.shop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">إدارة المنتجات</h1>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث بالمنتج أو المحل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد منتجات</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'لا توجد نتائج تطابق البحث' : 'لم يتم إضافة أي منتجات بعد'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={!product.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.images[0] ? (
                      <img
                        src={product.images[0].imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold truncate">{product.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          {product.shop.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{product.category.nameAr}</Badge>
                      {product.isFeatured && (
                        <Badge className="bg-amber-100 text-amber-800">
                          <Star className="h-3 w-3 ml-1" />
                          مميز
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div>
                    <p className="font-bold">{product.price} ج.م</p>
                    <p className="text-sm text-muted-foreground">
                      المخزون: {product.stock}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={product.isActive}
                        onCheckedChange={() => handleToggleActive(product)}
                      />
                      <span className="text-sm">{product.isActive ? 'نشط' : 'معطل'}</span>
                    </div>
                    <Button
                      variant={product.isFeatured ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleFeatured(product)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsDeleteDialogOpen(true);
                      }}
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

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المنتج</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المنتج &quot;{selectedProduct?.name}&quot;؟
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
