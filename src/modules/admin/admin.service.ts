import { DiscountType, Role } from '@prisma/client';
import prisma from '../../config/prisma';

const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    where: {
      role: { not: Role.ADMIN }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      googleId: true,
      providerProfile: true,
    },
    orderBy: { createdAt: 'desc' }
  });
  return users;
};

const updateUserStatus = async (id: string, isActive: boolean) => {
  const user = await prisma.user.update({
    where: { id },
    data: { isActive }
  });
  return user;
};

/**
 * Permanently removes the user row and dependent data from the database.
 * Provider accounts: removes order lines that reference their meals, drops empty orders,
 * then reviews & meals, then the user (and provider profile via cascade).
 */
const deleteUser = async (targetUserId: string, actingAdminId: string) => {
  if (targetUserId === actingAdminId) {
    throw { statusCode: 400, message: 'You cannot delete your own account' };
  }

  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: targetUserId },
      include: { providerProfile: true },
    });

    if (!target) {
      throw { statusCode: 404, message: 'User not found' };
    }

    if (target.role === Role.ADMIN) {
      throw { statusCode: 403, message: 'Admin accounts cannot be deleted' };
    }

    if (target.providerProfile) {
      const meals = await tx.meal.findMany({
        where: { providerId: target.providerProfile.id },
        select: { id: true },
      });
      const mealIds = meals.map((m) => m.id);

      if (mealIds.length > 0) {
        const affectedItems = await tx.orderItem.findMany({
          where: { mealId: { in: mealIds } },
          select: { orderId: true },
        });
        const affectedOrderIds = [...new Set(affectedItems.map((i) => i.orderId))];

        await tx.orderItem.deleteMany({ where: { mealId: { in: mealIds } } });

        for (const orderId of affectedOrderIds) {
          const remaining = await tx.orderItem.count({ where: { orderId } });
          if (remaining === 0) {
            await tx.order.delete({ where: { id: orderId } });
          }
        }

        await tx.review.deleteMany({ where: { mealId: { in: mealIds } } });
        await tx.meal.deleteMany({ where: { id: { in: mealIds } } });
      }
    }

    await tx.user.delete({ where: { id: targetUserId } });
  });
};

const getAllOrders = async () => {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      orderItems: {
        include: {
          meal: { select: { title: true, price: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  return orders;
};

const getDashboardStats = async () => {
  const [totalUsers, totalProviders, totalOrders, totalMeals, revenueResult, roleDistribution] = await Promise.all([
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.user.count({ where: { role: Role.PROVIDER } }),
    prisma.order.count(),
    prisma.meal.count(),
    prisma.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { totalAmount: true }
    }),
    prisma.user.groupBy({
      by: ['role'],
      _count: true
    })
  ]);

  // Real monthly revenue for last 6 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const realRevenue = await prisma.order.groupBy({
    by: ['createdAt'],
    where: {
      status: 'DELIVERED',
      createdAt: { gte: sixMonthsAgo }
    },
    _sum: { totalAmount: true }
  });

  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = months[d.getMonth()];
    const amount = realRevenue
      .filter(r => new Date(r.createdAt).getMonth() === d.getMonth() && new Date(r.createdAt).getFullYear() === d.getFullYear())
      .reduce((acc, curr) => acc + (curr._sum.totalAmount || 0), 0);
    
    monthlyRevenue.push({ month: monthName, amount });
  }

  return {
    totalUsers,
    totalProviders,
    totalOrders,
    totalMeals,
    totalRevenue: revenueResult._sum.totalAmount || 0,
    roleDistribution,
    monthlyRevenue
  };
};

const getAllReviews = async () => {
  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { name: true, email: true } },
      meal: { select: { title: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return reviews;
};

const deleteReview = async (id: string) => {
  await prisma.review.delete({
    where: { id }
  });
};

const getAllOffers = async () => {
  return prisma.offer.findMany({
    where: {
      code: { not: null },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const createOffer = async (payload: {
  title: string;
  description: string;
  image?: string;
  tag: string;
  color: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  startsAt?: string | Date | null;
  expiresAt?: string | Date | null;
  usageLimit?: number | null;
  isActive?: boolean;
}) => {
  const normalizedCode = payload.code.trim().toUpperCase();
  if (!normalizedCode) {
    throw { statusCode: 400, message: 'Offer code is required' };
  }

  return prisma.offer.create({
    data: {
      title: payload.title,
      description: payload.description,
      image: payload.image || '',
      tag: payload.tag,
      color: payload.color,
      code: normalizedCode,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      minOrderAmount: payload.minOrderAmount ?? 0,
      maxDiscountAmount: payload.maxDiscountAmount ?? null,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      usageLimit: payload.usageLimit ?? null,
      isActive: payload.isActive ?? true,
    },
  });
};

const updateOffer = async (
  id: string,
  payload: Partial<{
    title: string;
    description: string;
        image: string;
    tag: string;
    color: string;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number | null;
    startsAt: string | Date | null;
    expiresAt: string | Date | null;
    usageLimit: number | null;
    usedCount: number;
    isActive: boolean;
  }>,
) => {
  const data = { ...payload } as any;
  if (typeof data.code === 'string') {
    data.code = data.code.trim().toUpperCase();
  }
  if (data.startsAt) {
    data.startsAt = new Date(data.startsAt);
  }
  if (data.expiresAt) {
    data.expiresAt = new Date(data.expiresAt);
  }

  return prisma.offer.update({
    where: { id },
    data,
  });
};

const deleteOffer = async (id: string) => {
  await prisma.offer.delete({ where: { id } });
};

const getHomeContent = async () => {
  return prisma.homeContent.findFirst({
    where: { key: 'HOME_PAGE' },
    orderBy: { updatedAt: 'desc' },
  });
};

const upsertHomeContent = async (content: unknown, isActive = true) => {
  return prisma.homeContent.upsert({
    where: { key: 'HOME_PAGE' },
    update: {
      content: content as any,
      isActive,
    },
    create: {
      key: 'HOME_PAGE',
      content: content as any,
      isActive,
    },
  });
};

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllOrders,
  getDashboardStats,
  getAllReviews,
  deleteReview,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  getHomeContent,
  upsertHomeContent,
};
