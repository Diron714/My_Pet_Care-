import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';
import { Gift, Star, Percent, Calendar, Sparkles, Award, Crown, Trophy, Medal } from 'lucide-react';

// Format currency as LKR
const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount || 0);
};

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffers();
    loadLoyalty();
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/offers');
      setOffers(response.data.data || []);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLoyalty = async () => {
    try {
      const response = await api.get('/customers/loyalty');
      setLoyalty(response.data.data);
    } catch (error) {
      console.error('Error loading loyalty:', error);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'platinum':
        return { gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-100', text: 'text-purple-800', icon: Crown };
      case 'gold':
        return { gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-100', text: 'text-amber-800', icon: Trophy };
      case 'silver':
        return { gradient: 'from-slate-400 to-slate-500', bg: 'bg-slate-100', text: 'text-slate-800', icon: Medal };
      case 'bronze':
        return { gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-100', text: 'text-orange-800', icon: Award };
      default:
        return { gradient: 'from-slate-500 to-slate-600', bg: 'bg-slate-100', text: 'text-slate-800', icon: Award };
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  const tierColors = loyalty ? getTierColor(loyalty.loyalty_tier) : getTierColor('bronze');
  const TierIcon = tierColors.icon;

  return (
    <Layout>
      <div className="page-shell">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Gift className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-black text-slate-800">Offers & Loyalty</h2>
        </div>

        {/* Loyalty Points Card */}
        {loyalty && (
          <div className="card mb-6 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-slate-600" />
                  <h2 className="text-2xl font-bold text-slate-800">Loyalty Points</h2>
                </div>
                <p className="text-5xl font-black text-slate-600 mb-3">{loyalty.loyalty_points}</p>
                <div className="flex items-center gap-2">
                  <div className={`px-4 py-2 rounded-xl bg-gradient-to-br ${tierColors.gradient} flex items-center gap-2 shadow-lg`}>
                    <TierIcon className="w-5 h-5 text-white" />
                    <span className="font-bold text-white capitalize">{loyalty.loyalty_tier} Tier</span>
                  </div>
                </div>
              </div>
              <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-2xl">
                <Gift className="w-16 h-16 text-white opacity-90" />
              </div>
            </div>
          </div>
        )}

        {/* Available Offers */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Available Offers</h2>
          {offers.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Gift}
                title="No offers available"
                message="Check back later for exciting offers"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => (
                <div key={offer.offer_id} className="card hover:shadow-xl transition-all duration-300 border-l-4 border-l-amber-500 overflow-hidden">
                  <div className="relative h-40 bg-gradient-to-br from-amber-500 to-amber-600 mb-4">
                    {offer.image_url ? (
                      <img
                        src={getImageSrc(offer.image_url)}
                        alt={offer.title}
                        className="w-full h-full object-cover opacity-80"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    ) : null}
                    <div className="absolute top-4 right-4">
                      <div className="h-12 w-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <Gift className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-xl text-slate-900 mb-2">{offer.title}</h3>
                    {offer.description && (
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">{offer.description}</p>
                    )}
                    <div className="space-y-3 mb-4">
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-2">
                          <Percent className="w-5 h-5 text-emerald-600" />
                          <p className="text-lg font-black text-emerald-700">
                            {offer.discount_type === 'percentage'
                              ? `${offer.discount_value}% OFF`
                              : `Save ${formatCurrencyLKR(offer.discount_value)}`}
                          </p>
                        </div>
                      </div>
                      {offer.min_purchase > 0 && (
                        <p className="text-xs text-slate-500">
                          Min purchase: {formatCurrencyLKR(offer.min_purchase)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        Valid until {formatDate(offer.valid_until)}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedOffer(offer);
                        setShowDetails(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loyalty Tier Benefits */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-slate-600" />
            <h2 className="text-2xl font-bold text-slate-900">Loyalty Tier Benefits</h2>
          </div>
          <div className="table-shell">
            <table className="table">
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Points Required</th>
                  <th>Benefits</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-semibold flex items-center gap-1 w-fit">
                      <Award className="w-4 h-4" />
                      Bronze
                    </span>
                  </td>
                  <td className="font-semibold">0 - 999</td>
                  <td>Standard benefits</td>
                </tr>
                <tr>
                  <td>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-semibold flex items-center gap-1 w-fit">
                      <Medal className="w-4 h-4" />
                      Silver
                    </span>
                  </td>
                  <td className="font-semibold">1000 - 4999</td>
                  <td>5% discount on all purchases</td>
                </tr>
                <tr>
                  <td>
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold flex items-center gap-1 w-fit">
                      <Trophy className="w-4 h-4" />
                      Gold
                    </span>
                  </td>
                  <td className="font-semibold">5000 - 9999</td>
                  <td>10% discount + priority support</td>
                </tr>
                <tr>
                  <td>
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-semibold flex items-center gap-1 w-fit">
                      <Crown className="w-4 h-4" />
                      Platinum
                    </span>
                  </td>
                  <td className="font-semibold">10000+</td>
                  <td>15% discount + exclusive offers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Offer Details Modal */}
        {showDetails && selectedOffer && (
          <Modal
            isOpen={showDetails}
            onClose={() => setShowDetails(false)}
            title={selectedOffer.title}
            size="lg"
          >
            <div className="space-y-5">
              {selectedOffer.description && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Description</h3>
                  <p className="text-slate-700 leading-relaxed">{selectedOffer.description}</p>
                </div>
              )}
              <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                <h3 className="font-bold text-emerald-900 mb-2">Discount</h3>
                <p className="text-2xl font-black text-emerald-700">
                  {selectedOffer.discount_type === 'percentage'
                    ? `${selectedOffer.discount_value}% OFF`
                    : `Save ${formatCurrencyLKR(selectedOffer.discount_value)}`}
                </p>
              </div>
              {selectedOffer.min_purchase > 0 && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-2">Minimum Purchase</h3>
                  <p className="text-lg font-semibold text-blue-700">{formatCurrencyLKR(selectedOffer.min_purchase)}</p>
                </div>
              )}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="font-bold text-purple-900 mb-2">Validity</h3>
                <p className="text-purple-700">
                  {formatDate(selectedOffer.valid_from)} to {formatDate(selectedOffer.valid_until)}
                </p>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default Offers;
