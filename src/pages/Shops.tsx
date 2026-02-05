import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { shopApi } from '@/services/api';
import { Shop } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Store, Star } from 'lucide-react';

export default function Shops() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState<Shop[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setIsLoading(true);
        const response = await shopApi.getShops({
          page,
          limit: 20,
          search: searchParams.get('search') || undefined,
        });
        setShops(response.data.data);
        setMeta(response.data.meta || { page: 1, totalPages: 1 });
      } catch (error) {
        console.error('Failed to fetch shops:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
  }, [searchParams, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    params.set('page', '1');
    setSearchParams(params);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">المحلات</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">المحلات</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-md">
          <Input
            type="search"
            placeholder="ابحث عن محل..."
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

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shops.map((shop) => (
          <Link key={shop.id} to={`/shops/${shop.id}`}>
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
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
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{shop.name}</h3>
                    <p className="text-sm text-gray-500">{shop.category?.nameAr}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {shop.rating || 'جديد'}
                      </span>
                      <span>{shop.productCount} منتج</span>
                    </div>
                    {shop.address && (
                      <p className="text-sm text-gray-400 mt-1 truncate">
                        {shop.address}
                      </p>
                    )}
                  </div>
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
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('page', String(page - 1));
              setSearchParams(params);
            }}
          >
            السابق
          </Button>
          <span className="flex items-center px-4">
            صفحة {page} من {meta.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= meta.totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('page', String(page + 1));
              setSearchParams(params);
            }}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
