import express from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { Role } from '@prisma/client';

const router = express.Router();

// Get Public Global Stats (for homepage)
const getPublicStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statsResult = await Promise.all([
      prisma.user.count({ where: { role: Role.CUSTOMER } }),
      prisma.meal.count(),
      prisma.user.count({ where: { role: Role.PROVIDER } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.review.aggregate({
        _avg: { rating: true }
      })
    ]);

    const [totalUsers, totalMeals, totalProviders, deliveredOrders, reviewStats] = statsResult;

    res.status(200).json({
      success: true,
      data: {
        customers: 250000 + (totalUsers || 0),
        chefs: 1200 + (totalProviders || 0),
        meals: totalMeals || 0,
        radius: 50,
        deliveredOrders: deliveredOrders || 0,
        rating: reviewStats?._avg?.rating || 4.95
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get All Active Offers (Public)
const getAllOffers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let offers = await prisma.offer.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (offers.length === 0) {
      const initialOffers = [
        {
          title: 'Flash Deal: 50% Off',
          description: 'Get 50% off on all burgers this weekend. Limited time offer!',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&h=400&auto=format&fit=crop',
          tag: 'Limited Time',
          color: 'bg-red-500',
        },
        {
          title: 'Buy 1 Get 1 Free',
          description: 'Order any large pizza and get a medium one absolutely free.',
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&h=400&auto=format&fit=crop',
          tag: 'BOGO',
          color: 'bg-orange-500',
        },
        {
          title: 'Free Delivery',
          description: 'Join FoodHub Plus and get free delivery on all orders over $20.',
          image: 'https://images.unsplash.com/photo-1526367790999-0150786486a9?q=80&w=600&h=400&auto=format&fit=crop',
          tag: 'Plus Member',
          color: 'bg-green-500',
        },
      ];
      await prisma.offer.createMany({ data: initialOffers });
      offers = await prisma.offer.findMany({ where: { isActive: true } });
    }

    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    next(error);
  }
};

router.get('/stats', getPublicStats);
router.get('/offers', getAllOffers);
router.get('/test', (req, res) => res.json({ success: true, message: 'Meta module is reachable' }));

export const MetaRoutes = router;
