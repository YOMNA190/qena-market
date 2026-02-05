import { prisma } from '../index';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/error.middleware';

export class CartService {
  // Get user's cart
  async getCart(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                },
                shop: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      // Create empty cart
      const newCart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { sortOrder: 'asc' },
                    take: 1,
                  },
                  shop: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      return this.calculateCartTotals(newCart);
    }

    return this.calculateCartTotals(cart);
  }

  // Add item to cart
  async addToCart(userId: string, productId: string, quantity: number) {
    // Validate quantity
    if (quantity < 1) {
      throw new ValidationError('الكمية يجب أن تكون على الأقل 1');
    }

    // Check if product exists and is active
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
        shop: {
          status: 'ACTIVE',
        },
      },
    });

    if (!product) {
      throw new NotFoundError('المنتج غير موجود أو غير متاح');
    }

    // Check stock
    if (product.stock < quantity) {
      throw new ValidationError(`الكمية المتوفرة: ${product.stock}`);
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        throw new ValidationError(`الكمية المتوفرة: ${product.stock}`);
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  // Update cart item quantity
  async updateCartItem(userId: string, itemId: string, quantity: number) {
    // Validate quantity
    if (quantity < 0) {
      throw new ValidationError('الكمية غير صالحة');
    }

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundError('السلة غير موجودة');
    }

    // Get cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundError('العنصر غير موجود في السلة');
    }

    // Remove item if quantity is 0
    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
      return this.getCart(userId);
    }

    // Check stock
    if (cartItem.product.stock < quantity) {
      throw new ValidationError(`الكمية المتوفرة: ${cartItem.product.stock}`);
    }

    // Update quantity
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  // Remove item from cart
  async removeFromCart(userId: string, itemId: string) {
    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundError('السلة غير موجودة');
    }

    // Get cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundError('العنصر غير موجود في السلة');
    }

    // Delete item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  // Clear cart
  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return { message: 'السلة فارغة' };
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'تم تفريغ السلة' };
  }

  // Get cart item count
  async getCartItemCount(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!cart) {
      return { count: 0 };
    }

    // Get total items count (sum of quantities)
    const result = await prisma.cartItem.aggregate({
      where: { cartId: cart.id },
      _sum: { quantity: true },
    });

    return { count: result._sum.quantity || 0 };
  }

  // Sync cart (for logged in users)
  async syncCart(userId: string, items: { productId: string; quantity: number }[]) {
    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Clear existing items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Add new items
    const validItems = [];
    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: {
          id: item.productId,
          isActive: true,
          shop: {
            status: 'ACTIVE',
          },
        },
      });

      if (product && product.stock >= item.quantity && item.quantity > 0) {
        validItems.push({
          cartId: cart.id,
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    }

    if (validItems.length > 0) {
      await prisma.cartItem.createMany({
        data: validItems,
      });
    }

    return this.getCart(userId);
  }

  // Validate cart before checkout
  async validateCart(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                shop: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ValidationError('السلة فارغة');
    }

    const errors = [];
    const warnings = [];

    for (const item of cart.items) {
      // Check if product is still active
      if (!item.product.isActive) {
        errors.push(`المنتج "${item.product.name}" لم يعد متوفراً`);
        continue;
      }

      // Check if shop is active
      if (item.product.shop.status !== 'ACTIVE') {
        errors.push(`المحل "${item.product.shop.name}" مغلق حالياً`);
        continue;
      }

      // Check stock
      if (item.product.stock < item.quantity) {
        if (item.product.stock === 0) {
          errors.push(`المنتج "${item.product.name}" نفذ من المخزون`);
        } else {
          warnings.push(`الكمية المتوفرة من "${item.product.name}": ${item.product.stock}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      cart: this.calculateCartTotals(cart),
    };
  }

  // Helper: Calculate cart totals
  private calculateCartTotals(cart: any) {
    let subtotal = 0;
    let itemCount = 0;

    for (const item of cart.items) {
      const price = item.product.salePrice || item.product.price;
      const itemTotal = Number(price) * item.quantity;
      subtotal += itemTotal;
      itemCount += item.quantity;
    }

    const deliveryFee = subtotal > 200 ? 0 : 25; // Free delivery for orders > 200 EGP
    const total = subtotal + deliveryFee;

    return {
      ...cart,
      subtotal,
      deliveryFee,
      total,
      itemCount,
    };
  }
}

export const cartService = new CartService();
