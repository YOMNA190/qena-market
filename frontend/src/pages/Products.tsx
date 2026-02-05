import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productApi, categoryApi } from '@/services/api';
import { Product, Category } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingBag, Filter } from 'lucide-react';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const page = parseInt(searchParams.get('page') || '1');
  const categoryId = searchParams.get('categoryId') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          productApi.getProducts({
            page,
            limit: 20,
            categoryId: categoryId || undefined,
            search: searchParams.get('search') || undefined,
            sortBy,
            sortOrder: sortOrder as 'asc' | 'desc',
          }),
          categoryApi.getCategories(),
        ]);
        setProducts(productsRes.data.data);
        setMeta(productsRes.data.meta || { page: 1, totalPages: 1 });
        setCategories(categoriesRes.data.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams, page, categoryId, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) params.set('search', searchQuery);
    else params.delete('search');
    params.set('page', '1');
    setSearchParams(params);
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">المنتجات</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">المنتجات</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Input
              type="search"
              placeholder="ابحث عن منتج..."
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

        <Select value={categoryId} onValueChange={(value) => updateFilter('categoryId', value)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 ml-2" />
            <SelectValue placeholder="القسم" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">جميع الأقسام</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ترتيب حسب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">الأحدث</SelectItem>
            <SelectItem value="price">السعر</SelectItem>
            <SelectItem value="rating">التقييم</SelectItem>
            <SelectItem value="viewCount">الأكثر مشاهدة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
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
            onClick={() => updateFilter('page', String(page - 1))}
          >
            السابق
          </Button>
          <span className="flex items-center px-4">
            صفحة {page} من {meta.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= meta.totalPages}
            onClick={() => updateFilter('page', String(page + 1))}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
