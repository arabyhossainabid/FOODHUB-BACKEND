import express from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();

// Validation Schema
const reviewSchema = z.object({
  mealId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// Add Review (Customer only, after ordering)
const addReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = reviewSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      throw { statusCode: 401, message: 'User not authenticated' };
    }

    // Check if user has ordered this meal
    const hasOrdered = await prisma.order.findFirst({
      where: {
        userId: (user as any).id,
        orderItems: {
          some: {
            mealId: validatedData.mealId
          }
        }
      }
    });

    if (!hasOrdered) {
      throw { statusCode: 403, message: 'You can only review meals you have ordered' };
    }

    const review = await prisma.review.create({
      data: {
        userId: (user as any).id,
        mealId: validatedData.mealId,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Review added successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// Get Reviews for a Meal (Public)
const getMealReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mealId } = req.params;

    if (!mealId || typeof mealId !== 'string') {
      throw { statusCode: 400, message: 'Invalid meal ID' };
    }

    const reviews = await prisma.review.findMany({
      where: { mealId },
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Reviews retrieved successfully',
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

router.post('/', auth(Role.CUSTOMER), addReview);
router.get('/meal/:mealId', getMealReviews);

export const ReviewRoutes = router;
