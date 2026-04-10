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

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  getAllOrders,
  getDashboardStats,
  getAllReviews,
  deleteReview
};
