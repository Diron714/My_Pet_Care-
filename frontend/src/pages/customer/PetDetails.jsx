import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';
import {
  PawPrint,
  ShoppingCart,
  Clock,
  ArrowLeft,
  Heart,
  Calendar,
  CheckCircle,
  XCircle,
  User,
  DollarSign,
  Dog,
  Cat,
  Bird,
  Rabbit,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Format currency as LKR
const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount || 0);
};

const getSpeciesIcon = (species) => {
  switch (species) {
    case 'Dog':
      return Dog;
    case 'Cat':
      return Cat;
    case 'Bird':
      return Bird;
    case 'Rabbit':
      return Rabbit;
    default:
      return PawPrint;
  }
};

const getSpeciesColor = (species) => {
  switch (species) {
    case 'Dog':
      return { gradient: 'from-amber-500 to-amber-600', border: 'border-amber-200' };
    case 'Cat':
      return { gradient: 'from-purple-500 to-purple-600', border: 'border-purple-200' };
    case 'Bird':
      return { gradient: 'from-blue-500 to-blue-600', border: 'border-blue-200' };
    case 'Rabbit':
      return { gradient: 'from-pink-500 to-pink-600', border: 'border-pink-200' };
    default:
      return { gradient: 'from-slate-500 to-slate-600', border: 'border-slate-200' };
  }
};

const PetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedPets, setRelatedPets] = useState([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadPetDetails();
  }, [id]);

  const loadPetDetails = async () => {
    try {
      setLoading(true);
      const petRes = await api.get(`/pets/${id}`);
      const petData = petRes.data.data;
      setPet(petData);

      if (petData) {
        const relatedRes = await api.get(`/pets?species=${petData.species}&limit=4`);
        setRelatedPets(relatedRes.data.data?.filter(p => p.pet_id !== parseInt(id)) || []);
      }
    } catch (error) {
      console.error('Error loading pet details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!pet.is_available) {
      toast.error('This pet is not available');
      return;
    }
    const result = await addToCart('pet', pet.pet_id, 1);
    if (result.success) {
      toast.success('Added to cart!');
    } else {
      toast.error(result.message);
    }
  };

  const handlePreBook = () => {
    navigate('/customer/pre-bookings', { state: { itemType: 'pet', itemId: pet.pet_id } });
  };

  if (loading) return <Layout><Loading /></Layout>;
  if (!pet) return <Layout><div className="text-center py-12">Pet not found</div></Layout>;

  const SpeciesIcon = getSpeciesIcon(pet.species);
  const speciesColors = getSpeciesColor(pet.species);

  return (
    <Layout>
      <div className="page-shell">
        <Link to="/customer/pets" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back to Pets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div>
            <div className={`relative h-96 rounded-2xl overflow-hidden border-4 shadow-xl ${speciesColors.border}`}>
              {pet.image_url ? (
                <img
                  src={getImageSrc(pet.image_url)}
                  alt={pet.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.src = PLACEHOLDER_IMAGE;
                  }}
                />
              ) : (
                <div
                  className={`h-full w-full bg-gradient-to-br ${speciesColors.gradient} flex items-center justify-center`}
                >
                  <SpeciesIcon className="w-24 h-24 text-white opacity-50" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${pet.is_available
                  ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-2 border-rose-300'
                  }`}>
                  {pet.is_available ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Available
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Unavailable
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Pet Information */}
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-4">{pet.name}</h1>
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <PawPrint className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Species</p>
                  </div>
                  <p className="font-bold text-blue-900">{pet.species}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-purple-600" />
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Breed</p>
                  </div>
                  <p className="font-bold text-purple-900">{pet.breed}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Age</p>
                  </div>
                  <p className="font-bold text-emerald-900">{pet.age} months</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Gender</p>
                  </div>
                  <p className="font-bold text-amber-900 capitalize">{pet.gender}</p>
                </div>
              </div>
              <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Price</p>
                    <p className="text-3xl font-black text-slate-800">{formatCurrencyLKR(pet.price)}</p>
                  </div>
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {pet.description && (
              <div className="mb-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3">About {pet.name}</h3>
                <p className="text-slate-700 leading-relaxed">{pet.description}</p>
              </div>
            )}

            <div className="flex gap-3">
              {pet.is_available ? (
                <Button onClick={handleAddToCart} className="flex-1 !bg-slate-800 hover:!bg-slate-900 !py-4">
                  <ShoppingCart className="w-5 h-5 inline mr-2" />
                  Add to Cart
                </Button>
              ) : (
                <Button onClick={handlePreBook} variant="outline" className="flex-1 !py-4">
                  <Clock className="w-5 h-5 inline mr-2" />
                  Pre-Book
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Related Pets */}
        {relatedPets.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Related Pets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedPets.map((relatedPet) => {
                const RelIcon = getSpeciesIcon(relatedPet.species);
                const relColors = getSpeciesColor(relatedPet.species);
                return (
                  <Link key={relatedPet.pet_id} to={`/customer/pets/${relatedPet.pet_id}`}>
                    <div
                      className={`card hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 ${relColors.border}`}
                    >
                      <div className="relative h-48 overflow-hidden rounded-t-2xl">
                        {relatedPet.image_url ? (
                          <img
                            src={getImageSrc(relatedPet.image_url)}
                            alt={relatedPet.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = PLACEHOLDER_IMAGE;
                            }}
                          />
                        ) : (
                          <div
                            className={`h-full w-full bg-gradient-to-br ${relColors.gradient} flex items-center justify-center`}
                          >
                            <RelIcon className="w-16 h-16 text-white opacity-50" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg text-slate-900 mb-1">{relatedPet.name}</h3>
                        <p className="text-sm text-slate-600 mb-2">{relatedPet.breed}</p>
                        <p className="text-lg font-black text-slate-600">{formatCurrencyLKR(relatedPet.price)}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PetDetails;
