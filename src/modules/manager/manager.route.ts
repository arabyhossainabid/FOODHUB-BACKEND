import express from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

// GET /manager/stats (Manager dashboard)
const getManagerStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [pendingOrders, deliveredOrders7d, revenue7d, activeProviders, newCustomers7d] = await Promise.all([
      prisma.order.count({
        where: { status: { in: ['PLACED', 'PREPARING', 'READY'] } },
      }),
      prisma.order.count({
        where: { status: 'DELIVERED', createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.order.aggregate({
        where: { status: 'DELIVERED', createdAt: { gte: sevenDaysAgo } },
        _sum: { totalAmount: true },
      }),
      prisma.providerProfile.count(),
      prisma.user.count({
        where: { role: 'CUSTOMER', createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Manager stats retrieved successfully',
      data: {
        managedRevenue7d: revenue7d._sum.totalAmount || 0,
        pendingOrders,
        activeProviders,
        deliveredOrders7d,
        newCustomers7d,
      },
    });
  } catch (error) {
    next(error);
  }
};

router.get('/stats', auth(Role.MANAGER), getManagerStats);

export const ManagerRoutes = router;

