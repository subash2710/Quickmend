import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Service, ProviderService } from '../types';
import { Plus, Trash2, CheckCircle2, Wrench, X, Loader2 } from 'lucide-react';

export const ProviderServicesPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [myServices, setMyServices] = useState<ProviderService[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [myRes, allRes] = await Promise.all([
        api.get('/providers/my-services'),
        api.get('/services'),
      ]);
      setMyServices(myRes.data.services || []);
      setAllServices(allRes.data.services || []);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!selectedServiceId) return;
    setSubmitting(true);
    setError(null);

    try {
      await api.post('/providers/services', {
        service_id: selectedServiceId,
        experience_years: 3,
      });

      await fetchData();
      await refreshUser();
      setModalOpen(false);
      setSelectedServiceId(null);
    } catch (err: any) {
      console.error('Failed to add service:', err);
      setError(err.response?.data?.error || 'Failed to add service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveService = async (psId: number) => {
    try {
      await api.delete(`/providers/services/${psId}`);
      await fetchData();
      await refreshUser();
    } catch (err) {
      console.error('Failed to remove service:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Offered Services</h1>
          <p className="text-xs text-slate-500">
            Select and configure services you provide. Retrieved automatically by QuickMend dispatch.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Service</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myServices.map((ps) => (
            <div
              key={ps.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{ps.service_name}</h3>
                  <p className="text-xs text-slate-500">Base Rate: ₹{ps.base_charge}</p>
                </div>
              </div>

              <button
                onClick={() => handleRemoveService(ps.id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Remove Service"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ADD SERVICE MODAL (SECTION 14) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Select Service to Add</h3>
              <p className="text-xs text-slate-500">Choose from available database services</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-medium rounded-xl border border-rose-200">
                {error}
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allServices.map((svc) => {
                const alreadyAdded = myServices.some((ms) => ms.service_id === svc.id);
                const isSelected = selectedServiceId === svc.id;

                return (
                  <div
                    key={svc.id}
                    onClick={() => !alreadyAdded && setSelectedServiceId(svc.id)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      alreadyAdded
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                        : isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold cursor-pointer'
                        : 'border-slate-200 hover:border-indigo-300 cursor-pointer'
                    }`}
                  >
                    <span className="text-sm">{svc.name}</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {alreadyAdded ? 'Already Added' : `₹${svc.base_price}`}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleAddService}
              disabled={!selectedServiceId || submitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Add Selected Service</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
