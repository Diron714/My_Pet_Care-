import React, { useState, useEffect, useRef, useCallback } from 'react';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Edit, Trash2, Package, Search, Filter, RefreshCw, CheckCircle, XCircle, DollarSign, ShoppingBag, Utensils, Gamepad2, Sparkles, Scissors, Heart, CheckCircle2 } from 'lucide-react';
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

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const firstFetchRef = useRef(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
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

  const loadProducts = useCallback(async () => {
    try {
      if (firstFetchRef.current) {
        setLoading(true);
      } else {
        setListRefreshing(true);
      }
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.available) params.append('available', filters.available);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setListRefreshing(false);
      setInitialLoad(false);
      firstFetchRef.current = false;
    }
  }, [filters.category, filters.available, filters.search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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
    const rawCategory = formData.get('category');
    const customCategory = formData.get('custom_category')?.toString().trim();
    const category = rawCategory === '__custom__' ? customCategory : rawCategory;

    // Validation
    if (!category) {
      toast.error(rawCategory === '__custom__' ? 'Please enter a custom category' : 'Category is required');
      return;
    }
    const name = formData.get('name')?.toString().trim();
    if (!name) {
      toast.error('Product name is required');
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
      name,
      category,
      description: formData.get('description'),
      price,
      stock_quantity: stockQty,
      is_available: formData.get('is_available') === 'on',
      ...(imageDataUrl && { image_url: imageDataUrl }),
      ...(editingProduct && removeImage && !imageDataUrl && { remove_image: true }),
    };

    try {
      const url = editingProduct ? `/products/${editingProduct.product_id}` : '/products';
      const method = editingProduct ? 'put' : 'post';
      await api[method](url, data);
      toast.success(editingProduct ? 'Product updated' : 'Product added');
      setShowForm(false);
      setEditingProduct(null);
      setImageDataUrl(null);
      setImagePreview(null);
      setRemoveImage(false);
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      await api.put(`/products/${product.product_id}`, {
        ...product,
        is_available: !product.is_available,
      });
      toast.success('Availability updated');
      loadProducts();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("You don't have permission to update products. Please log in as an admin user.");
      } else {
        toast.error(error.response?.data?.message || 'Failed to update availability');
      }
    }
  };

  const handleDelete = async (productId) => {
    try {
      setDeleteLoading(true);
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted');
      loadProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Food':
        return Utensils;
      case 'Toys':
        return Gamepad2;
      case 'Accessories':
        return Sparkles;
      case 'Grooming':
        return Scissors;
      case 'Health':
        return Heart;
      default:
        return Package;
    }
  };

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'Food':
        return {
          gradient: 'from-amber-500 to-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
        };
      case 'Toys':
        return {
          gradient: 'from-blue-500 to-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
        };
      case 'Accessories':
        return {
          gradient: 'from-purple-500 to-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
        };
      case 'Grooming':
        return {
          gradient: 'from-pink-500 to-pink-600',
          bg: 'bg-pink-50',
          border: 'border-pink-200',
          text: 'text-pink-700',
        };
      case 'Health':
        return {
          gradient: 'from-emerald-500 to-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
        };
      default:
        return {
          gradient: 'from-slate-500 to-slate-600',
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-700',
        };
    }
  };

  if (initialLoad && loading) return <Loading />;

  const availableProducts = products.filter(p => p.is_available).length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
  const lowStock = products.filter(p => p.stock_quantity < 10 && p.stock_quantity > 0).length;

  return (
    <div className="page-shell">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Products</p>
                <p className="text-2xl font-black text-slate-900">{products.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Available</p>
                <p className="text-2xl font-black text-emerald-600">{availableProducts}</p>
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
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Low Stock</p>
                <p className="text-2xl font-black text-amber-600">{lowStock}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                <XCircle className="w-6 h-6 text-white" />
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
                setEditingProduct(null);
                setImageDataUrl(null);
                setImagePreview(null);
                setRemoveImage(false);
                setShowForm(true);
              }} size="sm" className="!bg-slate-800 hover:!bg-slate-900">
                <Plus className="w-4 h-4 inline mr-2" />
                Add New Product
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
                  placeholder="Search products..."
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="input-field"
              >
                <option value="">All Categories</option>
                <option value="Food">Food</option>
                <option value="Toys">Toys</option>
                <option value="Accessories">Accessories</option>
                <option value="Grooming">Grooming</option>
                <option value="Health">Health</option>
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
                  setFilters({ category: '', available: '', search: '' });
                }}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 && !loading ? (
          <div className="card empty-state-enter">
            <EmptyState
              icon={Package}
              title="No products found"
              message="No products match the selected filters"
            />
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${
              loading ? 'opacity-60 pointer-events-none' : 'opacity-100'
            }`}
          >
            {products.map((product, index) => {
              const CategoryIcon = getCategoryIcon(product.category);
              const categoryStyles = getCategoryStyles(product.category);

              return (
                <div
                  key={product.product_id}
                  className={`card hover:shadow-xl transition-all duration-300 border-l-4 ${categoryStyles.border} overflow-hidden grid-item-enter`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Product Image */}
                  <div className="relative h-48 overflow-hidden rounded-t-2xl -mx-6 -mt-6 mb-4">
                    {product.image_url ? (
                        <img
                        src={getImageSrc(product.image_url)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${categoryStyles.gradient} flex items-center justify-center`}>
                        <CategoryIcon className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${product.is_available
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                        }`}>
                        {product.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-700">
                          Low Stock
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Product Name and Category */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-slate-900 mb-1">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${categoryStyles.gradient} flex items-center justify-center`}>
                            <CategoryIcon className="w-4 h-4 text-white" />
                          </div>
                          <p className={`text-sm font-semibold ${categoryStyles.text}`}>{product.category}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>

                    {/* Price and Stock */}
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Price</p>
                        <p className="text-lg font-black text-emerald-700">{formatCurrencyLKR(product.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Stock</p>
                        <p className={`text-lg font-black ${product.stock_quantity > 0
                            ? product.stock_quantity < 10
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                            : 'text-rose-700'
                          }`}>
                          {product.stock_quantity}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAvailability(product)}
                        className={`flex-1 ${product.is_available
                            ? '!bg-rose-50 !text-rose-700 hover:!bg-rose-100'
                            : '!bg-emerald-50 !text-emerald-700 hover:!bg-emerald-100'
                          }`}
                      >
                        {product.is_available ? (
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
                          setEditingProduct(product);
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
                        onClick={() => setDeleteTarget(product)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Product Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
            setImageDataUrl(null);
            setImagePreview(null);
            setRemoveImage(false);
          }}
          title={editingProduct ? 'Edit Product' : 'Add New Product'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 leading-none mb-1">
                  {editingProduct ? 'Update Product' : 'Register New Product'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate">
                  {editingProduct ? `Editing: ${editingProduct.name}` : 'Enter product details for the inventory'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <Input
                label="Product Name"
                name="name"
                defaultValue={editingProduct?.name || ''}
                required
                placeholder="Product title"
                className="!py-2"
              />
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  className="input-field !py-2 shadow-sm"
                  required
                  defaultValue={
                    editingProduct && !['Food', 'Toys', 'Accessories', 'Grooming', 'Health'].includes(editingProduct.category)
                      ? '__custom__'
                      : editingProduct?.category || ''
                  }
                >
                  <option value="">Select category</option>
                  <option value="Food">Food</option>
                  <option value="Toys">Toys</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Grooming">Grooming</option>
                  <option value="Health">Health</option>
                  <option value="__custom__">Other...</option>
                </select>
              </div>

              <Input
                label="Custom Category (if other)"
                name="custom_category"
                defaultValue={
                  editingProduct && !['Food', 'Toys', 'Accessories', 'Grooming', 'Health'].includes(editingProduct.category)
                    ? editingProduct.category
                    : ''
                }
                placeholder="e.g., Bedding"
                className="!py-2"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price (LKR)"
                  type="number"
                  step="0.01"
                  name="price"
                  defaultValue={editingProduct?.price || ''}
                  required
                  placeholder="0.00"
                  className="!py-2"
                />
                <Input
                  label="Stock Qty"
                  type="number"
                  name="stock_quantity"
                  min={0}
                  defaultValue={editingProduct != null ? editingProduct.stock_quantity : ''}
                  required
                  placeholder="0"
                  className="!py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
              <textarea
                name="description"
                rows={2}
                className="input-field !py-2 resize-none shadow-sm"
                defaultValue={editingProduct?.description || ''}
                placeholder="Product features and benefits..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end border-t border-slate-50 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Product Image</label>
                <div className="flex items-center gap-3">
                  {(imagePreview || (editingProduct?.image_url && !removeImage)) && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50 flex-shrink-0">
                      <img
                        src={imagePreview || getImageSrc(editingProduct?.image_url)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input type="file" accept="image/*" className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer truncate" onChange={handleImageChange} />
                  {(imagePreview || (editingProduct?.image_url && !removeImage)) && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageDataUrl(null);
                        setImagePreview(null);
                        if (editingProduct) setRemoveImage(true);
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
                  defaultChecked={editingProduct?.is_available !== false}
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
                <Package className="w-4 h-4 inline mr-2" />
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
              <Button
                type="button"
                variant="outline"
                className="!rounded-2xl !py-3"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
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
          title="Delete product"
          message={
            deleteTarget
              ? (() => {
                  const name = deleteTarget.name?.trim();
                  const fallback = deleteTarget.category || 'this product';
                  const displayName = name || fallback;
                  return `Are you sure you want to delete ${displayName === 'this product' ? displayName : `product "${displayName}"`}?`;
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
          onConfirm={() => deleteTarget && handleDelete(deleteTarget.product_id)}
        />
      </div>
  );
};

export default ProductManagement;
