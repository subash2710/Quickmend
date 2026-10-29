import React, { useState } from 'react';
import { api } from '../services/api';
import { Star, MessageSquare, Send, X, CheckCircle } from 'lucide-react';

interface RatingModalProps {
  bookingId: number;
  providerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  bookingId,
  providerName,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.post('/reviews', {
        booking_id: bookingId,
        rating,
        comment,
      });

      setSubmitted(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Review submit error:', err);
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Thank You for Your Feedback!</h3>
            <p className="text-sm text-slate-600">
              Provider rating has been automatically recalculated & updated on QuickMend.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Service Feedback</span>
              <h3 className="text-xl font-extrabold text-slate-900">How was your service?</h3>
              <p className="text-xs text-slate-500">Rate your experience with {providerName}</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-medium rounded-xl border border-rose-200">
                {error}
              </div>
            )}

            {/* Interactive Stars */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Write your feedback (optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Punctual, professional, fixed the leak fast..."
                rows={3}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:from-sky-700 hover:to-indigo-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting & Recalculating Rating...' : 'Submit Feedback'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
