import express from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import auth from '../../middlewares/auth';
import { Role, Prisma } from '@prisma/client';
import { createOrderSchema } from './order.validation';

const router = express.Router();

// Create Order (Customer)
const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw { statusCode: 401, message: 'User not authenticated' };
    }

    const validatedData = createOrderSchema.parse(req.body);
    const { items, address } = validatedData;

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

    // Create Order with Transaction
    const result = await prisma.$transaction(async (tx) => {
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

      return order;
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

router.post('/', auth(Role.CUSTOMER), createOrder);
router.get('/', auth(Role.CUSTOMER), getMyOrders);
router.get('/:id', auth(Role.CUSTOMER), getOrderById);
router.patch('/:id/cancel', auth(Role.CUSTOMER), cancelOrder);

export const OrderRoutes = router;
