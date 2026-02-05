import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryApi, productApi, shopApi, offerApi } from '@/services/api';
import { Category, Product, Shop, Offer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingBag, Store, Tag, TrendingUp } from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredShops, setFeaturedShops] = useState<Shop[]>([]);
  const [featuredOffers, setFeaturedOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes, shopsRes, offersRes] = await Promise.all([
          categoryApi.getCategories(),
          productApi.getFeaturedProducts(8),
          shopApi.getFeaturedShops(6),
          offerApi.getFeaturedOffers(4),
        ]);

        setCategories(categoriesRes.data.data);
        setFeaturedProducts(productsRes.data.data);
        setFeaturedShops(shopsRes.data.data);
        setFeaturedOffers(offersRes.data.data);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              السوق الحضاري الرقمي
            </h1>
            <p className="text-xl text-emerald-100 mb-6">
              اكتشف أفضل المحلات والمنتجات في قنا الجديدة
            </p>
            <p className="text-emerald-100 mb-8">
              تسوق بسهولة من محلاتك المفضلة - خضار وفواكه، ماركت، مخابز، صيدليات، مكتبات وكل ما تحتاجه
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/shops">
                <Button size="lg" variant="secondary" className="gap-2">
                  <Store className="h-5 w-5" />
                  تصفح المحلات
                </Button>
              </Link>
              <Link to="/categories">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  تصفح الأقسام
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-emerald-600" />
            الأقسام
          </h2>
          <Link to="/categories">
            <Button variant="ghost" className="gap-1">
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link key={category.id} to={`/categories/${category.id}`}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{category.icon || '📦'}</span>
                  </div>
                  <h3 className="font-medium">{category.nameAr}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {category.shopCount} محل
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
            منتجات مميزة
          </h2>
          <Link to="/products">
            <Button variant="ghost" className="gap-1">
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredProducts.map((product) => (
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
                  <p className="text-sm text-gray-500">{product.shop?.name}</p>
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
      </section>

      {/* Featured Shops Section */}
      <section className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6 text-emerald-600" />
              محلات مميزة
            </h2>
            <Link to="/shops">
              <Button variant="ghost" className="gap-1">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredShops.map((shop) => (
              <Link key={shop.id} to={`/shops/${shop.id}`}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                      {shop.logo ? (
                        <img
                          src={shop.logo}
                          alt={shop.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Store className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium line-clamp-1">{shop.name}</h3>
                    <p className="text-sm text-gray-500">{shop.category?.nameAr}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Offers Section */}
      {featuredOffers.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Tag className="h-6 w-6 text-emerald-600" />
              عروض خاصة
            </h2>
            <Link to="/offers">
              <Button variant="ghost" className="gap-1">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredOffers.map((offer) => (
              <Card key={offer.id} className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
                <CardContent className="p-6">
                  <Badge className="bg-white text-emerald-700 mb-4">
                    خصم {offer.discountPercent}%
                  </Badge>
                  <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                  <p className="text-emerald-100 text-sm mb-4">{offer.description}</p>
                  <p className="text-sm text-emerald-100">
                    {offer.shop?.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="container mx-auto px-4">
        <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">هل أنت صاحب محل؟</h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            انضم إلى السوق الحضاري الرقمي ووصل إلى المزيد من العملاء في قنا الجديدة
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              <Store className="h-5 w-5" />
              سجل محلك الآن
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
