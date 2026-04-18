import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import { getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';
import Button from '../../components/common/Button';
import { PawPrint, Search, Filter, RefreshCw, ShoppingCart, XCircle, Dog, Cat, Bird, Rabbit } from 'lucide-react';
import toast from 'react-hot-toast';

// Format currency as LKR
const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount || 0);
};

const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 400;

const PetListing = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const firstFetchRef = useRef(true);
  const [filters, setFilters] = useState({
    species: '',
    breed: '',
    minPrice: '',
    maxPrice: '',
    available: true,
  });
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = searchInput.trim();
      const applied = trimmed.length === 0 || trimmed.length >= SEARCH_MIN_CHARS ? trimmed : '';
      setAppliedSearch((prev) => (prev === applied ? prev : applied));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadPets = useCallback(async () => {
    try {
      if (firstFetchRef.current) {
        setLoading(true);
      } else {
        setListRefreshing(true);
      }
      const params = new URLSearchParams();
      if (filters.species) params.append('species', filters.species);
      if (filters.breed) params.append('breed', filters.breed);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.available) params.append('available', 'true');
      if (appliedSearch) params.append('search', appliedSearch);

      const response = await api.get(`/pets?${params.toString()}`);
      setPets(response.data.data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
      setPets([]);
    } finally {
      setLoading(false);
      setListRefreshing(false);
      firstFetchRef.current = false;
    }
  }, [filters.species, filters.breed, filters.minPrice, filters.maxPrice, filters.available, appliedSearch]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const handleAddToCart = async (petId) => {
    const result = await addToCart('pet', petId, 1);
    if (result.success) {
      toast.success('Added to cart!');
    } else {
      toast.error(result.message);
    }
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
        return {
          gradient: 'from-amber-500 to-amber-600',
          border: 'border-amber-200',
        };
      case 'Cat':
        return {
          gradient: 'from-purple-500 to-purple-600',
          border: 'border-purple-200',
        };
      case 'Bird':
        return {
          gradient: 'from-blue-500 to-blue-600',
          border: 'border-blue-200',
        };
      case 'Rabbit':
        return {
          gradient: 'from-pink-500 to-pink-600',
          border: 'border-pink-200',
        };
      default:
        return {
          gradient: 'from-slate-500 to-slate-600',
          border: 'border-slate-200',
        };
    }
  };

  if (loading && firstFetchRef.current) {
    return (
      <Layout>
        <div className="page-shell flex min-h-[40vh] items-center justify-center">
          <Loading />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-shell">

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-slate-500" />
                <h3 className="font-bold text-lg text-slate-800">Filters</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Species</label>
                  <select
                    value={filters.species}
                    onChange={(e) => setFilters((prev) => ({ ...prev, species: e.target.value }))}
                    className="input-field !rounded-xl !py-3"
                  >
                    <option value="">All Species</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Fish">Fish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Price Range</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                      className="input-field !rounded-xl !py-3"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                      className="input-field !rounded-xl !py-3"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput('');
                    setAppliedSearch('');
                    setFilters({ species: '', breed: '', minPrice: '', maxPrice: '', available: true });
                  }}
                  className="w-full !rounded-xl !py-3 text-slate-600 hover:text-slate-800"
                >
                  <RefreshCw className="w-4 h-4 inline mr-1" />
                  Reset Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={`Type at least ${SEARCH_MIN_CHARS} characters...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-field !rounded-xl !py-3 !pl-10 bg-slate-50"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchInput.trim().length === 1 && (
              <p className="mb-4 text-xs text-amber-700">Enter at least {SEARCH_MIN_CHARS} characters to search.</p>
            )}

            <div className="relative min-h-[12rem]">
              {listRefreshing && (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-[1px]"
                  aria-busy="true"
                  aria-live="polite"
                >
                  <RefreshCw className="h-8 w-8 animate-spin text-slate-500" aria-hidden />
                </div>
              )}
            {!listRefreshing && pets.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={PawPrint}
                  title="No pets found"
                  message="Try adjusting your filters or search terms."
                />
              </div>
            ) : pets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map((pet) => {
                  const SpeciesIcon = getSpeciesIcon(pet.species);
                  const speciesColors = getSpeciesColor(pet.species);

                  return (
                    <div key={pet.pet_id} className="group">
                      <div
                        className={`card overflow-hidden p-0 hover:shadow-xl transition-all duration-300 border-l-4 ${speciesColors.border}`}
                      >
                        <div className="relative h-48 overflow-hidden rounded-t-2xl">
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
                              <SpeciesIcon className="w-16 h-16 text-white opacity-50" />
                            </div>
                          )}
                          <div className="absolute top-4 right-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                pet.is_available
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {pet.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <Link to={`/customer/pets/${pet.pet_id}`}>
                            <h3 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-slate-800 transition-colors">
                              {pet.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className={`h-8 w-8 rounded-lg bg-gradient-to-br ${speciesColors.gradient} flex items-center justify-center shrink-0`}
                            >
                              <SpeciesIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{pet.species}</p>
                              <p className="text-xs text-slate-500">{pet.breed}</p>
                              <p className="text-xs font-semibold text-slate-400 mt-1">{pet.age} months old</p>
                            </div>
                          </div>
                          <p className="text-2xl font-black text-slate-700 mb-4">{formatCurrencyLKR(pet.price)}</p>
                          {pet.is_available && (
                            <Button
                              onClick={() => handleAddToCart(pet.pet_id)}
                              className="w-full !bg-slate-800 hover:!bg-slate-900"
                              size="sm"
                            >
                              <ShoppingCart className="w-4 h-4 inline mr-2" />
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card flex min-h-[12rem] items-center justify-center">
                <Loading />
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PetListing;
