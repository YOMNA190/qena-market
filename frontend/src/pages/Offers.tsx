import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { offerApi } from '@/services/api';
import { Offer } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag, Percent, Clock, ArrowLeft } from 'lucide-react';

export default function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await offerApi.getActiveOffers({ limit: 50 });
        setOffers(response.data.data);
      } catch (error) {
        console.error('Failed to fetch offers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">العروض</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Tag className="h-8 w-8 text-emerald-600" />
        العروض
      </h1>

      {offers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {offers.map((offer) => (
            <Card
              key={offer.id}
              className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-white text-emerald-700 text-lg px-3 py-1">
                    <Percent className="h-4 w-4 inline ml-1" />
                    {offer.discountPercent}%
                  </Badge>
                  <Clock className="h-5 w-5 text-emerald-100" />
                </div>

                <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                <p className="text-emerald-100 text-sm mb-4">{offer.description}</p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-100">{offer.shop?.name}</span>
                  <Link
                    to={`/shops/${offer.shop?.id}`}
                    className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    تصفح
                    <ArrowLeft className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">لا توجد عروض حالياً</p>
        </div>
      )}
    </div>
  );
}
