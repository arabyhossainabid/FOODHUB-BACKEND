import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

const generateDescSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
});

const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = chatSchema.parse(req.body);
    const result = await AiService.askAi(message);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'AI response retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const generateMealDescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, category } = generateDescSchema.parse(req.body);
    const result = await AiService.generateMealDescription(title, category);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Meal description generated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const AiController = {
  chat,
  generateMealDescription
};
