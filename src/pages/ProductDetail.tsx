import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productApi, cartApi } from '@/services/api';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Store, Star, Plus, Minus, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productApi.getProductById(id!);
        setProduct(response.data.data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      await cartApi.addToCart(product!.id, quantity);
      toast.success('تم إضافة المنتج إلى السلة');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إضافة المنتج إلى السلة');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 mb-8" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">المنتج غير موجود</h1>
        <Link to="/products">
          <Button>العودة إلى المنتجات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Link to="/products" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        العودة إلى المنتجات
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0].imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingBag className="h-24 w-24" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{product.category?.nameAr}</Badge>
            {product.salePrice && <Badge className="bg-red-500">خصم</Badge>}
          </div>

          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center gap-4 mb-4">
            <span className="flex items-center gap-1 text-yellow-500">
              <Star className="h-5 w-5 fill-current" />
              {product.rating || 'جديد'}
            </span>
            <span className="text-gray-500">({product.reviewCount} تقييم)</span>
          </div>

          <Link
            to={`/shops/${product.shop?.id}`}
            className="inline-flex items-center gap-2 text-emerald-600 hover:underline mb-6"
          >
            <Store className="h-4 w-4" />
            {product.shop?.name}
          </Link>

          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-emerald-600">
              {product.salePrice || product.price} ج.م
            </span>
            {product.salePrice && (
              <span className="text-xl text-gray-400 line-through">
                {product.price} ج.م
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Check className="h-4 w-4 text-emerald-600" />
            {product.stock > 0 ? `متوفر (${product.stock} قطعة)` : 'غير متوفر'}
          </div>

          {/* Quantity and Add to Cart */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-3 hover:bg-gray-100"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                size="lg"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? (
                  'جاري الإضافة...'
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5 ml-2" />
                    أضف إلى السلة
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {/* TODO: Add related products section */}
    </div>
  );
}
