import express from 'express';
import { AuthRoutes } from './modules/auth/auth.route';
import { PublicProviderRoutes } from './modules/provider/public-provider.route';
import { ManagementProviderRoutes } from './modules/provider/management-provider.route';
import { MealRoutes } from './modules/meal/meal.route';
import { OrderRoutes } from './modules/order/order.route';
import { AdminRoutes } from './modules/admin/admin.route';
import { CategoryRoutes } from './modules/admin/category.route';
import { ReviewRoutes } from './modules/review/review.route';

const router = express.Router();

const moduleRoutes = [

  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/provider', // Management routes
    route: ManagementProviderRoutes,
  },
  {
    path: '/meals', // Public routes
    route: MealRoutes,
  },
  {
    path: '/providers', // Public routes
    route: PublicProviderRoutes,
  },
  {
    path: '/orders', // Customer routes
    route: OrderRoutes,
  },
  {
    path: '/admin', // Admin routes
    route: AdminRoutes,
  },
  {
    path: '/admin/categories',
    route: CategoryRoutes,
  },
  {
    path: '/reviews',
    route: ReviewRoutes,
  },
];

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'FoodHub API is healthy and running',
    data: {
      timestamp: new Date().toISOString(),
      status: 'UP'
    }
  });
});

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
