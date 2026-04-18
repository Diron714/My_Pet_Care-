import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { getImageSrc } from '../../utils/helpers';

const PetListing = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    species: '',
    breed: '',
    minPrice: '',
    maxPrice: '',
    available: true,
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPets();
  }, [filters, search]);

  const loadPets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.species) params.append('species', filters.species);
      if (filters.breed) params.append('breed', filters.breed);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.available) params.append('available', 'true');
      if (search) params.append('search', search);

      const response = await api.get(`/pets?${params.toString()}`);
      setPets(response.data.data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <Layout>
        <Loading />
      </Layout>
    );

  const trendingPets = pets.slice(0, 4);
  const morePets = pets.slice(4);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-120px)] bg-slate-900/60 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-slate-950/70 backdrop-blur-2xl border border-slate-800/80 shadow-[0_32px_80px_rgba(15,23,42,0.9)] overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left navigation / filters */}
            <aside className="w-full md:w-60 bg-slate-950/80 border-b md:border-b-0 md:border-r border-slate-800/80 p-4 md:p-5 space-y-6">
          <div>
                <h2 className="text-lg font-semibold text-slate-50">Pet Browser</h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  Filter by species and price to discover pets.
                </p>
        </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-[0.16em]">
                    Species
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['', 'Dog', 'Cat', 'Bird'].map((species) => {
                      const active = filters.species === species || (!filters.species && species === '');
                      const label = species || 'All';
                      return (
                        <button
                          key={species || 'all'}
                          type="button"
                          onClick={() => setFilters({ ...filters, species })}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            active
                              ? 'bg-emerald-400 text-slate-900 shadow-md shadow-emerald-500/40'
                              : 'bg-slate-900/70 text-slate-200 border border-slate-700/70 hover:bg-slate-800'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-[0.16em]">
                    Price range
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className="w-20 rounded-full bg-slate-900/80 border border-slate-700/70 text-[11px] text-slate-100 px-3 py-1.5 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                    />
                    <span className="text-slate-500 text-xs">–</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className="w-20 rounded-full bg-slate-900/80 border border-slate-700/70 text-[11px] text-slate-100 px-3 py-1.5 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFilters({ species: '', breed: '', minPrice: '', maxPrice: '', available: true })
                  }
                  className="text-xs text-slate-300 hover:text-emerald-300 underline underline-offset-4"
                >
                  Reset filters
                </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-4 relative">
              <input
                type="text"
                      placeholder="Search by name, breed, or species..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pr-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

                {/* Hero card using first trending pet if exists */}
                {trendingPets.length > 0 && (
                  <Link to={`/customer/pets/${trendingPets[0].pet_id}`}>
                    <div className="relative rounded-3xl bg-gradient-to-r from-emerald-500/40 via-slate-900/70 to-slate-900/90 overflow-hidden shadow-xl cursor-pointer group">
                      <div className="absolute inset-0">
                        {trendingPets[0].image_url && (
                          <img
                            src={getImageSrc(trendingPets[0].image_url)}
                            alt={trendingPets[0].name}
                            className="h-full w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-transparent" />
                      </div>
                      <div className="relative p-5 md:p-7 flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {trendingPets[0].species && (
                              <span className="px-3 py-1 rounded-full bg-slate-900/80 text-[10px] font-semibold text-emerald-200 border border-emerald-400/40">
                                {trendingPets[0].species}
                              </span>
                            )}
                            {trendingPets[0].breed && (
                              <span className="px-3 py-1 rounded-full bg-slate-900/60 text-[10px] font-semibold text-slate-200 border border-slate-600/60">
                                {trendingPets[0].breed}
                              </span>
                            )}
                          </div>
                          <h2 className="text-xl md:text-2xl font-semibold text-slate-50 mb-2">
                            {trendingPets[0].name}
                          </h2>
                          <p className="text-xs md:text-sm text-slate-300 max-w-md">
                            Meet {trendingPets[0].name}, a wonderful companion looking for a new home.
                          </p>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                          <p className="text-sm font-semibold text-emerald-300">
                            {formatCurrency(trendingPets[0].price)}
                          </p>
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 text-[11px] font-medium text-slate-100 border border-slate-700/70">
                            View details
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Trending now grid */}
                {trendingPets.length > 1 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm md:text-base font-medium text-slate-100">
                        Trending now
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trendingPets.slice(1).map((pet) => (
                        <Link key={pet.pet_id} to={`/customer/pets/${pet.pet_id}`}>
                          <div className="group rounded-3xl bg-slate-900/80 border border-slate-700/80 hover:border-emerald-400/70 transition-all shadow-lg shadow-slate-900/60 overflow-hidden cursor-pointer">
                            <div className="relative h-40 overflow-hidden">
                              {pet.image_url ? (
                                <img
                                  src={getImageSrc(pet.image_url)}
                                  alt={pet.name}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
            ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
                                  Photo coming soon
                                </div>
                              )}
                            </div>
                            <div className="p-4 space-y-1">
                              <h3 className="text-sm font-semibold text-slate-50 truncate">
                                {pet.name}
                              </h3>
                              <p className="text-[11px] text-slate-300 truncate">
                                {pet.breed} {pet.species ? `• ${pet.species}` : ''}
                              </p>
                              <p className="text-sm font-semibold text-emerald-300 pt-1">
                                {formatCurrency(pet.price)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* More pets grid */}
                {morePets.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm md:text-base font-medium text-slate-100">
                      More pets for you
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {morePets.map((pet) => (
                  <Link key={pet.pet_id} to={`/customer/pets/${pet.pet_id}`}>
                          <div className="group rounded-3xl bg-slate-900/80 border border-slate-700/80 hover:border-emerald-400/70 transition-all shadow-lg shadow-slate-900/60 overflow-hidden cursor-pointer">
                            <div className="relative h-36 overflow-hidden">
                        {pet.image_url ? (
                          <img
                            src={getImageSrc(pet.image_url)}
                            alt={pet.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
                                  Photo coming soon
                                </div>
                        )}
                      </div>
                            <div className="p-3 space-y-1">
                              <h3 className="text-sm font-semibold text-slate-50 truncate">
                                {pet.name}
                              </h3>
                              <p className="text-[11px] text-slate-300 truncate">
                        {pet.breed} {pet.species ? `• ${pet.species}` : ''}
                      </p>
                              <p className="text-xs font-semibold text-emerald-300 pt-1">
                                {formatCurrency(pet.price)}
                              </p>
                            </div>
                    </div>
                  </Link>
                ))}
              </div>
                  </div>
            )}

                {pets.length === 0 && (
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl py-16">
                    <EmptyState
                      title="No pets found"
                      message="Try adjusting your filters or search to discover more pets."
                    />
                  </div>
                )}
              </div>

              {/* Right column: simple summary list */}
              <aside className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-800/80 p-5 space-y-5 bg-slate-950/70">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-2">
                    Recently added
                  </h3>
                  <div className="space-y-3">
                    {pets.slice(0, 5).map((pet) => (
                      <Link key={`recent-${pet.pet_id}`} to={`/customer/pets/${pet.pet_id}`}>
                        <div className="flex items-center gap-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-400/70 transition-all p-2.5 cursor-pointer">
                          <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                            {pet.image_url ? (
                              <img
                                src={getImageSrc(pet.image_url)}
                                alt={pet.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-500">
                                No photo
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-100 truncate">
                              {pet.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {pet.breed || pet.species || 'Pet'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {pets.length === 0 && (
                      <p className="text-[11px] text-slate-500">
                        Pets will appear here once available.
                      </p>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
    </Layout>
  );
};

export default PetListing;

