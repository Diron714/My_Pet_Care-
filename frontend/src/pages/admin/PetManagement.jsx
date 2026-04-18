import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, PawPrint, Search, Filter, RefreshCw, Dog, Cat, Bird, Rabbit, CheckCircle, XCircle, Package, DollarSign, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';
import { getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';

// Format currency as LKR
const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount || 0);
};

const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 400;

const PetManagement = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const firstFetchRef = useRef(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [filters, setFilters] = useState({
    species: '',
    breed: '',
    available: '',
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = searchInput.trim();
      const applied = trimmed.length === 0 || trimmed.length >= SEARCH_MIN_CHARS ? trimmed : '';
      setFilters((prev) => (prev.search === applied ? prev : { ...prev, search: applied }));
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
      if (filters.available) params.append('available', filters.available);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/pets?${params.toString()}`);
      setPets(response.data.data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
      setPets([]);
    } finally {
      setLoading(false);
      setListRefreshing(false);
      setInitialLoad(false);
      firstFetchRef.current = false;
    }
  }, [filters.species, filters.breed, filters.available, filters.search]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const rawSpecies = formData.get('species');
    const customSpecies = formData.get('custom_species')?.toString().trim();
    const species = rawSpecies === '__custom__' ? customSpecies : rawSpecies;

    // Validation
    if (!species) {
      toast.error(rawSpecies === '__custom__' ? 'Please enter a custom species' : 'Species is required');
      return;
    }
    const breed = formData.get('breed')?.toString().trim();
    if (!breed) {
      toast.error('Breed is required');
      return;
    }
    const age = parseInt(formData.get('age'), 10);
    if (isNaN(age) || age < 0) {
      toast.error('Please enter a valid age (months)');
      return;
    }
    const gender = formData.get('gender');
    if (!gender) {
      toast.error('Gender is required');
      return;
    }
    const price = parseFloat(formData.get('price'));
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    const stockQty = parseInt(formData.get('stock_quantity'), 10);
    if (formData.get('stock_quantity') === '' || isNaN(stockQty) || stockQty < 0) {
      toast.error('Please enter a valid stock quantity (0 or more)');
      return;
    }

    const data = {
      name: formData.get('name'),
      species,
      breed: formData.get('breed'),
      age: parseInt(formData.get('age')),
      gender,
      description: formData.get('description'),
      price,
      stock_quantity: stockQty,
      is_available: formData.get('is_available') === 'on',
      ...(imageDataUrl && { image_url: imageDataUrl }),
      ...(editingPet && removeImage && !imageDataUrl && { remove_image: true }),
    };

    try {
      const url = editingPet ? `/pets/${editingPet.pet_id}` : '/pets';
      const method = editingPet ? 'put' : 'post';
      await api[method](url, data);
      toast.success(editingPet ? 'Pet updated' : 'Pet added');
      setShowForm(false);
      setEditingPet(null);
      setImageDataUrl(null);
      setImagePreview(null);
      setRemoveImage(false);
      loadPets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save pet');
    }
  };

  const handleDelete = async (petId) => {
    try {
      setDeleteLoading(true);
      await api.delete(`/pets/${petId}`);
      toast.success('Pet deleted');
      loadPets();
    } catch (error) {
      toast.error('Failed to delete pet');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleToggleAvailability = async (pet) => {
    try {
      await api.put(`/pets/${pet.pet_id}`, {
        ...pet,
        is_available: !pet.is_available,
      });
      toast.success('Availability updated');
      loadPets();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("You don't have permission to update pets. Please log in as an admin user.");
      } else {
        toast.error(error.response?.data?.message || 'Failed to update availability');
      }
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
          bg: 'bg-amber-50',
          border: 'border-amber-200',
        };
      case 'Cat':
        return {
          gradient: 'from-purple-500 to-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
        };
      case 'Bird':
        return {
          gradient: 'from-blue-500 to-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      case 'Rabbit':
        return {
          gradient: 'from-pink-500 to-pink-600',
          bg: 'bg-pink-50',
          border: 'border-pink-200',
        };
      default:
        return {
          gradient: 'from-slate-500 to-slate-600',
          bg: 'bg-slate-50',
          border: 'border-slate-200',
        };
    }
  };

  if (initialLoad && loading) return <Loading />;

  const availablePets = pets.filter(p => p.is_available).length;
  const totalStock = pets.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);

  return (
    <div className="page-shell">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Pets</p>
                <p className="text-2xl font-black text-slate-900">{pets.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Available</p>
                <p className="text-2xl font-black text-emerald-600">{availablePets}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Stock</p>
                <p className="text-2xl font-black text-blue-600">{totalStock}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
              </div>
              <Button onClick={() => {
                setEditingPet(null);
                setImageDataUrl(null);
                setImagePreview(null);
                setRemoveImage(false);
                setShowForm(true);
              }} size="sm" className="!bg-slate-800 hover:!bg-slate-900">
                <Plus className="w-4 h-4 inline mr-2" />
                Add New Pet
              </Button>
            </div>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                Updating
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search pets..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-field pl-10 pr-8"
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
                <p className="mt-1.5 text-xs text-amber-700">Enter at least {SEARCH_MIN_CHARS} characters to search.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Species</label>
              <select
                value={filters.species}
                onChange={(e) => setFilters((prev) => ({ ...prev, species: e.target.value }))}
                className="input-field"
              >
                <option value="">All Species</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Availability</label>
              <select
                value={filters.available}
                onChange={(e) => setFilters((prev) => ({ ...prev, available: e.target.value }))}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput('');
                  setFilters({ species: '', breed: '', available: '', search: '' });
                }}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Pets Grid */}
        {pets.length === 0 && !loading ? (
          <div className="card empty-state-enter">
            <EmptyState
              icon={PawPrint}
              title="No pets found"
              message="No pets match the selected filters"
            />
          </div>
        ) : (
          <div>
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${
                loading ? 'opacity-60 pointer-events-none' : 'opacity-100'
              }`}
            >
            {pets.map((pet, index) => {
              const SpeciesIcon = getSpeciesIcon(pet.species);
              const speciesColors = getSpeciesColor(pet.species);

              return (
                <div
                  key={pet.pet_id}
                  className={`card hover:shadow-xl transition-all duration-300 border-l-4 ${speciesColors.border} overflow-hidden grid-item-enter`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Pet Image */}
                  <div className="relative h-48 overflow-hidden rounded-t-2xl -mx-6 -mt-6 mb-4">
                    {pet.image_url ? (
                      <img
                        src={getImageSrc(pet.image_url)}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${speciesColors.gradient} flex items-center justify-center`}>
                        <SpeciesIcon className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${pet.is_available
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                        }`}>
                        {pet.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Pet Name and Species */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-slate-900 mb-1">{pet.name}</h3>
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${speciesColors.gradient} flex items-center justify-center`}>
                            <SpeciesIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{pet.species}</p>
                            <p className="text-xs text-slate-500">{pet.breed}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 line-clamp-2">{pet.description}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Age</p>
                        <p className="text-sm font-bold text-slate-900">{pet.age} months</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gender</p>
                        <p className="text-sm font-bold text-slate-900 capitalize">{pet.gender}</p>
                      </div>
                    </div>

                    {/* Price and Stock */}
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Price</p>
                        <p className="text-lg font-black text-emerald-700">{formatCurrencyLKR(pet.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Stock</p>
                        <p className={`text-lg font-black ${pet.stock_quantity > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {pet.stock_quantity}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAvailability(pet)}
                        className={`flex-1 ${pet.is_available
                            ? '!bg-rose-50 !text-rose-700 hover:!bg-rose-100'
                            : '!bg-emerald-50 !text-emerald-700 hover:!bg-emerald-100'
                          }`}
                      >
                        {pet.is_available ? (
                          <>
                            <XCircle className="w-4 h-4 inline mr-1" />
                            Mark Unavailable
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Mark Available
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPet(pet);
                          setImageDataUrl(null);
                          setImagePreview(null);
                          setRemoveImage(false);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(pet)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* Pet Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingPet(null);
            setImageDataUrl(null);
            setImagePreview(null);
            setRemoveImage(false);
          }}
          title={editingPet ? 'Edit Pet' : 'Add New Pet'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <PawPrint className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 leading-none mb-1">
                  {editingPet ? 'Update Pet' : 'Register New Pet'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate">
                  {editingPet ? `Editing: ${editingPet.name || editingPet.breed}` : 'Enter pet details for the inventory'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <Input
                label="Pet Name (optional)"
                name="name"
                defaultValue={editingPet?.name || ''}
                placeholder="e.g., Max"
                className="!py-2"
              />
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Species <span className="text-red-500">*</span>
                </label>
                <select
                  name="species"
                  className="input-field !py-2 shadow-sm"
                  required
                  defaultValue={
                    editingPet && !['Dog', 'Cat', 'Bird', 'Rabbit'].includes(editingPet.species)
                      ? '__custom__'
                      : editingPet?.species || ''
                  }
                >
                  <option value="">Select species</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Bird">Bird</option>
                  <option value="Rabbit">Rabbit</option>
                  <option value="__custom__">Other...</option>
                </select>
              </div>

              <Input
                label="Custom Species (if other)"
                name="custom_species"
                defaultValue={
                  editingPet && !['Dog', 'Cat', 'Bird', 'Rabbit'].includes(editingPet.species)
                    ? editingPet.species
                    : ''
                }
                placeholder="e.g., Hamster"
                className="!py-2"
              />
              <Input
                label="Breed"
                name="breed"
                defaultValue={editingPet?.breed || ''}
                required
                placeholder="e.g., Golden Retriever"
                className="!py-2"
              />

              <Input
                label="Age (months)"
                type="number"
                name="age"
                defaultValue={editingPet?.age || ''}
                required
                placeholder="0"
                className="!py-2"
              />
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select name="gender" className="input-field !py-2 shadow-sm" required defaultValue={editingPet?.gender || ''}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <Input
                label="Price (LKR)"
                type="number"
                step="0.01"
                name="price"
                defaultValue={editingPet?.price || ''}
                required
                placeholder="0.00"
                className="!py-2"
              />
              <Input
                label="Stock Qty"
                type="number"
                name="stock_quantity"
                min={0}
                defaultValue={editingPet != null ? editingPet.stock_quantity : ''}
                required
                placeholder="0"
                className="!py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
              <textarea
                name="description"
                rows={2}
                className="input-field !py-2 resize-none shadow-sm"
                defaultValue={editingPet?.description || ''}
                placeholder="Key characteristics..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end border-t border-slate-50 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pet Image</label>
                <div className="flex items-center gap-3">
                  {(imagePreview || (editingPet?.image_url && !removeImage)) && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50 flex-shrink-0">
                      <img
                        src={imagePreview || getImageSrc(editingPet?.image_url)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input type="file" accept="image/*" className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer truncate" onChange={handleImageChange} />
                  {(imagePreview || (editingPet?.image_url && !removeImage)) && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageDataUrl(null);
                        setImagePreview(null);
                        if (editingPet) setRemoveImage(true);
                      }}
                      className="text-[10px] font-black text-rose-500 hover:text-rose-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 px-3 bg-slate-50 rounded-xl border border-slate-100/50">
                <input
                  type="checkbox"
                  name="is_available"
                  defaultChecked={editingPet?.is_available !== false}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  id="is_available"
                />
                <label htmlFor="is_available" className="text-[11px] font-bold text-slate-700 cursor-pointer">
                  Available for Purchase
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 !rounded-2xl !py-3 !bg-blue-600 hover:!bg-blue-700 shadow-lg shadow-blue-600/20">
                <PawPrint className="w-4 h-4 inline mr-2" />
                {editingPet ? 'Update' : 'Add'} Pet
              </Button>
              <Button
                type="button"
                variant="outline"
                className="!rounded-2xl !py-3"
                onClick={() => {
                  setShowForm(false);
                  setEditingPet(null);
                  setImageDataUrl(null);
                  setImagePreview(null);
                  setRemoveImage(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete confirmation dialog */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete pet"
          message={
            deleteTarget
              ? (() => {
                  const name = deleteTarget.name?.trim();
                  const fallback = [deleteTarget.species, deleteTarget.breed].filter(Boolean).join(' ') || 'this pet';
                  const displayName = name || fallback;
                  return `Are you sure you want to delete ${displayName === 'this pet' ? displayName : `pet "${displayName}"`}?`;
                })()
              : ''
          }
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleteLoading}
          onCancel={() => {
            if (deleteLoading) return;
            setDeleteTarget(null);
          }}
          onConfirm={() => deleteTarget && handleDelete(deleteTarget.pet_id)}
        />
      </div>
  );
};

export default PetManagement;
