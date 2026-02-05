import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productApi } from '@/services/api';
import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    if (!query) return;

    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await productApi.searchProducts(query, { page, limit: 20 });
        setProducts(response.data.data);
        setMeta(response.data.meta || { page: 1, totalPages: 1 });
      } catch (error) {
        console.error('Failed to search products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [query, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery, page: '1' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">البحث</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-xl">
          <Input
            type="search"
            placeholder="ابحث عن منتجات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <button
            type="submit"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </form>

      {/* Results */}
      {query ? (
        <>
          <p className="text-gray-500 mb-4">
            نتائج البحث عن &quot;{query}&quot;
          </p>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
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

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setSearchParams({ q: query, page: String(page - 1) })}
                  >
                    السابق
                  </Button>
                  <span className="flex items-center px-4">
                    صفحة {page} من {meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= meta.totalPages}
                    onClick={() => setSearchParams({ q: query, page: String(page + 1) })}
                  >
                    التالي
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">لا توجد نتائج للبحث</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">أدخل كلمة البحث للبدء</p>
        </div>
      )}
    </div>
  );
}
