import express from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import auth from '../../middlewares/auth';
import { Role, Prisma } from '@prisma/client';
import { createOrderSchema } from './order.validation';

const router = express.Router();
const isOfferCurrentlyValid = (offer: {
  isActive: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
}) => {
  const now = new Date();
  if (!offer.isActive) return false;
  if (offer.startsAt && offer.startsAt > now) return false;
  if (offer.expiresAt && offer.expiresAt < now) return false;
  if (offer.usageLimit !== null && offer.usedCount >= offer.usageLimit) return false;
  return true;
};

const calculateOfferDiscount = (
  offer: {
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number | null;
  },
  subtotal: number,
) => {
  if (subtotal < offer.minOrderAmount) return 0;
  const rawDiscount =
    offer.discountType === 'PERCENTAGE'
      ? Math.round((subtotal * offer.discountValue) / 100)
      : Math.round(offer.discountValue);
  const cappedDiscount =
    offer.maxDiscountAmount !== null
      ? Math.min(rawDiscount, offer.maxDiscountAmount)
      : rawDiscount;
  return Math.max(0, Math.min(cappedDiscount, subtotal));
};

// Create Order (Customer)
const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw { statusCode: 401, message: 'User not authenticated' };
    }

    const validatedData = createOrderSchema.parse(req.body);
    const { items, address, offerCode } = validatedData;

    let totalAmount = 0;
    const orderItemsData: any[] = [];

    // Calculate total and prepare order items
    for (const item of items) {
      const meal = await prisma.meal.findUnique({
        where: { id: item.mealId }
      });

      if (!meal) {
        throw { statusCode: 404, message: `Meal with ID ${item.mealId} not found` };
      }

      if (!meal.isAvailable) {
        throw { statusCode: 400, message: `Meal "${meal.title}" is currently unavailable` };
      }

      totalAmount += meal.price * item.quantity;
      orderItemsData.push({
        mealId: meal.id,
        quantity: item.quantity,
        price: meal.price
      });
    }

    let appliedOffer: {
      id: string;
      code: string;
      discountAmount: number;
    } | null = null;

    if (offerCode) {
      const normalizedCode = offerCode.trim().toUpperCase();
      const offer = await prisma.offer.findUnique({
        where: { code: normalizedCode },
      });

      if (!offer || !offer.code || !isOfferCurrentlyValid(offer)) {
        throw { statusCode: 400, message: 'Invalid or inactive offer code' };
      }

      const discountAmount = calculateOfferDiscount(offer, totalAmount);
      if (discountAmount <= 0) {
        throw { statusCode: 400, message: `Order must be at least ${offer.minOrderAmount} for this offer` };
      }
      totalAmount = totalAmount - discountAmount;
      appliedOffer = { id: offer.id, code: offer.code, discountAmount };
    }

    // Create Order with Transaction
    const result = await prisma.$transaction(async (tx) => {
      if (appliedOffer) {
        await tx.offer.update({
          where: { id: appliedOffer.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      const order = await tx.order.create({
        data: {
          userId: (user as any).id,
          address,
          totalAmount,
          status: 'PLACED'
        }
      });

      // Validating and creating order items
      await tx.orderItem.createMany({
        data: orderItemsData.map(item => ({
          orderId: order.id,
          mealId: item.mealId,
          quantity: item.quantity,
          price: item.price
        }))
      });

      return {
        ...order,
        appliedOffer: appliedOffer
          ? { code: appliedOffer.code, discountAmount: appliedOffer.discountAmount }
          : null,
      };
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Order created successfully',
      data: result
    });

  } catch (error) {
    next(error);
  }
};

// Get My Orders (Customer)
const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw { statusCode: 401, message: 'User not authenticated' };
    }

    const orders = await prisma.order.findMany({
      where: { userId: (user as any).id },
      include: { orderItems: { include: { meal: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Orders retrieved successfully',
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// Get Order Details by ID (Customer)
const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw { statusCode: 401, message: 'User not authenticated' };
    }

    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: {
        id: id as string,
        userId: (user as any).id
      },
      include: {
        orderItems: {
          include: {
            meal: {
              include: {
                provider: {
                  include: { user: { select: { name: true, email: true } } }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw { statusCode: 404, message: 'Order not found' };
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Order retrieved successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Cancel Order (Customer) - Only if status is PLACED
const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw { statusCode: 401, message: 'User not authenticated' };
    }

    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: {
        id: id as string,
        userId: (user as any).id
      }
    });

    if (!order) {
      throw { statusCode: 404, message: 'Order not found' };
    }

    if (order.status !== 'PLACED') {
      throw { statusCode: 400, message: 'Only orders with PLACED status can be cancelled' };
    }

    const cancelledOrder = await prisma.order.update({
      where: { id: id as string },
      data: { status: 'CANCELLED' }
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Order cancelled successfully',
      data: cancelledOrder
    });
  } catch (error) {
    next(error);
  }
};

// Get My Stats (Customer Dashboard)
const getMyStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw { statusCode: 401, message: 'User not authenticated' };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSpent, statusCounts, lastOrders, weeklySpending, ordersThisMonth, pendingDeliveries] = await Promise.all([
      prisma.order.aggregate({
        where: { userId: (user as any).id, status: 'DELIVERED' },
        _sum: { totalAmount: true }
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { userId: (user as any).id },
        _count: true
      }),
      prisma.order.findMany({
        where: { userId: (user as any).id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { orderItems: { include: { meal: true } } }
      }),
      // Weekly trend
      prisma.order.groupBy({
        by: ['createdAt'],
        where: { 
          userId: (user as any).id, 
          status: 'DELIVERED',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        _sum: { totalAmount: true }
      }),
      prisma.order.count({
        where: { userId: (user as any).id, createdAt: { gte: startOfMonth } },
      }),
      prisma.order.count({
        where: {
          userId: (user as any).id,
          status: { in: ['PLACED', 'PREPARING', 'READY'] },
        },
      }),
    ]);

    // Format weekly spending into days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const spendingTrend = days.map(day => {
       const amount = weeklySpending
         .filter(ws => days[new Date(ws.createdAt).getDay()] === day)
         .reduce((acc, current) => acc + (current._sum.totalAmount || 0), 0);
       return { day, amount };
    });

    const total = totalSpent._sum.totalAmount || 0;

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Stats retrieved successfully',
      data: {
        totalSpent: total,
        ordersThisMonth,
        pendingDeliveries,
        statusCounts,
        lastOrders,
        spendingTrend,
        rewardPoints: Math.floor(total * 0.1), // 1 point per $10 spent as reward
        savedMeals: 0,
      }
    });
  } catch (error) {
    next(error);
  }
};

router.get('/stats', auth(Role.CUSTOMER), getMyStats);
router.post('/', auth(Role.CUSTOMER), createOrder);
router.get('/', auth(Role.CUSTOMER), getMyOrders);
router.get('/:id', auth(Role.CUSTOMER), getOrderById);
router.patch('/:id/cancel', auth(Role.CUSTOMER), cancelOrder);

export const OrderRoutes = router;
