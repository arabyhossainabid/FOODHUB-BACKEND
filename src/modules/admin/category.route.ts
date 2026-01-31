import express from 'express';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { CategoryController } from './category.controller';

const router = express.Router();

// Get All Categories (Public)
router.get('/', CategoryController.getAllCategories);

// Category Management (Admin only)
router.post('/', auth(Role.ADMIN), CategoryController.createCategory);
router.put('/:id', auth(Role.ADMIN), CategoryController.updateCategory);
router.delete('/:id', auth(Role.ADMIN), CategoryController.deleteCategory);

export const CategoryRoutes = router;
