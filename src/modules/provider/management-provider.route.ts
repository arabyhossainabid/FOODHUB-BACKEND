import express from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { mealSchema, updateMealSchema, updateProfileSchema, updateOrderStatusSchema } from './provider.validation';

const router = express.Router();

// Add Meal (Provider only)
const addMeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) throw { statusCode: 401, message: 'User not authenticated' };

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: (user as any).id }
    });

    if (!providerProfile) throw { statusCode: 400, message: 'Provider profile not found' };

    const validatedData = mealSchema.parse(req.body);

    const meal = await prisma.meal.create({
      data: {
        title: validatedData.title,
        price: typeof validatedData.price === 'string' ? Number(validatedData.price) : validatedData.price,
        description: validatedData.description,
        image: validatedData.image,
        categoryId: validatedData.categoryId,
        providerId: providerProfile.id,
        isAvailable: validatedData.isAvailable ?? true,
      }
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Meal added successfully',
      data: meal
    });
  } catch (error) {
    next(error);
  }
};

// Update Meal (Provider only)
const updateMeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) throw { statusCode: 401, message: 'User not authenticated' };

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: (user as any).id }
    });

    if (!providerProfile) throw { statusCode: 400, message: 'Provider profile not found' };

    const meal = await prisma.meal.findUnique({ where: { id: id as string } });
    if (!meal || meal.providerId !== providerProfile.id) {
      throw { statusCode: 403, message: 'You can only update your own meals' };
    }

    const validatedData = updateMealSchema.parse(req.body);

    const updatedMeal = await prisma.meal.update({
      where: { id: id as string },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.price && { price: typeof validatedData.price === 'string' ? Number(validatedData.price) : validatedData.price }),
        ...(validatedData.categoryId && { categoryId: validatedData.categoryId }),
        ...(validatedData.image !== undefined && { image: validatedData.image }),
        ...(validatedData.isAvailable !== undefined && { isAvailable: validatedData.isAvailable }),
      }
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Meal updated successfully',
      data: updatedMeal
    });
  } catch (error) {
    next(error);
  }
};

// Remove Meal (Provider only)
const deleteMeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) throw { statusCode: 401, message: 'User not authenticated' };

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: (user as any).id }
    });

    if (!providerProfile) throw { statusCode: 400, message: 'Provider profile not found' };

    const meal = await prisma.meal.findUnique({ where: { id: id as string } });
    if (!meal || meal.providerId !== providerProfile.id) {
      throw { statusCode: 403, message: 'You can only delete your own meals' };
    }

    await prisma.meal.delete({ where: { id: id as string } });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Meal deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Update Order Status (Provider only)
const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) throw { statusCode: 401, message: 'User not authenticated' };

    const validatedData = updateOrderStatusSchema.parse(req.body);
    const { status } = validatedData;

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: (user as any).id }
    });

    if (!providerProfile) throw { statusCode: 400, message: 'Provider profile not found' };

    const order = await prisma.order.findFirst({
      where: {
        id: id as string,
        orderItems: { some: { meal: { providerId: providerProfile.id } } }
      }
    });

    if (!order) throw { statusCode: 403, message: 'You can only update orders for your meals' };

    const updatedOrder = await prisma.order.update({
      where: { id: id as string },
      data: { status }
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// Get Provider's Own Orders
const getProviderOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) throw { statusCode: 401, message: 'User not authenticated' };

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: (user as any).id }
    });

    if (!providerProfile) throw { statusCode: 400, message: 'Provider profile not found' };

    const orders = await prisma.order.findMany({
      where: {
        orderItems: { some: { meal: { providerId: providerProfile.id } } }
      },
      include: {
        user: { select: { name: true, email: true } },
        orderItems: {
          where: { meal: { providerId: providerProfile.id } },
          include: { meal: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Provider orders retrieved successfully',
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// Get Provider's Own Meals
const getProviderMeals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) throw { statusCode: 401, message: 'User not authenticated' };

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: (user as any).id }
    });

    if (!providerProfile) throw { statusCode: 400, message: 'Provider profile not found' };

    const meals = await prisma.meal.findMany({
      where: { providerId: providerProfile.id },
      include: { category: true }
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Provider meals retrieved successfully',
      data: meals
    });
  } catch (error) {
    next(error);
  }
};

// Get Provider's Own Profile
const getProviderProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) throw { statusCode: 401, message: 'User not authenticated' };

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: (user as any).id },
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    });

    if (!providerProfile) throw { statusCode: 404, message: 'Provider profile not found' };

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Provider profile retrieved successfully',
      data: providerProfile
    });
  } catch (error) {
    next(error);
  }
};

// Update Provider's Own Profile
const updateProviderProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) throw { statusCode: 401, message: 'User not authenticated' };

    const validatedData = updateProfileSchema.parse(req.body);

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: (user as any).id }
    });

    if (!providerProfile) throw { statusCode: 404, message: 'Provider profile not found' };

    const updatedProfile = await prisma.providerProfile.update({
      where: { id: providerProfile.id },
      data: {
        ...(validatedData.shopName && { shopName: validatedData.shopName }),
        ...(validatedData.address && { address: validatedData.address }),
        ...(validatedData.cuisine !== undefined && { cuisine: validatedData.cuisine }),
      },
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Provider profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    next(error);
  }
};

router.get('/profile', auth(Role.PROVIDER), getProviderProfile);
router.patch('/profile', auth(Role.PROVIDER), updateProviderProfile);
router.get('/meals', auth(Role.PROVIDER), getProviderMeals);
router.post('/meals', auth(Role.PROVIDER), addMeal);
router.put('/meals/:id', auth(Role.PROVIDER), updateMeal);
router.delete('/meals/:id', auth(Role.PROVIDER), deleteMeal);
router.get('/orders', auth(Role.PROVIDER), getProviderOrders);
router.patch('/orders/:id', auth(Role.PROVIDER), updateOrderStatus);

export const ManagementProviderRoutes = router;
