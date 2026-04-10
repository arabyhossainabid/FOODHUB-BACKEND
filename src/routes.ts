import express from 'express';
import { AuthRoutes } from './modules/auth/auth.route';
import { PublicProviderRoutes } from './modules/provider/public-provider.route';
import { ManagementProviderRoutes } from './modules/provider/management-provider.route';
import { MealRoutes } from './modules/meal/meal.route';
import { OrderRoutes } from './modules/order/order.route';
import { AdminRoutes } from './modules/admin/admin.route';
import { CategoryRoutes } from './modules/admin/category.route';
import { ReviewRoutes } from './modules/review/review.route';
import { MetaRoutes } from './modules/meta/meta.route';
import { PaymentRoutes } from './modules/payment/payment.route';
import { UploadRoutes } from './modules/upload/upload.route';

const router = express.Router();

// Health Check
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

// Explicit Route Registration for better reliability
router.use('/meta', MetaRoutes);
router.use('/reviews', ReviewRoutes);
router.use('/auth', AuthRoutes);
router.use('/meals', MealRoutes);
router.use('/providers', PublicProviderRoutes);
router.use('/orders', OrderRoutes);
router.use('/payments', PaymentRoutes);
router.use('/uploads', UploadRoutes);
router.use('/admin', AdminRoutes);
router.use('/admin/categories', CategoryRoutes);
router.use('/provider', ManagementProviderRoutes);

export default router;
