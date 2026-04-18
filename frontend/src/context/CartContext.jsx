import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load cart from API on mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      loadCart();
    }
  }, []);

  const loadCart = async (options = {}) => {
    const silent = options.silent === true;
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/cart');
      setCartItems(response.data.data || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const addToCart = async (itemType, itemId, quantity = 1) => {
    try {
      const response = await api.post('/cart/add', {
        itemType,
        itemId,
        quantity,
      });
      await loadCart({ silent: true });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add to cart',
      };
    }
  };

  const updateCartItem = async (cartId, quantity) => {
    try {
      await api.put(`/cart/${cartId}`, { quantity });
      await loadCart({ silent: true });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update cart',
      };
    }
  };

  const removeFromCart = async (cartId) => {
    try {
      await api.delete(`/cart/${cartId}`);
      await loadCart({ silent: true });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove from cart',
      };
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCartItems([]);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to clear cart',
      };
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => {
    return sum + (item.unitPrice || 0) * (item.quantity || 0);
  }, 0);

  const cartItemCount = cartItems.reduce((sum, item) => {
    return sum + (item.quantity || 0);
  }, 0);

  const value = {
    cartItems,
    loading,
    cartTotal,
    cartItemCount,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loadCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

