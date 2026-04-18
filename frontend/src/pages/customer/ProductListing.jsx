import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import { getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';
import Button from '../../components/common/Button';
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  ShoppingCart,
  Utensils,
  Gamepad2,
  Sparkles,
  Scissors,
  Heart,
  XCircle,
} from 'lucide-react';
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

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const firstFetchRef = useRef(true);
  const [filters, setFilters] = useState({ category: '' });
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

  const loadProducts = useCallback(async () => {
    try {
      if (firstFetchRef.current) {
        setLoading(true);
      } else {
        setListRefreshing(true);
      }
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (appliedSearch) params.append('search', appliedSearch);

      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setListRefreshing(false);
      firstFetchRef.current = false;
    }
  }, [filters.category, appliedSearch]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddToCart = async (productId) => {
    const result = await addToCart('product', productId, 1);
    if (result.success) {
      toast.success('Added to cart!');
    } else {
      toast.error(result.message);
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
          border: 'border-amber-200',
          text: 'text-amber-700',
        };
      case 'Toys':
        return {
          gradient: 'from-blue-500 to-blue-600',
          border: 'border-blue-200',
          text: 'text-blue-700',
        };
      case 'Accessories':
        return {
          gradient: 'from-purple-500 to-purple-600',
          border: 'border-purple-200',
          text: 'text-purple-700',
        };
      case 'Grooming':
        return {
          gradient: 'from-pink-500 to-pink-600',
          border: 'border-pink-200',
          text: 'text-pink-700',
        };
      case 'Health':
        return {
          gradient: 'from-emerald-500 to-emerald-600',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
        };
      default:
        return {
          gradient: 'from-slate-500 to-slate-600',
          border: 'border-slate-200',
          text: 'text-slate-700',
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
                <h3 className="font-bold text-lg text-slate-800">Category</h3>
              </div>
              <div className="space-y-5">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                  className="input-field !rounded-xl !py-3"
                >
                  <option value="">All Categories</option>
                  <option value="Food">Food</option>
                  <option value="Toys">Toys</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Grooming">Grooming</option>
                  <option value="Health">Health</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput('');
                    setAppliedSearch('');
                    setFilters({ category: '' });
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
            {!listRefreshing && products.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={Package}
                  title="No products found"
                  message="Try adjusting your filters or search terms"
                />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const CategoryIcon = getCategoryIcon(product.category);
                  const categoryStyles = getCategoryStyles(product.category);

                  return (
                    <div key={product.product_id} className="group">
                      <div
                        className={`card overflow-hidden p-0 hover:shadow-xl transition-all duration-300 border-l-4 ${categoryStyles.border}`}
                      >
                        <div className="relative h-48 overflow-hidden rounded-t-2xl">
                          {product.image_url ? (
                            <img
                              src={getImageSrc(product.image_url)}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.src = PLACEHOLDER_IMAGE;
                              }}
                            />
                          ) : (
                            <div
                              className={`h-full w-full bg-gradient-to-br ${categoryStyles.gradient} flex items-center justify-center`}
                            >
                              <CategoryIcon className="w-16 h-16 text-white opacity-50" />
                            </div>
                          )}
                          <div className="absolute top-4 right-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                product.stock_quantity > 0
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                          {product.stock_quantity > 0 && product.stock_quantity < 10 && (
                            <div className="absolute top-4 left-4">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-700">
                                Low Stock
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <Link to={`/customer/products/${product.product_id}`}>
                            <h3 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-slate-800 transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className={`h-8 w-8 rounded-lg bg-gradient-to-br ${categoryStyles.gradient} flex items-center justify-center shrink-0`}
                            >
                              <CategoryIcon className="w-4 h-4 text-white" />
                            </div>
                            <p className={`text-sm font-semibold ${categoryStyles.text}`}>{product.category}</p>
                          </div>
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-2xl font-black text-slate-700">{formatCurrencyLKR(product.price)}</p>
                            <span className="text-xs font-semibold text-slate-400">Stock: {product.stock_quantity}</span>
                          </div>
                          {product.stock_quantity > 0 && (
                            <Button
                              onClick={() => handleAddToCart(product.product_id)}
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

export default ProductListing;
