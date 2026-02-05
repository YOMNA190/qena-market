import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '@/services/api';
import { Favorite } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Heart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Favorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await userApi.getFavorites();
      setFavorites(response.data.data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await userApi.removeFromFavorites(productId);
      setFavorites(favorites.filter((f) => f.product.id !== productId));
      toast.success('تم إزالة المنتج من المفضلة');
    } catch (error) {
      toast.error('فشل إزالة المنتج');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">المفضلة</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Heart className="h-24 w-24 mx-auto mb-6 text-gray-300" />
        <h1 className="text-2xl font-bold mb-4">المفضلة فارغة</h1>
        <p className="text-gray-500 mb-6">لم تقم بإضافة أي منتجات إلى المفضلة بعد</p>
        <Link to="/products">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <ShoppingBag className="h-5 w-5 ml-2" />
            تصفح المنتجات
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">المفضلة</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {favorites.map((favorite) => (
          <Card key={favorite.id} className="group">
            <div className="aspect-square bg-gray-100 relative">
              <Link to={`/products/${favorite.product.id}`}>
                {favorite.product.images?.[0] ? (
                  <img
                    src={favorite.product.images[0].imageUrl}
                    alt={favorite.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ShoppingBag className="h-12 w-12" />
                  </div>
                )}
              </Link>
              <button
                onClick={() => handleRemove(favorite.product.id)}
                className="absolute top-2 left-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
            <CardContent className="p-4">
              <Link to={`/products/${favorite.product.id}`}>
                <h3 className="font-medium line-clamp-1 hover:text-emerald-600">
                  {favorite.product.name}
                </h3>
              </Link>
              <p className="text-sm text-gray-500">{favorite.product.shop?.name}</p>
              <p className="font-bold text-emerald-600 mt-2">
                {favorite.product.salePrice || favorite.product.price} ج.م
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
