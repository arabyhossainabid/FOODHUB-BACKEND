import express from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';

const router = express.Router();

// Get all meals (Public) with filters
const getAllMeals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, minPrice, maxPrice, providerId, search } = req.query;

    const where: any = { isAvailable: true };

    if (categoryId && typeof categoryId === 'string') where.categoryId = categoryId;
    if (providerId && typeof providerId === 'string') where.providerId = providerId;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const meals = await prisma.meal.findMany({
      where,
      include: {
        provider: {
          include: { user: { select: { name: true } } }
        },
        category: true,
        reviews: {
          select: { rating: true }
        }
      }
    });

    // Calculate average rating for each meal
    const mealsWithRating = meals.map(meal => ({
      ...meal,
      averageRating: meal.reviews.length > 0
        ? meal.reviews.reduce((sum, r) => sum + r.rating, 0) / meal.reviews.length
        : 0
    }));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Meals retrieved successfully',
      data: mealsWithRating
    });
  } catch (error) {
    next(error);
  }
};

// Get single meal details (Public)
const getMealById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const meal = await prisma.meal.findUnique({
      where: { id: id as string },
      include: {
        provider: {
          include: { user: { select: { name: true, email: true } } }
        },
        category: true,
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!meal) {
      throw { statusCode: 404, message: 'Meal not found' };
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Meal retrieved successfully',
      data: meal
    });
  } catch (error) {
    next(error);
  }
};

router.get('/', getAllMeals);
router.get('/:id', getMealById);

export const MealRoutes = router;
