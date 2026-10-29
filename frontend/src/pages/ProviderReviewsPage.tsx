import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Review } from '../types';
import { Star, MessageSquare } from 'lucide-react';

export const ProviderReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const provider = user?.provider_profile;

  useEffect(() => {
    if (provider?.id) {
      fetchReviews(provider.id);
    }
  }, [provider?.id]);

  const fetchReviews = async (pId: number) => {
    try {
      const res = await api.get(`/reviews/provider/${pId}`);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Customer Ratings & Reviews</h1>
          <p className="text-xs text-slate-500">
            Provider rating is automatically recalculated in DB after every customer review.
          </p>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
          <div>
            <span className="text-xl font-black text-amber-900">{provider?.rating || 5.0} / 5.0</span>
            <span className="block text-[10px] text-amber-700 font-bold">{provider?.review_count || 0} Total Reviews</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Reviews Yet</h3>
          <p className="text-xs text-slate-500">Customer reviews will automatically appear after completed bookings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{r.customer_name}</span>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">{r.created_at?.split('T')[0]}</span>
              </div>
              <p className="text-xs text-slate-600 italic font-medium">"{r.comment || 'Great service!'}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
