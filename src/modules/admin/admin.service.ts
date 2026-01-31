import { Role } from '@prisma/client';
import prisma from '../../config/prisma';

const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    where: {
      role: { not: Role.ADMIN }
    },
    include: { providerProfile: true },
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
  const [totalUsers, totalProviders, totalOrders, totalMeals, revenueResult] = await Promise.all([
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.user.count({ where: { role: Role.PROVIDER } }),
    prisma.order.count(),
    prisma.meal.count(),
    prisma.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { totalAmount: true }
    })
  ]);

  return {
    totalUsers,
    totalProviders,
    totalOrders,
    totalMeals,
    totalRevenue: revenueResult._sum.totalAmount || 0
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

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  getAllOrders,
  getDashboardStats,
  getAllReviews,
  deleteReview
};
