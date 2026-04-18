import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { getImageSrc } from '../../utils/helpers';

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, [filters, search]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (search) params.append('search', search);

      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Browse Products</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64">
            <div className="card">
              <h3 className="font-semibold mb-4">Category</h3>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input-field"
              >
                <option value="">All Categories</option>
                <option value="Food">Food</option>
                <option value="Toys">Toys</option>
                <option value="Accessories">Accessories</option>
                <option value="Grooming">Grooming</option>
              </select>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder="Search products..."
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

            {products.length === 0 ? (
              <EmptyState title="No products found" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link key={product.product_id} to={`/customer/products/${product.product_id}`}>
                    <div className="card hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="bg-gray-200 h-48 rounded-lg mb-4 flex items-center justify-center">
                        {product.image_url ? (
                          <img src={getImageSrc(product.image_url)} alt={product.name} className="h-full w-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-gray-600 text-sm">{product.category}</p>
                      <p className="text-primary-600 font-bold mt-2">{formatCurrency(product.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductListing;

