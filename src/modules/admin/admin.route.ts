import express from 'express';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { AdminController } from './admin.controller';

const router = express.Router();

// User Management
router.get('/users', auth(Role.ADMIN), AdminController.getAllUsers);
router.patch('/users/:id', auth(Role.ADMIN), AdminController.updateUserStatus);

// Order Oversight
router.get('/orders', auth(Role.ADMIN), AdminController.getAllOrders);

// Dashboard Statistics
router.get('/stats', auth(Role.ADMIN), AdminController.getDashboardStats);

// Review Management
router.get('/reviews', auth(Role.ADMIN), AdminController.getAllReviews);
router.delete('/reviews/:id', auth(Role.ADMIN), AdminController.deleteReview);

export const AdminRoutes = router;
