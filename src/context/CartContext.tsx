import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart, CartItem } from '@/types';
import { cartApi } from '@/services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load cart from localStorage for guests
  const loadGuestCart = useCallback(() => {
    const guestCart = localStorage.getItem('guestCart');
    if (guestCart) {
      setCart(JSON.parse(guestCart));
    }
  }, []);

  // Save cart to localStorage for guests
  const saveGuestCart = useCallback((cartData: Cart | null) => {
    if (cartData) {
      localStorage.setItem('guestCart', JSON.stringify(cartData));
    } else {
      localStorage.removeItem('guestCart');
    }
  }, []);

  // Fetch cart from API for authenticated users
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      loadGuestCart();
      return;
    }

    try {
      setIsLoading(true);
      const response = await cartApi.getCart();
      setCart(response.data.data);
      setItemCount(response.data.data.itemCount || 0);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadGuestCart]);

  // Initial load
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId: string, quantity: number) => {
    if (!isAuthenticated) {
      // Handle guest cart
      // This is a simplified version - in production, you'd want to fetch product details
      return;
    }

    try {
      setIsLoading(true);
      const response = await cartApi.addToCart(productId, quantity);
      setCart(response.data.data);
      setItemCount(response.data.data.itemCount || 0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await cartApi.updateCartItem(itemId, quantity);
      setCart(response.data.data);
      setItemCount(response.data.data.itemCount || 0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const removeItem = useCallback(async (itemId: string) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await cartApi.removeFromCart(itemId);
      setCart(response.data.data);
      setItemCount(response.data.data.itemCount || 0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      localStorage.removeItem('guestCart');
      setCart(null);
      setItemCount(0);
      return;
    }

    try {
      setIsLoading(true);
      await cartApi.clearCart();
      setCart(null);
      setItemCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const refreshCart = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  const value: CartContextType = {
    cart,
    itemCount,
    isLoading,
    addToCart,
    updateItem,
    removeItem,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
