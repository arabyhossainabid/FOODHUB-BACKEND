import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = categorySchema.parse(req.body);
    const result = await CategoryService.createCategory(name);
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Category created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CategoryService.getAllCategories();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Categories retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name } = categorySchema.parse(req.body);
    const result = await CategoryService.updateCategory(id as string, name);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Category updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await CategoryService.deleteCategory(id as string);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Category deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const CategoryController = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
};
