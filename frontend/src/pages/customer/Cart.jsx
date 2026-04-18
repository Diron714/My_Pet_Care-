import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { useCart } from '../../context/CartContext';
import { getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  ArrowRight,
  Tag,
  Truck,
  PawPrint,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Utensils,
  Gamepad2,
  Sparkles,
  Scissors,
  Heart,
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
      return { gradient: 'from-amber-500 to-amber-600', border: 'border-amber-200' };
    case 'Toys':
      return { gradient: 'from-blue-500 to-blue-600', border: 'border-blue-200' };
    case 'Accessories':
      return { gradient: 'from-purple-500 to-purple-600', border: 'border-purple-200' };
    case 'Grooming':
      return { gradient: 'from-pink-500 to-pink-600', border: 'border-pink-200' };
    case 'Health':
      return { gradient: 'from-emerald-500 to-emerald-600', border: 'border-emerald-200' };
    default:
      return { gradient: 'from-slate-500 to-slate-600', border: 'border-slate-200' };
  }
};

const getCartItemVisuals = (item) => {
  if (item.item_type === 'pet') {
    return {
      PlaceholderIcon: getSpeciesIcon(item.species),
      ...getSpeciesColor(item.species),
    };
  }
  if (item.item_type === 'product') {
    return {
      PlaceholderIcon: getCategoryIcon(item.category),
      ...getCategoryStyles(item.category),
    };
  }
  return {
    PlaceholderIcon: Package,
    gradient: 'from-slate-500 to-slate-600',
    border: 'border-slate-200',
  };
};

const Cart = () => {
  const { cartItems, loading, cartTotal, updateCartItem, removeFromCart, loadCart } = useCart();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    loadCart({ silent: true });
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const response = await api.get('/offers');
      setOffers(response.data.data || []);
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  };

  const handleQuantityChange = async (item, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(item.cart_id);
      toast.success('Item removed from cart');
    } else {
      // Stock Validation
      if (newQuantity > (item.stock_quantity || 0)) {
        toast.error(`Only ${item.stock_quantity} units available in stock`);
        return;
      }
      await updateCartItem(item.cart_id, newQuantity);
    }
  };

  const handleRemove = async (cartId) => {
    await removeFromCart(cartId);
    toast.success('Item removed from cart');
  };

  const getItemTitle = (item) => item.name || item.item_name || 'Item';

  const getItemDetailLine = (item) => {
    if (item.item_type === 'pet') {
      const parts = [item.species, item.breed].filter(Boolean);
      if (item.pet_age != null && item.pet_age !== '') {
        parts.push(`${item.pet_age} months old`);
      }
      return parts.length ? parts.join(' · ') : null;
    }
    if (item.item_type === 'product' && item.category) {
      return item.category;
    }
    return null;
  };

  const calculateBestDiscount = () => {
    if (offers.length === 0) return 0;
    return Math.max(...offers.map(offer => {
      if (offer.discount_type === 'percentage') {
        return (cartTotal * offer.discount_value) / 100;
      } else if (offer.discount_type === 'fixed_amount') {
        return Math.min(offer.discount_value, cartTotal);
      }
      return 0;
    }));
  };

  if (loading) return <Layout><Loading /></Layout>;

  const displayItems = cartItems;
  const subtotal = cartTotal;
  const potentialDiscount = calculateBestDiscount();
  const shipping = subtotal > 0 ? 500 : 0;
  const total = subtotal - 0 + shipping; // Only deduct discount at checkout to match route logic

  return (
    <Layout>
      <div className="page-shell">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Shopping Cart</h2>
            <p className="text-sm text-slate-500">Review your items and proceed</p>
          </div>
        </div>

        {displayItems.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={ShoppingCart}
              title="Your cart is empty"
              message="Start shopping to add items to your cart"
              action={
                <Link to="/customer/products">
                  <Button className="!bg-slate-800 hover:!bg-slate-900">
                    <Package className="w-4 h-4 inline mr-2" />
                    Browse Products
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {displayItems.map((item) => {
                const detailLine = getItemDetailLine(item);
                const { PlaceholderIcon, gradient, border } = getCartItemVisuals(item);
                return (
                <div
                  key={item.cart_id}
                  className={`card hover:shadow-xl transition-all duration-300 border-l-4 ${border}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Item image or styled placeholder */}
                    <div
                      className={`relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 border-2 ${border}`}
                    >
                      {item.image_url ? (
                        <img
                          src={getImageSrc(item.image_url)}
                          alt={getItemTitle(item)}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = PLACEHOLDER_IMAGE;
                          }}
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
                        >
                          <PlaceholderIcon className="w-12 h-12 text-white opacity-50" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 mb-1">{getItemTitle(item)}</h3>
                          {detailLine ? (
                            <p className="text-sm text-slate-600">{detailLine}</p>
                          ) : (
                            <p className="text-sm text-slate-500 capitalize">
                              {item.item_type === 'pet' ? 'Pet' : item.item_type === 'product' ? 'Product' : item.item_type}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(item.cart_id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 border-2 border-slate-200 rounded-xl overflow-hidden">
                            <button
                              onClick={() => handleQuantityChange(item, item.quantity - 1)}
                              className="p-2 hover:bg-slate-100 transition-colors"
                            >
                              <Minus className="w-4 h-4 text-slate-600" />
                            </button>
                            <span className="px-4 py-2 font-semibold text-slate-900 min-w-[3rem] text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item, item.quantity + 1)}
                              disabled={item.quantity >= (item.stock_quantity || 0)}
                              className={`p-2 transition-colors ${item.quantity >= (item.stock_quantity || 0) ? 'bg-slate-100 opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                            >
                              <Plus className="w-4 h-4 text-slate-600" />
                            </button>
                          </div>

                          {/* Unit Price */}
                          <div className="text-sm">
                            <p className="text-slate-500">Unit Price</p>
                            <p className="font-semibold text-slate-700">{formatCurrencyLKR(item.unitPrice)}</p>
                          </div>
                        </div>

                        {/* Total Price */}
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total</p>
                          <p className="text-xl font-black text-slate-600">
                            {formatCurrencyLKR((item.unitPrice || 0) * (item.quantity || 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-4">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <ShoppingCart className="w-5 h-5 text-slate-600" />
                  <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold text-slate-900">{formatCurrencyLKR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Potential Savings
                    </span>
                    <span className="font-semibold text-emerald-600">-{formatCurrencyLKR(potentialDiscount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      Shipping
                    </span>
                    <span className="font-semibold text-slate-900">{formatCurrencyLKR(shipping)}</span>
                  </div>
                  <div className="pt-4 border-t-2 border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-slate-900">Total</span>
                      <span className="text-2xl font-black text-slate-600">{formatCurrencyLKR(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Button
                    onClick={() => navigate('/customer/checkout')}
                    className="w-full !bg-slate-800 hover:!bg-slate-900 !py-3.5"
                  >
                    <ArrowRight className="w-4 h-4 inline mr-2" />
                    Proceed to Checkout
                  </Button>
                  <Link to="/customer/products" className="block w-full">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>

                {/* Security Badge */}
                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Package className="w-4 h-4" />
                    <span>Secure checkout • Free returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
