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

// Offer Management
router.get('/offers', auth(Role.ADMIN), AdminController.getAllOffers);
router.post('/offers', auth(Role.ADMIN), AdminController.createOffer);
router.patch('/offers/:id', auth(Role.ADMIN), AdminController.updateOffer);
router.delete('/offers/:id', auth(Role.ADMIN), AdminController.deleteOffer);

// Home Content Management
router.get('/home-content', auth(Role.ADMIN), AdminController.getHomeContent);
router.put('/home-content', auth(Role.ADMIN), AdminController.upsertHomeContent);

export const AdminRoutes = router;
