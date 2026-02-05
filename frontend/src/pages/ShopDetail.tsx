import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shopApi } from '@/services/api';
import { Shop } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Phone, MapPin, Clock, Star, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function ShopDetail() {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const response = await shopApi.getShopById(id!);
        setShop(response.data.data);
      } catch (error) {
        console.error('Failed to fetch shop:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShop();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">المحل غير موجود</h1>
        <Link to="/shops">
          <Button>العودة إلى المحلات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Shop Header */}
      <div className="bg-emerald-600 text-white py-12">
        <div className="container mx-auto px-4">
          <Link to="/shops" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4" />
            العودة إلى المحلات
          </Link>
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              {shop.logo ? (
                <img
                  src={shop.logo}
                  alt={shop.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Store className="h-12 w-12 text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{shop.name}</h1>
                <Badge className="bg-white/20">{shop.category?.nameAr}</Badge>
              </div>
              <p className="text-emerald-100 mb-4">{shop.description}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  {shop.rating || 'جديد'}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-4 w-4" />
                  {shop.productCount} منتج
                </span>
                {shop.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {shop.phone}
                  </span>
                )}
                {shop.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {shop.address}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">منتجات المحل</h2>
        {shop.products && shop.products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {shop.products.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <div className="aspect-square bg-gray-100 relative">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0].imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}
                    {product.salePrice && (
                      <Badge className="absolute top-2 left-2 bg-red-500">
                        خصم
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-emerald-600">
                        {product.salePrice || product.price} ج.م
                      </span>
                      {product.salePrice && (
                        <span className="text-sm text-gray-400 line-through">
                          {product.price} ج.م
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>لا توجد منتجات في هذا المحل</p>
          </div>
        )}
      </div>
    </div>
  );
}
