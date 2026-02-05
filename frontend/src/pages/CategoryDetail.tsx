import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { categoryApi, shopApi } from '@/services/api';
import { Category, Shop, Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, ShoppingBag, ArrowLeft, Star } from 'lucide-react';

export default function CategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [categoryRes, shopsRes, productsRes] = await Promise.all([
          categoryApi.getCategoryById(id!),
          shopApi.getShopsByCategory(id!, { limit: 6 }),
          categoryApi.getCategoryProducts(id!, { limit: 8 }),
        ]);
        setCategory(categoryRes.data.data);
        setShops(shopsRes.data.data);
        setProducts(productsRes.data.data);
      } catch (error) {
        console.error('Failed to fetch category:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-32 mb-8" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">القسم غير موجود</h1>
        <Link to="/categories">
          <Button>العودة إلى الأقسام</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Category Header */}
      <div className="bg-emerald-600 text-white py-12">
        <div className="container mx-auto px-4">
          <Link to="/categories" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4" />
            العودة إلى الأقسام
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center text-4xl">
              {category.icon || '📦'}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{category.nameAr}</h1>
              <p className="text-emerald-100 mt-1">
                {category.shopCount} محل | {category.productCount} منتج
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shops Section */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Store className="h-6 w-6 text-emerald-600" />
          المحلات
        </h2>
        {shops.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {shops.map((shop) => (
              <Link key={shop.id} to={`/shops/${shop.id}`}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                      {shop.logo ? (
                        <img
                          src={shop.logo}
                          alt={shop.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Store className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-sm line-clamp-1">{shop.name}</h3>
                    <div className="flex items-center justify-center gap-1 mt-1 text-sm text-gray-500">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {shop.rating || 'جديد'}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-12">لا توجد محلات في هذا القسم</p>
        )}

        {/* Products Section */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-emerald-600" />
          المنتجات
        </h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
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
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.shop?.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-emerald-600">
                        {product.salePrice || product.price} ج.م
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">لا توجد منتجات في هذا القسم</p>
        )}
      </div>
    </div>
  );
}
